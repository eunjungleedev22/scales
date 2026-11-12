"use client";
/**
 * Audio engine wrapping Tone.js.
 * - Tone is imported lazily (client-only), and started only after a user gesture.
 * - Every timeline playback stops the previous one, so audio never overlaps.
 */
import type { Instrument, NoteEvent } from "@/lib/music/events";
import { midiToFrequency } from "@/lib/theory/notes";

type ToneNS = typeof import("tone");
export type TonePreset = "epiano" | "analog" | "piano" | "acid";
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
/** Build a 16-bit mono WAV data URI: silence (freq = 0) or a sine tone. Used for iOS unlocking and the media sound test. */
export function wavDataUri(seconds: number, freq = 0, sampleRate = 22050): string {
  const n = Math.max(1, Math.round(seconds * sampleRate));
  const bytes = new Uint8Array(44 + n * 2);
  const view = new DataView(bytes.buffer);
  const w = (o: number, t: string) => [...t].forEach((c, i) => view.setUint8(o + i, c.charCodeAt(0)));
  w(0, "RIFF");
  view.setUint32(4, 36 + n * 2, true);
  w(8, "WAVE");
  w(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, 1, true); // mono
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  w(36, "data");
  view.setUint32(40, n * 2, true);
  for (let i = 0; i < n && freq > 0; i++) {
    const env = Math.min(1, i / 200, (n - i) / 400);
    view.setInt16(44 + i * 2, Math.round(Math.sin((2 * Math.PI * freq * i) / sampleRate) * 9000 * env), true);
  }
  let bin = "";
  for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return `data:audio/wav;base64,${typeof btoa === "function" ? btoa(bin) : ""}`;
}

class AudioEngine {
  private Tone: ToneNS | null = null;
  private loadPromise: Promise<ToneNS> | null = null;
  private inst: Partial<Record<Instrument, any>> = {};
  private listeners = new Set<() => void>();
  private generation = 0;
  status: AudioStatus = "idle";
  error: string | null = null;
  playing = false;
  private volumeDb = -4;

  subscribe = (fn: () => void) => {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  };
  private emit() {
    this.listeners.forEach((l) => l());
  }
  getSnapshot = () => `${this.status}|${this.playing}`;

  /** Native AudioContext created inside the first user gesture (the most reliable way on iOS). */
  private nativeCtx: AudioContext | null = null;
  private bound = false;
  private silentEl: HTMLAudioElement | null = null;
  lastError: string | null = null;

  /** Start downloading Tone.js early (no sound yet), so a later tap can start audio instantly. */
  preload(): Promise<ToneNS> {
    if (!this.loadPromise) {
      this.loadPromise = import("tone").then((Tone) => {
        this.Tone = Tone;
        this.attach();
        return Tone;
      });
    }
    return this.loadPromise;
  }

  /** Hand our gesture-created context to Tone, then build instruments on it. */
  private attach() {
    if (!this.Tone || !this.nativeCtx || this.bound) return;
    try {
      this.Tone.setContext(this.nativeCtx, true);
      this.bound = true;
      this.inst = {};
      this.build(this.Tone);
      this.syncStatus();
    } catch (e) {
      this.lastError = e instanceof Error ? e.message : String(e);
    }
  }

  /** Low-level context state: "running" | "suspended" | "interrupted" | "closed" | "none". */
  contextState(): string {
    return this.nativeCtx ? this.nativeCtx.state : "none";
  }

  get sampleRate(): number | null {
    return this.nativeCtx?.sampleRate ?? null;
  }

  /** For diagnostics/tests only. */
  get voiceBusNode(): GainNode | null {
    return this.voiceBus;
  }

  /** For diagnostics/tests only. */
  get toneNamespace(): ToneNS | null {
    return this.Tone;
  }

  get toneLoaded() {
    return Boolean(this.Tone);
  }

  get contextBound() {
    return this.bound;
  }

  private syncStatus() {
    const running = this.contextState() === "running" && this.bound;
    const next: AudioStatus = running ? "ready" : this.status === "error" ? "error" : this.status === "loading" ? "loading" : "idle";
    if (next !== this.status) {
      this.status = next;
      this.emit();
    }
  }

  /**
   * Call synchronously from a user gesture (tap/click/key). Mobile browsers — iOS Safari in particular —
   * only allow audio to start inside the gesture itself, so nothing here may be awaited first.
   */
  unlockFromGesture() {
    if (typeof window === "undefined") return;
    // iOS 17+: use the "playback" audio session so the ring/silent switch doesn't mute Web Audio
    try {
      const nav = navigator as Navigator & { audioSession?: { type: string } };
      if (nav.audioSession && nav.audioSession.type !== "playback") nav.audioSession.type = "playback";
    } catch {
      /* not supported */
    }
    // 1) Create the AudioContext inside the gesture (contexts created here start unlocked on iOS)
    if (!this.nativeCtx || this.nativeCtx.state === "closed") {
      const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AC) {
        this.status = "error";
        this.error = "This browser has no Web Audio support.";
        this.emit();
        return;
      }
      try {
        this.nativeCtx = new AC({ latencyHint: "interactive" });
      } catch {
        this.nativeCtx = new AC();
      }
      this.nativeCtx.addEventListener?.("statechange", () => this.syncStatus());
      this.bound = false;
    }
    const ctx = this.nativeCtx;
    // 2) Resume + play a one-sample silent buffer inside the gesture (classic iOS unlock)
    try {
      if (ctx.state !== "running") void ctx.resume().then(() => this.syncStatus(), () => undefined);
      const buf = ctx.createBuffer(1, 1, 22050);
      const src = ctx.createBufferSource();
      src.buffer = buf;
      src.connect(ctx.destination);
      src.start(0);
    } catch (e) {
      this.lastError = e instanceof Error ? e.message : String(e);
    }
    // 3) Older iOS: a looping silent <audio> element also moves the session out of "ambient" (silent switch)
    if (!this.silentEl && !("audioSession" in navigator)) {
      try {
        const el = new Audio(wavDataUri(0.5));
        el.loop = true;
        el.setAttribute("playsinline", "");
        el.setAttribute("x-webkit-airplay", "deny");
        this.silentEl = el;
        void el.play().catch(() => (this.silentEl = null));
      } catch {
        this.silentEl = null;
      }
    }
    // 4) Bind to Tone (now, or as soon as it has loaded)
    if (this.Tone) this.attach();
    else void this.preload();
    setTimeout(() => this.syncStatus(), 60);
    setTimeout(() => this.syncStatus(), 500);
  }

  /** Make sure audio is loaded and running. Never hangs: resolves false if the browser still blocks sound. */
  async init(): Promise<boolean> {
    try {
      if (!this.Tone) {
        if (this.status !== "loading") {
          this.status = "loading";
          this.emit();
        }
        await this.preload();
        if (this.status === "loading") this.status = "idle";
      }
      if (!this.nativeCtx || !this.bound) {
        // No gesture yet: we can't create sound until the user taps.
        this.syncStatus();
        return false;
      }
      if (this.nativeCtx.state !== "running") {
        await Promise.race([this.nativeCtx.resume().catch(() => undefined), new Promise((r) => setTimeout(r, 300))]);
      }
      this.syncStatus();
      return this.nativeCtx.state === "running";
    } catch (e) {
      this.status = "error";
      this.error = e instanceof Error ? e.message : String(e);
      this.emit();
      return false;
    }
  }

  /* ---------------- Recorded voice clips (narration) ---------------- */
  private voiceCache = new Map<string, Promise<AudioBuffer | null>>();
  private voiceSrc: AudioBufferSourceNode | null = null;
  private voiceBus: GainNode | null = null;
  private voiceVolume = 0.7;

  /** Narration level, independent from the music (0..1). */
  setVoiceVolume(v: number) {
    this.voiceVolume = v;
    if (this.voiceBus) this.voiceBus.gain.value = this.voiceGainValue();
  }
  private voiceGainValue() {
    // Recordings are normalised to -16 LUFS; a +1 dB trim sits them just under the music (measured)
    const v = this.voiceVolume;
    return v <= 0 ? 0 : Math.pow(10, 1 / 20) * Math.pow(v / 0.7, 1.6);
  }
  private voiceDone: ((r: "ended" | "cancelled") => void) | null = null;

  /** Download + decode a clip (cached). Resolves null if it can't be loaded. */
  loadVoiceClip(url: string): Promise<AudioBuffer | null> {
    if (!this.voiceCache.has(url)) {
      const p = fetch(url)
        .then((r) => (r.ok ? r.arrayBuffer() : Promise.reject(new Error(String(r.status)))))
        .then(async (buf) => {
          // decodeAudioData needs a context; create one lazily (it stays suspended until a tap)
          const ctx = this.nativeCtx ?? new (window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
          if (!this.nativeCtx) this.nativeCtx = ctx;
          return await new Promise<AudioBuffer>((res, rej) => ctx.decodeAudioData(buf, res, rej));
        })
        .catch(() => {
          this.voiceCache.delete(url);
          return null;
        });
      this.voiceCache.set(url, p);
    }
    return this.voiceCache.get(url)!;
  }

  /** Play a recorded clip through the (unlocked) audio context. */
  async playVoiceClip(url: string): Promise<"ended" | "cancelled" | "unsupported"> {
    this.stopVoice();
    const buf = await this.loadVoiceClip(url);
    const ctx = this.nativeCtx;
    if (!buf || !ctx) return "unsupported";
    if (ctx.state !== "running") await Promise.race([ctx.resume().catch(() => undefined), new Promise((r) => setTimeout(r, 300))]);
    if (ctx.state !== "running") return "unsupported";
    if (!this.voiceBus || this.voiceBus.context !== ctx) {
      this.voiceBus = ctx.createGain();
      this.voiceBus.connect(ctx.destination);
    }
    this.voiceBus.gain.value = this.voiceGainValue();
    const src = ctx.createBufferSource();
    src.buffer = buf;
    src.connect(this.voiceBus);
    this.voiceSrc = src;
    return new Promise((resolve) => {
      this.voiceDone = resolve;
      src.onended = () => {
        if (this.voiceSrc === src) {
          this.voiceSrc = null;
          this.voiceDone = null;
          resolve("ended");
        }
      };
      src.start();
    });
  }

  stopVoice() {
    const src = this.voiceSrc;
    const done = this.voiceDone;
    this.voiceSrc = null;
    this.voiceDone = null;
    if (src) {
      try {
        src.stop();
      } catch {
        /* already stopped */
      }
    }
    done?.("cancelled");
  }

  /** Diagnostic: a plain Web Audio beep that bypasses Tone.js entirely. */
  beepRaw(): boolean {
    this.unlockFromGesture();
    const ctx = this.nativeCtx;
    if (!ctx) return false;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.frequency.value = 660;
    gain.gain.setValueAtTime(0.0001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.35, ctx.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.5);
    osc.connect(gain).connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.55);
    return true;
  }

  get ready() {
    return this.status === "ready" && this.contextState() === "running";
  }

  private buses: { comp?: any; reverb?: any; chorus?: any } = {};
  private makeupNode: any = null;
  /** Music make-up gain before the limiter (dB). */
  musicMakeupDb = 6;
  private tonal: any[] = [];
  preset: TonePreset = "epiano";

  /** Master chain + drums (shared by all presets), then the preset's tonal instruments. */
  private build(Tone: ToneNS) {
    Tone.getDestination().volume.value = this.volumeDb;
    // Master chain: glue compressor -> make-up gain -> brickwall limiter (loud enough for phone speakers, never clips)
    // Final safety: smooth tanh soft-clip so fast attacks can never exceed full scale
    const softClip = new Tone.WaveShaper((x) => Math.tanh(x * 1.1) / Math.tanh(1.1), 2048).toDestination();
    // Hard-knee limiter (Tone.Limiter keeps the browser default 30 dB soft knee, which barely limits)
    const limiter = new Tone.Compressor({ threshold: -3, ratio: 20, knee: 0, attack: 0.001, release: 0.08 }).connect(softClip);
    const makeup = new Tone.Gain(Tone.dbToGain(this.musicMakeupDb)).connect(limiter);
    this.makeupNode = makeup;
    // Mix compressor with a narrow knee (Tone's default 30 dB knee barely compresses): evens out
    // single notes vs dense chords so the limiter stays almost idle (tuned by measurement)
    const comp = new Tone.Compressor({ threshold: -34, ratio: 6, knee: 6, attack: 0.005, release: 0.15 }).connect(makeup);
    const reverb = new Tone.Freeverb({ roomSize: 0.62, dampening: 2800, wet: 0.2 }).connect(comp);
    const chorus = new Tone.Chorus({ frequency: 0.8, delayTime: 3.5, depth: 0.6, wet: 0.5 }).connect(reverb).start();
    this.buses = { comp, reverb, chorus };
    (this as unknown as { _limiter: unknown })._limiter = limiter; // diagnostics

    // Drums (classic drum-machine style)
    this.inst.kick = new Tone.MembraneSynth({ pitchDecay: 0.05, octaves: 5, envelope: { attack: 0.001, decay: 0.4, sustain: 0 }, volume: 0 }).connect(comp);
    const hatFilter = new Tone.Filter(7500, "highpass").connect(comp);
    this.inst.hat = new Tone.NoiseSynth({ noise: { type: "white" }, envelope: { attack: 0.001, decay: 0.045, sustain: 0 }, volume: -15 }).connect(hatFilter);
    const clapFilter = new Tone.Filter(1400, "bandpass").connect(reverb);
    this.inst.clap = new Tone.NoiseSynth({ noise: { type: "pink" }, envelope: { attack: 0.002, decay: 0.16, sustain: 0 }, volume: -4 }).connect(clapFilter);
    this.inst.click = new Tone.Synth({ oscillator: { type: "sine" }, envelope: { attack: 0.001, decay: 0.05, sustain: 0, release: 0.01 }, volume: -6 }).connect(comp);

    this.buildTonal(Tone, this.preset);
  }

  /** Keys, pad, bass and lead for a tone preset. Safe to call again to swap presets live. */
  private buildTonal(Tone: ToneNS, preset: TonePreset) {
    const { comp, reverb, chorus } = this.buses;
    if (!comp) return;
    for (const node of this.tonal) {
      try {
        node.dispose();
      } catch {
        /* already disposed */
      }
    }
    this.tonal = [];
    const keep = <T,>(n: T) => {
      this.tonal.push(n);
      return n;
    };

    if (preset === "epiano") {
      // '80s FM electric piano: bell-like tine attack that mellows out, through chorus
      const eq = keep(new Tone.Filter(5200, "lowpass").connect(chorus));
      this.inst.keys = keep(
        new Tone.PolySynth(Tone.FMSynth, {
          harmonicity: 1,
          modulationIndex: 6,
          oscillator: { type: "sine" },
          modulation: { type: "sine" },
          envelope: { attack: 0.002, decay: 1.6, sustain: 0.25, release: 1.1 },
          modulationEnvelope: { attack: 0.002, decay: 0.35, sustain: 0.12, release: 0.6 },
          volume: -12,
        }).connect(eq),
      );
      this.inst.pad = keep(
        new Tone.PolySynth(Tone.FMSynth, {
          harmonicity: 1,
          modulationIndex: 2.5,
          envelope: { attack: 0.08, decay: 2.2, sustain: 0.45, release: 1.4 },
          modulationEnvelope: { attack: 0.05, decay: 0.8, sustain: 0.2, release: 1 },
          volume: -12,
        }).connect(eq),
      );
      const bassFilter = keep(new Tone.Filter(900, "lowpass").connect(comp));
      this.inst.bass = keep(
        new Tone.MonoSynth({
          oscillator: { type: "fmsine", modulationIndex: 1.2, harmonicity: 1 } as any,
          filter: { Q: 0.7, type: "lowpass", rolloff: -12 },
          envelope: { attack: 0.005, decay: 0.3, sustain: 0.7, release: 0.15 },
          filterEnvelope: { attack: 0.005, decay: 0.25, sustain: 0.6, release: 0.2, baseFrequency: 220, octaves: 1.5 },
          volume: -6,
        }).connect(bassFilter),
      );
      this.inst.lead = keep(
        new Tone.PolySynth(Tone.FMSynth, {
          harmonicity: 2,
          modulationIndex: 3,
          envelope: { attack: 0.004, decay: 0.5, sustain: 0.3, release: 0.4 },
          modulationEnvelope: { attack: 0.004, decay: 0.25, sustain: 0.1, release: 0.3 },
          volume: -17,
        }).connect(chorus),
      );
    } else if (preset === "analog") {
      // Vintage analog polysynth: detuned saws, gentle low-pass, lush chorus
      const keysFilter = keep(new Tone.Filter({ frequency: 2200, type: "lowpass", rolloff: -24, Q: 0.5 }).connect(chorus));
      this.inst.keys = keep(
        new Tone.PolySynth(Tone.Synth, {
          oscillator: { type: "fatsawtooth", count: 2, spread: 10 },
          envelope: { attack: 0.01, decay: 0.6, sustain: 0.5, release: 0.8 },
          volume: -4,
        }).connect(keysFilter),
      );
      const padFilter = keep(new Tone.Filter({ frequency: 1500, type: "lowpass", rolloff: -24 }).connect(chorus));
      this.inst.pad = keep(
        new Tone.PolySynth(Tone.Synth, {
          oscillator: { type: "fatsawtooth", count: 3, spread: 18 },
          envelope: { attack: 0.35, decay: 0.5, sustain: 0.8, release: 1.5 },
          volume: -13,
        }).connect(padFilter),
      );
      this.inst.bass = keep(
        new Tone.MonoSynth({
          oscillator: { type: "square" },
          filter: { Q: 1, type: "lowpass", rolloff: -24 },
          envelope: { attack: 0.005, decay: 0.25, sustain: 0.6, release: 0.12 },
          filterEnvelope: { attack: 0.005, decay: 0.2, sustain: 0.4, release: 0.2, baseFrequency: 180, octaves: 2 },
          volume: -9.5,
        }).connect(comp),
      );
      const leadFilter = keep(new Tone.Filter(2600, "lowpass").connect(chorus));
      this.inst.lead = keep(
        new Tone.PolySynth(Tone.Synth, {
          oscillator: { type: "pulse", width: 0.35 } as any,
          envelope: { attack: 0.01, decay: 0.3, sustain: 0.4, release: 0.4 },
          volume: -13,
        }).connect(leadFilter),
      );
    } else if (preset === "piano") {
      // Soft piano-like tone: decaying additive partials, a touch of room
      const partials = [1, 0.42, 0.26, 0.12, 0.08, 0.04, 0.02];
      const tone = keep(new Tone.Filter(4500, "lowpass").connect(reverb));
      this.inst.keys = keep(
        new Tone.PolySynth(Tone.Synth, {
          oscillator: { type: "custom", partials } as any,
          envelope: { attack: 0.002, decay: 2.2, sustain: 0.0, release: 1.2 },
          volume: -9,
        }).connect(tone),
      );
      this.inst.pad = keep(
        new Tone.PolySynth(Tone.Synth, {
          oscillator: { type: "custom", partials: [1, 0.3, 0.15, 0.05] } as any,
          envelope: { attack: 0.06, decay: 3, sustain: 0.25, release: 1.6 },
          volume: -16,
        }).connect(tone),
      );
      this.inst.bass = keep(
        new Tone.MonoSynth({
          oscillator: { type: "custom", partials: [1, 0.5, 0.25, 0.12] } as any,
          filter: { Q: 0.5, type: "lowpass" },
          envelope: { attack: 0.004, decay: 0.8, sustain: 0.35, release: 0.3 },
          filterEnvelope: { attack: 0.004, decay: 0.4, sustain: 0.5, release: 0.3, baseFrequency: 300, octaves: 1.5 },
          volume: -6,
        }).connect(comp),
      );
      this.inst.lead = keep(
        new Tone.PolySynth(Tone.Synth, {
          oscillator: { type: "custom", partials: [1, 0.35, 0.18, 0.08] } as any,
          envelope: { attack: 0.002, decay: 1.2, sustain: 0.1, release: 0.8 },
          volume: -10,
        }).connect(tone),
      );
    } else {
      // Acid (the original sound): bright detuned saws and a resonant squelchy bass
      const keysFilter = keep(new Tone.Filter(4200, "lowpass").connect(reverb));
      this.inst.keys = keep(
        new Tone.PolySynth(Tone.Synth, {
          oscillator: { type: "fatsawtooth", count: 2, spread: 14 },
          envelope: { attack: 0.005, decay: 0.35, sustain: 0.35, release: 0.7 },
          volume: -2,
        }).connect(keysFilter),
      );
      const padFilter = keep(new Tone.Filter(2400, "lowpass").connect(reverb));
      this.inst.pad = keep(
        new Tone.PolySynth(Tone.Synth, {
          oscillator: { type: "fattriangle", count: 3, spread: 20 },
          envelope: { attack: 0.25, decay: 0.4, sustain: 0.7, release: 1.2 },
          volume: -13,
        }).connect(padFilter),
      );
      this.inst.bass = keep(
        new Tone.MonoSynth({
          oscillator: { type: "sawtooth" },
          filter: { Q: 5, type: "lowpass", rolloff: -24 },
          envelope: { attack: 0.004, decay: 0.2, sustain: 0.5, release: 0.08 },
          filterEnvelope: { attack: 0.002, decay: 0.18, sustain: 0.25, release: 0.2, baseFrequency: 140, octaves: 3.2 },
          volume: -12,
        }).connect(comp),
      );
      const leadFilter = keep(new Tone.Filter(3200, "lowpass").connect(reverb));
      this.inst.lead = keep(
        new Tone.PolySynth(Tone.Synth, {
          oscillator: { type: "square" },
          envelope: { attack: 0.005, decay: 0.15, sustain: 0.3, release: 0.25 },
          volume: -9,
        }).connect(leadFilter),
      );
    }
    for (const k of ["keys", "pad", "lead"] as const) if (this.inst[k]) this.inst[k].maxPolyphony = 32;
  }

  /** Switch the instrument sound (keys, pads, bass, lead). Drums stay the same. */
  setPreset(preset: TonePreset) {
    if (preset === this.preset && this.tonal.length) return;
    this.preset = preset;
    if (this.Tone && this.bound && this.buses.comp) {
      this.stop();
      this.buildTonal(this.Tone, preset);
    }
  }

  setVolume(v: number) {
    // v: 0..1
    // perceptual curve: 1.0 = 0 dB, 0.8 = ~-4 dB, 0.5 = ~-12 dB
    this.volumeDb = v <= 0 ? -Infinity : 20 * Math.log10(Math.pow(v, 1.6));
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
