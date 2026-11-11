import { Note } from "tonal";
import { INTERVALS, transpose } from "./intervals";
import { mod12, pitchClass, PitchClass, pitchClassSet, sameSet, stripOctave, placeAbove } from "./notes";

export type ChordType =
  | "maj"
  | "min"
  | "dim"
  | "aug"
  | "sus2"
  | "sus4"
  | "maj7"
  | "min7"
  | "dom7"
  | "m7b5"
  | "dim7"
  | "min9"
  | "maj9"
  | "add9";

export interface ChordTypeDef {
  id: ChordType;
  name: string;
  /** Suffix as written in a chord symbol: C, Cm, Cdim, Cmaj7... */
  symbol: string;
  /** Tonal intervals from root, used for correct spelling */
  intervals: string[];
  vibe: string;
}

export const CHORD_TYPES: Record<ChordType, ChordTypeDef> = {
  maj: { id: "maj", name: "major", symbol: "", intervals: ["1P", "3M", "5P"], vibe: "Bright and stable." },
  min: { id: "min", name: "minor", symbol: "m", intervals: ["1P", "3m", "5P"], vibe: "Dark and stable." },
  dim: { id: "dim", name: "diminished", symbol: "dim", intervals: ["1P", "3m", "5d"], vibe: "Tense, unstable, wants to move." },
  aug: { id: "aug", name: "augmented", symbol: "aug", intervals: ["1P", "3M", "5A"], vibe: "Eerie, floating, unresolved." },
  sus2: { id: "sus2", name: "suspended 2nd", symbol: "sus2", intervals: ["1P", "2M", "5P"], vibe: "Open, neither major nor minor." },
  sus4: { id: "sus4", name: "suspended 4th", symbol: "sus4", intervals: ["1P", "4P", "5P"], vibe: "Hanging, wants to resolve to the 3rd." },
  maj7: { id: "maj7", name: "major 7th", symbol: "maj7", intervals: ["1P", "3M", "5P", "7M"], vibe: "Lush, dreamy — deep house pads." },
  min7: { id: "min7", name: "minor 7th", symbol: "m7", intervals: ["1P", "3m", "5P", "7m"], vibe: "Smooth, soulful — the deep house workhorse." },
  dom7: { id: "dom7", name: "dominant 7th", symbol: "7", intervals: ["1P", "3M", "5P", "7m"], vibe: "Funky tension that pulls home." },
  m7b5: { id: "m7b5", name: "half-diminished 7th", symbol: "m7b5", intervals: ["1P", "3m", "5d", "7m"], vibe: "Moody, jazzy tension." },
  dim7: { id: "dim7", name: "diminished 7th", symbol: "dim7", intervals: ["1P", "3m", "5d", "7d"], vibe: "Maximum symmetrical tension." },
  min9: { id: "min9", name: "minor 9th", symbol: "m9", intervals: ["1P", "3m", "5P", "7m", "9M"], vibe: "The classic deep house chord stab." },
  maj9: { id: "maj9", name: "major 9th", symbol: "maj9", intervals: ["1P", "3M", "5P", "7M", "9M"], vibe: "Glossy, sophisticated." },
  add9: { id: "add9", name: "add 9", symbol: "add9", intervals: ["1P", "3M", "5P", "9M"], vibe: "Bright with sparkle." },
};

export const CHORD_TYPE_IDS = Object.keys(CHORD_TYPES) as ChordType[];

export function chordSemitones(type: ChordType): number[] {
  return CHORD_TYPES[type].intervals.map((iv) => {
    const n = Note.transpose("C4", iv);
    return (Note.midi(n) ?? 60) - 60;
  });
}

/** Correctly spelled chord tones (no octave): ("A","min7") → A C E G; ("B","dim7") → B D F Ab */
export function chordNotes(root: string, type: ChordType): string[] {
  const r = stripOctave(root);
  return CHORD_TYPES[type].intervals.map((iv) => transpose(r, iv));
}

export function chordPitchClasses(root: string | number, type: ChordType): PitchClass[] {
  const r = pitchClass(root);
  return chordSemitones(type).map((s) => mod12(r + s));
}

export function chordSymbol(root: string, type: ChordType): string {
  return `${stripOctave(root)}${CHORD_TYPES[type].symbol}`;
}

/** Interval labels of the chord from the root, e.g. min7 → ["R", "m3", "P5", "m7"] */
export function chordIntervalLabels(type: ChordType): string[] {
  return chordSemitones(type).map((s, i) => {
    if (i === 0) return "R";
    if (s === 14) return "9";
    if (CHORD_TYPES[type].intervals[i] === "5d") return "d5";
    if (CHORD_TYPES[type].intervals[i] === "5A") return "A5";
    if (CHORD_TYPES[type].intervals[i] === "7d") return "d7";
    return INTERVALS.find((x) => x.semitones === s)?.short ?? String(s);
  });
}

/**
 * Close-voiced MIDI notes for a chord in a given inversion.
 * inversion 0 = root position, 1 = 3rd in bass, 2 = 5th in bass, 3 = 7th in bass.
 * The bass note is placed at or above `bassFloor`.
 */
export function chordMidi(root: string | number, type: ChordType, inversion = 0, bassFloor = 48): number[] {
  const pcs = chordPitchClasses(root, type);
  const semis = chordSemitones(type);
  const n = pcs.length;
  const inv = mod12(inversion) % n;
  const rotated = [...pcs.slice(inv), ...pcs.slice(0, inv)];
  // Extensions (9ths) stay above when rotating.
  const out: number[] = [];
  let prev = placeAbove(rotated[0], bassFloor);
  out.push(prev);
  for (let i = 1; i < n; i++) {
    let m = placeAbove(rotated[i], prev + 1);
    // Keep 9ths spaced as 9ths in root position
    if (inv === 0 && semis[i] > 12) m = out[0] + semis[i];
    out.push(m);
    prev = m;
  }
  return out.sort((a, b) => a - b);
}

export interface DetectedChord {
  root: string;
  type: ChordType;
  symbol: string;
  inversion: number;
}

/** Detect a chord from MIDI notes or note names (pitch-class based, enharmonic-safe). */
export function detectChord(notes: Array<number | string>, prefer: "sharp" | "flat" = "sharp"): DetectedChord | null {
  const pcs = pitchClassSet(notes);
  if (pcs.length < 3) return null;
  const bassPc = typeof notes[0] === "number" ? pitchClass(Math.min(...(notes as number[]))) : pitchClass(notes[0]);
  const names = prefer === "flat" ? ["C", "Db", "D", "Eb", "E", "F", "Gb", "G", "Ab", "A", "Bb", "B"] : ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
  // Prefer the bass note as root (root position), then any other.
  const candidates = [bassPc, ...pcs.filter((p) => p !== bassPc)];
  // Prefer simpler chord types first
  const order: ChordType[] = ["maj", "min", "dim", "aug", "maj7", "min7", "dom7", "m7b5", "dim7", "sus4", "sus2", "min9", "maj9", "add9"];
  for (const rootPc of candidates) {
    for (const type of order) {
      if (sameSet(chordPitchClasses(rootPc, type), pcs)) {
        const root = names[rootPc];
        const tones = chordPitchClasses(rootPc, type);
        const invIdx = tones.indexOf(bassPc);
        return { root, type, symbol: chordSymbol(root, type), inversion: invIdx < 0 ? 0 : invIdx };
      }
    }
  }
  return null;
}

/** Is the given note a chord tone of this chord? */
export function isChordTone(note: string | number, root: string | number, type: ChordType): boolean {
  return chordPitchClasses(root, type).includes(pitchClass(note));
}

/** Role of a note against a chord: "root" | "3rd" | "5th" | "7th" | "9th" | null */
export function chordToneRole(note: string | number, root: string | number, type: ChordType): string | null {
  const pc = pitchClass(note);
  const idx = chordPitchClasses(root, type).indexOf(pc);
  if (idx === -1) return null;
  const sem = chordSemitones(type)[idx];
  if (idx === 0) return "root";
  if (sem === 3 || sem === 4 || sem === 2 || sem === 5) return sem === 2 ? "2nd" : sem === 5 ? "4th" : "3rd";
  if (sem >= 6 && sem <= 8) return "5th";
  if (sem >= 9 && sem <= 11) return "7th";
  return "9th";
}

/**
 * Smooth voice leading: choose a voicing of `next` (any inversion, any octave in range)
 * that minimises total movement from `prev`. Returns MIDI notes.
 */
export function voiceLead(prev: number[], nextRoot: string | number, nextType: ChordType, low = 52, high = 76): number[] {
  const pcs = chordPitchClasses(nextRoot, nextType);
  let best: number[] = chordMidi(nextRoot, nextType, 0, low);
  let bestCost = Infinity;
  for (let inv = 0; inv < pcs.length; inv++) {
    for (let floor = low; floor <= high - 12; floor++) {
      const v = chordMidi(nextRoot, nextType, inv, floor);
      if (v[0] !== floor && v[0] - floor > 0) continue; // only consider exact floors once
      if (v[v.length - 1] > high) continue;
      const cost = movementCost(prev, v);
      if (cost < bestCost) {
        bestCost = cost;
        best = v;
      }
    }
  }
  return best;
}

/** Sum of distances when matching voices of two chords sorted low→high. */
export function movementCost(a: number[], b: number[]): number {
  const sa = [...a].sort((x, y) => x - y);
  const sb = [...b].sort((x, y) => x - y);
  const n = Math.max(sa.length, sb.length);
  let cost = 0;
  for (let i = 0; i < n; i++) {
    const x = sa[Math.min(i, sa.length - 1)];
    const y = sb[Math.min(i, sb.length - 1)];
    cost += Math.abs(x - y);
  }
  return cost;
}

/** Pitch classes shared by two chords (common tones). */
export function commonTones(a: PitchClass[], b: PitchClass[]): PitchClass[] {
  return a.filter((x) => b.includes(x));
}
