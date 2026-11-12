/**
 * Shared musical event model used by BOTH audio playback and MIDI export,
 * so what you hear is exactly what you export.
 */
import type { ChordType } from "@/lib/theory/chords";
import { chordMidi, voiceLead } from "@/lib/theory/chords";
import type { MidiSong, MidiTrack } from "@/lib/midi/writer";

export type Instrument = "keys" | "pad" | "bass" | "lead" | "kick" | "hat" | "clap" | "click";

export interface NoteEvent {
  midi: number;
  /** start in beats (quarter notes) */
  start: number;
  /** duration in beats */
  duration: number;
  instrument: Instrument;
  velocity?: number; // 0–1
}

/** A sequenced note on a step grid (16 steps = 1 bar of 16th notes). */
export interface StepNote {
  step: number;
  midi: number;
  /** length in steps */
  len: number;
}

export const STEP_BEATS = 0.25; // a 16th note

export function stepsToEvents(notes: StepNote[], instrument: Instrument, offsetBeats = 0, velocity = 0.9): NoteEvent[] {
  return notes.map((n) => ({ midi: n.midi, start: offsetBeats + n.step * STEP_BEATS, duration: n.len * STEP_BEATS, instrument, velocity }));
}

export interface ChordSlot {
  root: string;
  type: ChordType;
  /** beats */
  start: number;
  duration: number;
}

export type VoicingMode = "root" | "first" | "second" | "smooth" | "spread";

/** Voice a list of chords into MIDI notes. */
export function voiceProgression(chords: Array<{ root: string; type: ChordType }>, mode: VoicingMode = "smooth", floor = 60): number[][] {
  const out: number[][] = [];
  chords.forEach((c, i) => {
    if (mode === "root") out.push(chordMidi(c.root, c.type, 0, floor));
    else if (mode === "first") out.push(chordMidi(c.root, c.type, 1, floor));
    else if (mode === "second") out.push(chordMidi(c.root, c.type, 2, floor));
    else if (mode === "spread") {
      const v = chordMidi(c.root, c.type, 0, floor - 7);
      // Drop-2 style spread: move the second-highest voice up an octave
      if (v.length >= 3) v[v.length - 2] += 12;
      out.push(v.sort((a, b) => a - b));
    } else {
      out.push(i === 0 ? chordMidi(c.root, c.type, 0, floor) : voiceLead(out[i - 1], c.root, c.type, floor - 3, floor + 22));
    }
  });
  return out;
}

export function chordEvents(voicings: number[][], beatsPer: number, instrument: Instrument = "keys", offset = 0, stabs = false): NoteEvent[] {
  const evs: NoteEvent[] = [];
  voicings.forEach((v, i) => {
    const start = offset + i * beatsPer;
    if (stabs) {
      // Offbeat house stabs: on the "and" of each beat
      for (let b = 0; b < beatsPer; b++) for (const m of v) evs.push({ midi: m, start: start + b + 0.5, duration: 0.25, instrument, velocity: 0.75 });
    } else {
      for (const m of v) evs.push({ midi: m, start, duration: beatsPer * 0.95, instrument, velocity: 0.7 });
    }
  });
  return evs;
}

export const GM_DRUMS: Record<string, number> = { kick: 36, clap: 39, hat: 42, click: 37 };

/** A basic four-on-the-floor house/techno loop. */
export function drumLoop(bars: number, style: "house" | "minimal" | "click" = "house"): NoteEvent[] {
  const evs: NoteEvent[] = [];
  for (let bar = 0; bar < bars; bar++) {
    for (let beat = 0; beat < 4; beat++) {
      const t = bar * 4 + beat;
      if (style === "click") {
        evs.push({ midi: GM_DRUMS.click, start: t, duration: 0.1, instrument: "click", velocity: beat === 0 ? 1 : 0.5 });
        continue;
      }
      evs.push({ midi: GM_DRUMS.kick, start: t, duration: 0.25, instrument: "kick", velocity: 1 });
      evs.push({ midi: GM_DRUMS.hat, start: t + 0.5, duration: 0.1, instrument: "hat", velocity: 0.6 });
      if (style === "house" && (beat === 1 || beat === 3)) evs.push({ midi: GM_DRUMS.clap, start: t, duration: 0.2, instrument: "clap", velocity: 0.7 });
      if (style === "minimal") evs.push({ midi: GM_DRUMS.hat, start: t + 0.75, duration: 0.05, instrument: "hat", velocity: 0.25 });
    }
  }
  return evs;
}

const TRACK_FOR: Record<Instrument, { name: string; channel: number }> = {
  keys: { name: "Chords", channel: 0 },
  pad: { name: "Chords", channel: 0 },
  bass: { name: "Bass", channel: 1 },
  lead: { name: "Melody", channel: 2 },
  kick: { name: "Drums", channel: 9 },
  hat: { name: "Drums", channel: 9 },
  clap: { name: "Drums", channel: 9 },
  click: { name: "Drums", channel: 9 },
};

/** Group note events into MIDI tracks (one per instrument family). */
export function eventsToMidiSong(events: NoteEvent[], bpm: number, name = "Harmonic Cat"): MidiSong {
  const tracks = new Map<string, MidiTrack>();
  for (const e of events) {
    const t = TRACK_FOR[e.instrument];
    if (!tracks.has(t.name)) tracks.set(t.name, { name: t.name, channel: t.channel, notes: [] });
    tracks.get(t.name)!.notes.push({ midi: e.midi, start: e.start, duration: e.duration, velocity: Math.round((e.velocity ?? 0.8) * 127) });
  }
  return { bpm, name, tracks: [...tracks.values()] };
}

export function eventsLength(events: NoteEvent[]): number {
  return events.reduce((m, e) => Math.max(m, e.start + e.duration), 0);
}
