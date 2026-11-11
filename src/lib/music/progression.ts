import { analyzeRoman, diatonicChords, functionOf, HarmonicFunction } from "@/lib/theory/harmony";
import { ChordType, chordSymbol } from "@/lib/theory/chords";
import { SCALES, ScaleId } from "@/lib/theory/scales";

export interface ProgChord {
  degree: number;
  seventh: boolean;
  override?: ChordType;
  root?: string;
}

export interface ResolvedChord {
  root: string;
  type: ChordType;
  symbol: string;
  roman: string;
  fn: HarmonicFunction | "chromatic";
  diatonic: boolean;
}

/** 7-note scales that support diatonic chords. */
export const HARMONY_SCALES: ScaleId[] = (Object.keys(SCALES) as ScaleId[]).filter((s) => SCALES[s].steps.length === 7);

export function resolveChord(tonic: string, scale: ScaleId, c: ProgChord): ResolvedChord {
  const dia = diatonicChords(tonic, scale, c.seventh)[(c.degree - 1) % 7];
  const root = c.root ?? dia.root;
  const type = c.override ?? dia.type;
  const { roman, diatonic } = analyzeRoman(tonic, scale, root, type);
  return {
    root,
    type,
    symbol: chordSymbol(root, type),
    roman,
    fn: diatonic ? functionOf(c.degree, SCALES[scale].quality, scale) : "chromatic",
    diatonic,
  };
}

export function resolveProgression(tonic: string, scale: ScaleId, chords: ProgChord[]): ResolvedChord[] {
  return chords.map((c) => resolveChord(tonic, scale, c));
}
