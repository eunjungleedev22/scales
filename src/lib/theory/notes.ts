import { Note } from "tonal";

/** A pitch class number 0–11 (C = 0). */
export type PitchClass = number;
/** A MIDI note number 0–127 (C4 = 60). */
export type Midi = number;

export const SHARP_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"] as const;
export const FLAT_NAMES = ["C", "Db", "D", "Eb", "E", "F", "Gb", "G", "Ab", "A", "Bb", "B"] as const;
/** Fixed-do solfège with chromatic syllables (sharp spelling). */
export const SOLFEGE = ["Do", "Di", "Re", "Ri", "Mi", "Fa", "Fi", "Sol", "Si", "La", "Li", "Ti"] as const;

/** Keys commonly spelled with flats. */
const FLAT_KEYS = new Set(["F", "Bb", "Eb", "Ab", "Db", "Gb", "Cb", "D minor", "G minor", "C minor", "F minor", "Bb minor", "Eb minor"]);

export const mod12 = (n: number): number => ((n % 12) + 12) % 12;

/** Pitch class of a note name ("C#", "Db4", "E#") or MIDI number. Returns NaN for invalid input. */
export function pitchClass(note: string | Midi): PitchClass {
  if (typeof note === "number") return mod12(note);
  const c = Note.chroma(note);
  return c === undefined || Number.isNaN(c) ? NaN : c;
}

/** True if two notes are the same pitch class (C# == Db, E# == F). */
export function isEnharmonic(a: string | Midi, b: string | Midi): boolean {
  const pa = pitchClass(a);
  const pb = pitchClass(b);
  return !Number.isNaN(pa) && pa === pb;
}

/** Convert a pitch-class number to a display name. */
export function pcName(pc: PitchClass, prefer: "sharp" | "flat" = "sharp"): string {
  return prefer === "flat" ? FLAT_NAMES[mod12(pc)] : SHARP_NAMES[mod12(pc)];
}

export function solfege(pc: PitchClass): string {
  return SOLFEGE[mod12(pc)];
}

/** "C4" → 60. Returns NaN on invalid input. */
export function noteToMidi(note: string): Midi {
  const m = Note.midi(note);
  return m === null || m === undefined ? NaN : m;
}

/** 61 → "C#4" (or "Db4" with prefer = flat). */
export function midiToNote(midi: Midi, prefer: "sharp" | "flat" = "sharp"): string {
  const octave = Math.floor(midi / 12) - 1;
  return `${pcName(midi, prefer)}${octave}`;
}

export function midiToFrequency(midi: Midi): number {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

export function isBlackKey(midi: Midi): boolean {
  return [1, 3, 6, 8, 10].includes(mod12(midi));
}

/** Strip the octave from a note name: "C#4" → "C#". */
export function stripOctave(note: string): string {
  return Note.pitchClass(note) || note;
}

/** Simplify odd spellings like "E#" → "F", "Cbb" → "Bb" while keeping normal accidentals. */
export function simplify(note: string): string {
  return Note.simplify(note) || note;
}

/** Whether a tonic/key name conventionally uses flat spellings. */
export function prefersFlats(tonic: string, quality: "major" | "minor" = "major"): boolean {
  const t = stripOctave(tonic);
  if (t.includes("b")) return true;
  if (t.includes("#")) return false;
  return quality === "major" ? FLAT_KEYS.has(t) : FLAT_KEYS.has(`${t} minor`);
}

/**
 * Place a pitch class at or above a reference MIDI note.
 * e.g. placeAbove(4 /* E *\/, 60) → 64
 */
export function placeAbove(pc: PitchClass, refMidi: Midi): Midi {
  return refMidi + mod12(pc - refMidi);
}

/** Unique, sorted pitch classes of a list of MIDI notes or names. */
export function pitchClassSet(notes: Array<string | Midi>): PitchClass[] {
  return [...new Set(notes.map((n) => pitchClass(n)).filter((n) => !Number.isNaN(n)))].sort((a, b) => a - b);
}

export function sameSet(a: PitchClass[], b: PitchClass[]): boolean {
  const sa = new Set(a.map(mod12));
  const sb = new Set(b.map(mod12));
  if (sa.size !== sb.size) return false;
  for (const x of sa) if (!sb.has(x)) return false;
  return true;
}

/** Twelve note colors (one per pitch class) used consistently across the UI. */
export const NOTE_COLORS: string[] = [
  "#ff4d6d", // C
  "#ff7b54", // C#
  "#ffb347", // D
  "#ffd23f", // D#
  "#c6ff3d", // E
  "#5ef08a", // F
  "#2ee6c5", // F#
  "#36c5ff", // G
  "#5b8cff", // G#
  "#8b6cff", // A
  "#b45cff", // A#
  "#ff4fd8", // B
];

export function noteColor(pcOrMidi: number): string {
  return NOTE_COLORS[mod12(pcOrMidi)];
}

export const ALL_TONICS = ["C", "C#", "Db", "D", "Eb", "E", "F", "F#", "Gb", "G", "Ab", "A", "Bb", "B"] as const;
/** One spelling per pitch class, the spellings producers see most often. */
export const COMMON_TONICS = ["C", "Db", "D", "Eb", "E", "F", "F#", "G", "Ab", "A", "Bb", "B"] as const;
