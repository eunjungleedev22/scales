"use client";
/**
 * Audio engine wrapping Tone.js.
 * - Tone is imported lazily (client-only), and started only after a user gesture.
 * - Every timeline playback stops the previous one, so audio never overlaps.
 */
import type { Instrument, NoteEvent } from "@/lib/music/events";
import { midiToFrequency } from "@/lib/theory/notes";

type ToneNS = typeof import("tone");
export type AudioStatus = "idle" | "loading" | "ready" | "error";

interface PlayOptions {
  loop?: boolean;
  /** Loop length in beats (defaults to the end of the last event, rounded up to a bar) */
  lengthBeats?: number;
  /** Called on every 16th step with the step index (UI thread, synced via Tone.Draw) */
  onStep?: (step: number) => void;
  onEnd?: () => void;
}

/* eslint-disable @typescript-eslint/no-explicit-any */
class AudioEngine {
  private Tone: ToneNS | null = null;
  private loadPromise: Promise<ToneNS> | null = null;
  private inst: Partial<Record<Instrument, any>> = {};
  private listeners = new Set<() => void>();
  private generation = 0;
  status: AudioStatus = "idle";
  error: string | null = null;
  playing = false;
  private volumeDb = -8;

  subscribe = (fn: () => void) => {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  };
  private emit() {
    this.listeners.forEach((l) => l());
  }
  getSnapshot = () => `${this.status}|${this.playing}`;

  /** Must be called from a user gesture at least once (mobile autoplay policy). */
  async init(): Promise<boolean> {
    try {
      if (!this.loadPromise) {
        this.status = "loading";
        this.emit();
        this.loadPromise = import("tone");
      }
      const Tone = await this.loadPromise;
      this.Tone = Tone;
      if (Tone.getContext().state !== "running") await Tone.start();
      if (!this.inst.keys) this.build(Tone);
      this.status = "ready";
      this.error = null;
      this.emit();
      return true;
    } catch (e) {
      this.status = "error";
      this.error = e instanceof Error ? e.message : String(e);
      this.emit();
      return false;
    }
  }

  get ready() {
    return this.status === "ready" && this.Tone?.getContext().state === "running";
  }

  private build(Tone: ToneNS) {
    Tone.getDestination().volume.value = this.volumeDb;
    const comp = new Tone.Compressor(-18, 3).toDestination();
    const reverb = new Tone.Freeverb({ roomSize: 0.6, dampening: 3000, wet: 0.18 }).connect(comp);

    const keysFilter = new Tone.Filter(2600, "lowpass").connect(reverb);
    this.inst.keys = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: "fatsawtooth", count: 2, spread: 14 },
      envelope: { attack: 0.005, decay: 0.35, sustain: 0.35, release: 0.7 },
      volume: -14,
    }).connect(keysFilter);
    this.inst.keys.maxPolyphony = 32;

    const padFilter = new Tone.Filter(1600, "lowpass").connect(reverb);
    this.inst.pad = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: "fattriangle", count: 3, spread: 20 },
      envelope: { attack: 0.25, decay: 0.4, sustain: 0.7, release: 1.2 },
      volume: -12,
    }).connect(padFilter);

    this.inst.bass = new Tone.MonoSynth({
      oscillator: { type: "sawtooth" },
      filter: { Q: 5, type: "lowpass", rolloff: -24 },
      envelope: { attack: 0.004, decay: 0.2, sustain: 0.5, release: 0.08 },
      filterEnvelope: { attack: 0.002, decay: 0.18, sustain: 0.25, release: 0.2, baseFrequency: 140, octaves: 3.2 },
      volume: -9,
    }).connect(comp);

    const leadFilter = new Tone.Filter(3200, "lowpass").connect(reverb);
    this.inst.lead = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: "square" },
      envelope: { attack: 0.005, decay: 0.15, sustain: 0.3, release: 0.25 },
      volume: -18,
    }).connect(leadFilter);

    this.inst.kick = new Tone.MembraneSynth({ pitchDecay: 0.04, octaves: 6, envelope: { attack: 0.001, decay: 0.35, sustain: 0 }, volume: -4 }).connect(comp);
    const hatFilter = new Tone.Filter(8000, "highpass").connect(comp);
    this.inst.hat = new Tone.NoiseSynth({ noise: { type: "white" }, envelope: { attack: 0.001, decay: 0.05, sustain: 0 }, volume: -20 }).connect(hatFilter);
    const clapFilter = new Tone.Filter(1500, "bandpass").connect(reverb);
    this.inst.clap = new Tone.NoiseSynth({ noise: { type: "pink" }, envelope: { attack: 0.002, decay: 0.16, sustain: 0 }, volume: -10 }).connect(clapFilter);
    this.inst.click = new Tone.Synth({ oscillator: { type: "sine" }, envelope: { attack: 0.001, decay: 0.05, sustain: 0, release: 0.01 }, volume: -12 }).connect(comp);
  }

  setVolume(v: number) {
    // v: 0..1
    this.volumeDb = v <= 0 ? -Infinity : -40 + 40 * v;
    if (this.Tone) this.Tone.getDestination().volume.value = this.volumeDb;
  }

  private trigger(e: NoteEvent, time: number, durSec: number) {
    const i = this.inst[e.instrument];
    if (!i) return;
    const vel = e.velocity ?? 0.8;
    try {
      if (e.instrument === "hat" || e.instrument === "clap") i.triggerAttackRelease(durSec, time, vel);
      else if (e.instrument === "kick") i.triggerAttackRelease("C1", durSec, time, vel);
      else if (e.instrument === "click") i.triggerAttackRelease(e.velocity && e.velocity > 0.8 ? 1760 : 1320, 0.03, time, vel);
      else i.triggerAttackRelease(midiToFrequency(e.midi), durSec, time, vel);
    } catch {
      /* Tone throws if two mono events land at the exact same time; skip. */
    }
  }

  /** Play notes immediately (polyphonic). Does not stop timeline playback. */
  async playNotes(midis: number[], durationSec = 0.8, instrument: Instrument = "keys") {
    if (!(await this.init())) return;
    const Tone = this.Tone!;
    const now = Tone.now() + 0.01;
    midis.forEach((m) => this.trigger({ midi: m, start: 0, duration: 0, instrument, velocity: 0.8 }, now, durationSec));
  }

  /** Play notes one after another (e.g. a scale), stopping any other playback. */
  async playMelody(midis: number[], noteBeats = 0.5, bpm = 120, instrument: Instrument = "keys", opts: PlayOptions = {}) {
    return this.playEvents(
      midis.map((m, i) => ({ midi: m, start: i * noteBeats, duration: noteBeats * 0.9, instrument })),
      bpm,
      opts,
    );
  }

  /** Play a chord, then optionally arpeggiate. */
  async playChord(midis: number[], opts: { arpeggiate?: boolean; durationBeats?: number } = {}) {
    const evs: NoteEvent[] = midis.map((m) => ({ midi: m, start: 0, duration: opts.durationBeats ?? 2, instrument: "keys" }));
    if (opts.arpeggiate) midis.forEach((m, i) => evs.push({ midi: m, start: 2.2 + i * 0.4, duration: 0.4, instrument: "keys" }));
    return this.playEvents(evs, 100);
  }

  /** Schedule a timeline of events on the Tone transport. Stops any previous playback first. */
  async playEvents(events: NoteEvent[], bpm: number, opts: PlayOptions = {}): Promise<void> {
    if (!(await this.init())) return;
    const Tone = this.Tone!;
    this.stop();
    const gen = ++this.generation;
    const transport = Tone.getTransport();
    transport.bpm.value = bpm;
    const ppq = transport.PPQ;
    const ticks = (beats: number) => `${Math.round(beats * ppq)}i`;
    const secPerBeat = 60 / bpm;
    const last = events.reduce((m, e) => Math.max(m, e.start + e.duration), 0);
    const length = opts.lengthBeats ?? (opts.loop ? Math.max(4, Math.ceil(last / 4) * 4) : last);

    for (const e of events) {
      transport.schedule((time) => this.trigger(e, time, Math.max(0.03, e.duration * (60 / transport.bpm.value))), ticks(e.start));
    }
    if (opts.onStep) {
      const draw = Tone.getDraw();
      transport.scheduleRepeat(
        (time) => {
          const step = Math.round(transport.getTicksAtTime(time) / (ppq / 4));
          draw.schedule(() => gen === this.generation && opts.onStep?.(step), time);
        },
        "16n",
        0,
      );
    }
    if (opts.loop) {
      transport.loop = true;
      transport.loopStart = 0;
      transport.loopEnd = ticks(length);
    } else {
      transport.loop = false;
      transport.schedule((time) => {
        Tone.getDraw().schedule(() => {
          if (gen !== this.generation) return;
          this.stop();
          opts.onEnd?.();
        }, time);
      }, ticks(length + 0.25));
    }
    this.playing = true;
    this.emit();
    transport.start("+0.05");
    void secPerBeat;
  }

  setBpm(bpm: number) {
    if (this.Tone) this.Tone.getTransport().bpm.value = bpm;
  }

  /** Stop all playback and release held notes. Safe to call any time. */
  stop() {
    this.generation++;
    if (!this.Tone) return;
    const transport = this.Tone.getTransport();
    transport.stop();
    transport.cancel(0);
    transport.loop = false;
    transport.position = 0;
    for (const k of ["keys", "pad", "lead"] as const) this.inst[k]?.releaseAll?.();
    this.inst.bass?.triggerRelease?.();
    if (this.playing) {
      this.playing = false;
      this.emit();
    }
  }
}

export const audio = new AudioEngine();
