import { Scale } from "tonal";
import { mod12, pitchClass, PitchClass, stripOctave } from "./notes";

export type ScaleId =
  | "major"
  | "minor"
  | "major-pentatonic"
  | "minor-pentatonic"
  | "dorian"
  | "phrygian"
  | "lydian"
  | "mixolydian"
  | "locrian"
  | "harmonic-minor";

export interface ScaleDef {
  id: ScaleId;
  name: string;
  /** Name used by tonal */
  tonal: string;
  /** Semitone offsets from the tonic */
  steps: number[];
  /** Producer-oriented character */
  vibe: string;
  /** "major" or "minor" flavour (used for spelling & tonic chord) */
  quality: "major" | "minor";
}

export const SCALES: Record<ScaleId, ScaleDef> = {
  major: { id: "major", name: "Major (Ionian)", tonal: "major", steps: [0, 2, 4, 5, 7, 9, 11], quality: "major", vibe: "Bright, resolved. Uplifting house, disco." },
  minor: { id: "minor", name: "Natural minor (Aeolian)", tonal: "aeolian", steps: [0, 2, 3, 5, 7, 8, 10], quality: "minor", vibe: "Dark, emotional. The default for techno and deep house." },
  "major-pentatonic": { id: "major-pentatonic", name: "Major pentatonic", tonal: "major pentatonic", steps: [0, 2, 4, 7, 9], quality: "major", vibe: "Five safe notes. Hooks that can't clash." },
  "minor-pentatonic": { id: "minor-pentatonic", name: "Minor pentatonic", tonal: "minor pentatonic", steps: [0, 3, 5, 7, 10], quality: "minor", vibe: "Five gritty notes. Basslines, acid riffs, vocal chops." },
  dorian: { id: "dorian", name: "Dorian", tonal: "dorian", steps: [0, 2, 3, 5, 7, 9, 10], quality: "minor", vibe: "Minor with a raised 6th — soulful, jazzy deep house." },
  phrygian: { id: "phrygian", name: "Phrygian", tonal: "phrygian", steps: [0, 1, 3, 5, 7, 8, 10], quality: "minor", vibe: "Minor with a flat 2nd — dark, menacing techno." },
  lydian: { id: "lydian", name: "Lydian", tonal: "lydian", steps: [0, 2, 4, 6, 7, 9, 11], quality: "major", vibe: "Major with a raised 4th — floating, dreamy." },
  mixolydian: { id: "mixolydian", name: "Mixolydian", tonal: "mixolydian", steps: [0, 2, 4, 5, 7, 9, 10], quality: "major", vibe: "Major with a flat 7th — funky, bluesy, disco-house." },
  locrian: { id: "locrian", name: "Locrian", tonal: "locrian", steps: [0, 1, 3, 5, 6, 8, 10], quality: "minor", vibe: "Diminished tonic — unstable, rarely a home key." },
  "harmonic-minor": { id: "harmonic-minor", name: "Harmonic minor", tonal: "harmonic minor", steps: [0, 2, 3, 5, 7, 8, 11], quality: "minor", vibe: "Minor with a raised 7th — dramatic pull back home." },
};

export const SCALE_IDS = Object.keys(SCALES) as ScaleId[];

/** Correctly spelled notes of a scale (no octave). e.g. ("D","dorian") → D E F G A B C */
export function scaleNotes(tonic: string, scale: ScaleId): string[] {
  const def = SCALES[scale];
  const notes = Scale.get(`${stripOctave(tonic)} ${def.tonal}`).notes;
  if (notes.length) return notes;
  // Fallback: build from steps using sharps
  const t = pitchClass(tonic);
  return def.steps.map((s) => ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"][mod12(t + s)]);
}

export function scalePitchClasses(tonic: string, scale: ScaleId): PitchClass[] {
  const t = pitchClass(tonic);
  return SCALES[scale].steps.map((s) => mod12(t + s));
}

export function isInScale(note: string | number, tonic: string, scale: ScaleId): boolean {
  return scalePitchClasses(tonic, scale).includes(pitchClass(note));
}

/** 1-based scale degree of a note in a scale, or null if not in it. */
export function scaleDegree(note: string | number, tonic: string, scale: ScaleId): number | null {
  const i = scalePitchClasses(tonic, scale).indexOf(pitchClass(note));
  return i === -1 ? null : i + 1;
}

/** MIDI notes of a scale ascending from a starting MIDI tonic, including the octave. */
export function scaleMidi(tonicMidi: number, scale: ScaleId, octaves = 1): number[] {
  const out: number[] = [];
  for (let o = 0; o < octaves; o++) for (const s of SCALES[scale].steps) out.push(tonicMidi + 12 * o + s);
  out.push(tonicMidi + 12 * octaves);
  return out;
}

/** Relative minor/major: C major ↔ A minor. */
export function relativeKey(tonic: string, quality: "major" | "minor"): string {
  return quality === "major" ? Scale.get(`${tonic} major`).notes[5] : Scale.get(`${tonic} aeolian`).notes[2];
}

export const DEGREE_NAMES = ["tonic", "supertonic", "mediant", "subdominant", "dominant", "submediant", "leading tone / subtonic"];
