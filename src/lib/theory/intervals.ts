import { Interval, Note } from "tonal";
import { mod12 } from "./notes";

export interface IntervalInfo {
  semitones: number;
  /** Short name, e.g. "m3" */
  short: string;
  /** Long name, e.g. "minor 3rd" */
  name: string;
  /** Tonal-style interval used for correctly spelled transposition, e.g. "3m" */
  tonal: string;
  /** Producer-friendly description of the sound */
  vibe: string;
}

export const INTERVALS: IntervalInfo[] = [
  { semitones: 0, short: "P1", name: "unison", tonal: "1P", vibe: "Same note — doubles and thickens." },
  { semitones: 1, short: "m2", name: "minor 2nd", tonal: "2m", vibe: "Tense, grinding — horror-movie / acid squelch." },
  { semitones: 2, short: "M2", name: "major 2nd", tonal: "2M", vibe: "A step. Open, a little restless." },
  { semitones: 3, short: "m3", name: "minor 3rd", tonal: "3m", vibe: "Moody, dark — the heart of minor chords." },
  { semitones: 4, short: "M3", name: "major 3rd", tonal: "3M", vibe: "Bright, happy — the heart of major chords." },
  { semitones: 5, short: "P4", name: "perfect 4th", tonal: "4P", vibe: "Open, hollow, wants to fall back down." },
  { semitones: 6, short: "TT", name: "tritone", tonal: "4A", vibe: "Unstable, alarming — strong pull to resolve." },
  { semitones: 7, short: "P5", name: "perfect 5th", tonal: "5P", vibe: "Powerful and stable — power chords, bass fifths." },
  { semitones: 8, short: "m6", name: "minor 6th", tonal: "6m", vibe: "Bittersweet, cinematic." },
  { semitones: 9, short: "M6", name: "major 6th", tonal: "6M", vibe: "Warm, sweet, a bit soulful." },
  { semitones: 10, short: "m7", name: "minor 7th", tonal: "7m", vibe: "Bluesy, funky — the dominant / minor 7 colour." },
  { semitones: 11, short: "M7", name: "major 7th", tonal: "7M", vibe: "Dreamy, lush — deep house pads." },
  { semitones: 12, short: "P8", name: "octave", tonal: "8P", vibe: "Same note, higher — octave basslines." },
];

export function intervalBySemitones(semitones: number): IntervalInfo {
  const s = semitones === 12 ? 12 : mod12(semitones);
  return INTERVALS.find((i) => i.semitones === s)!;
}

export function intervalByShort(short: string): IntervalInfo | undefined {
  return INTERVALS.find((i) => i.short === short);
}

/** Ascending distance in semitones from a to b within one octave (0–11). */
export function semitonesBetween(a: string, b: string): number {
  const ca = Note.chroma(a);
  const cb = Note.chroma(b);
  if (ca === undefined || cb === undefined) return NaN;
  return mod12(cb - ca);
}

/** Spelled interval name between two notes, e.g. ("C","Eb") → "3m". Empty string on failure. */
export function spelledInterval(a: string, b: string): string {
  return Interval.distance(a, b);
}

/** Transpose with correct spelling: transpose("E", "3M") → "G#". */
export function transpose(note: string, interval: string): string {
  return Note.transpose(note, interval);
}

/** Whole tone = 2 semitones, semitone = 1. */
export function stepType(a: number, b: number): "semitone" | "whole tone" | "other" {
  const d = Math.abs(b - a);
  return d === 1 ? "semitone" : d === 2 ? "whole tone" : "other";
}
