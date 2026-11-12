import { ChordType, chordPitchClasses, CHORD_TYPES } from "./chords";
import { mod12, pitchClass } from "./notes";
import { ScaleId, SCALES, scaleNotes } from "./scales";

export type HarmonicFunction = "tonic" | "predominant" | "dominant" | "modal";

export interface DiatonicChord {
  degree: number; // 1–7
  root: string; // spelled
  type: ChordType;
  roman: string;
  fn: HarmonicFunction;
  symbol: string;
}

const NUMERALS = ["I", "II", "III", "IV", "V", "VI", "VII"];

/** Triad/seventh quality from stacked thirds (semitone sizes). */
export function qualityFromStack(third: number, fifth: number, seventh?: number): ChordType {
  const triad: ChordType =
    third === 4 && fifth === 7 ? "maj" : third === 3 && fifth === 7 ? "min" : third === 3 && fifth === 6 ? "dim" : third === 4 && fifth === 8 ? "aug" : "maj";
  if (seventh === undefined) return triad;
  if (triad === "maj") return seventh === 11 ? "maj7" : "dom7";
  if (triad === "min") return "min7";
  if (triad === "dim") return seventh === 10 ? "m7b5" : "dim7";
  return "maj7";
}

/** Roman numeral for a chord built on a given 1-based degree. */
export function romanFor(degree: number, type: ChordType, prefix = ""): string {
  const base = NUMERALS[(degree - 1) % 7];
  const upper = ["maj", "aug", "maj7", "dom7", "sus2", "sus4", "maj9", "add9"].includes(type);
  const numeral = upper ? base : base.toLowerCase();
  const suffix: Record<ChordType, string> = {
    maj: "",
    min: "",
    dim: "°",
    aug: "+",
    sus2: "sus2",
    sus4: "sus4",
    maj7: "maj7",
    min7: "7",
    dom7: "7",
    m7b5: "ø7",
    dim7: "°7",
    min9: "9",
    maj9: "maj9",
    add9: "add9",
  };
  return `${prefix}${numeral}${suffix[type]}`;
}

export function functionOf(degree: number, quality: "major" | "minor", scale: ScaleId = quality === "major" ? "major" : "minor"): HarmonicFunction {
  if (!["major", "minor", "harmonic-minor"].includes(scale)) return degree === 1 ? "tonic" : "modal";
  switch (degree) {
    case 1:
    case 3:
      return "tonic";
    case 2:
    case 4:
      return "predominant";
    case 5:
    case 7:
      return "dominant";
    case 6:
      return quality === "major" ? "tonic" : "predominant";
    default:
      return "modal";
  }
}

/** All diatonic triads (or sevenths) of a 7-note scale. */
export function diatonicChords(tonic: string, scale: ScaleId = "major", sevenths = false): DiatonicChord[] {
  const def = SCALES[scale];
  if (def.steps.length !== 7) throw new Error(`Diatonic chords need a 7-note scale, got ${scale}`);
  const notes = scaleNotes(tonic, scale);
  const st = def.steps;
  return st.map((_, i) => {
    const at = (k: number) => {
      const idx = i + k;
      return st[idx % 7] + 12 * Math.floor(idx / 7) - st[i];
    };
    const type = qualityFromStack(at(2), at(4), sevenths ? at(6) : undefined);
    const degree = i + 1;
    return {
      degree,
      root: notes[i],
      type,
      roman: romanFor(degree, type),
      fn: functionOf(degree, def.quality, scale),
      symbol: `${notes[i]}${CHORD_TYPES[type].symbol}`,
    };
  });
}

const CHROMATIC_ROMAN = ["I", "bII", "II", "bIII", "III", "IV", "#IV", "V", "bVI", "VI", "bVII", "VII"];
const CHROMATIC_DEGREE = [1, 2, 2, 3, 3, 4, 4, 5, 6, 6, 7, 7];

/**
 * Basic Roman numeral analysis of any chord in a key.
 * Diatonic chords use the scale's own degrees; others get b/# prefixes relative to the major scale.
 */
export function analyzeRoman(keyTonic: string, keyScale: ScaleId, chordRoot: string | number, type: ChordType): { roman: string; diatonic: boolean } {
  const tonicPc = pitchClass(keyTonic);
  const rootPc = pitchClass(chordRoot);
  const steps = SCALES[keyScale].steps;
  const idx = steps.indexOf(mod12(rootPc - tonicPc));
  const scalePcs = steps.map((s) => mod12(tonicPc + s));
  const tonesInScale = chordPitchClasses(rootPc, type).every((pc) => scalePcs.includes(pc));
  if (idx !== -1 && steps.length === 7) {
    return { roman: romanFor(idx + 1, type), diatonic: tonesInScale };
  }
  const semis = mod12(rootPc - tonicPc);
  const label = CHROMATIC_ROMAN[semis];
  const prefix = label.startsWith("b") || label.startsWith("#") ? label[0] : "";
  return { roman: romanFor(CHROMATIC_DEGREE[semis], type, prefix), diatonic: false };
}

/** Build a progression from scale degrees, e.g. ("A","minor",[1,6,3,7]). */
export function progressionFromDegrees(tonic: string, scale: ScaleId, degrees: number[], sevenths = false): DiatonicChord[] {
  const chords = diatonicChords(tonic, scale, sevenths);
  return degrees.map((d) => chords[(d - 1) % 7]);
}

export const FUNCTION_COLORS: Record<HarmonicFunction, string> = {
  tonic: "#f5c542",
  predominant: "#46b7a5",
  dominant: "#ff5c1a",
  modal: "#c9a0dc",
};
