import type { ChordType } from "@/lib/theory/chords";
import type { ScaleId } from "@/lib/theory/scales";
import type { StepNote } from "@/lib/music/events";

export type Lang = "en" | "ko";
export type Localized = string | { en: string; ko?: string };

export function loc(l: Localized | undefined, lang: Lang): string {
  if (l === undefined) return "";
  if (typeof l === "string") return l;
  return (lang === "ko" && l.ko) || l.en;
}

/** Audio attached to an exercise or lesson demo. */
export type AudioCue =
  | { type: "notes"; midis: number[]; mode: "chord" | "melody" | "both"; beats?: number }
  | { type: "progression"; tonic?: string; chords: Array<{ root: string; type: ChordType }>; bpm?: number; withBass?: boolean }
  | { type: "steps"; notes: StepNote[]; instrument: "bass" | "lead" | "keys"; bpm?: number; drums?: boolean };

interface ExerciseBase {
  id: string;
  prompt: Localized;
  /** Optional hint. Piano exercises auto-generate one if omitted. */
  hint?: Localized;
  /** Why the answer works. Auto-generated for piano exercises if omitted. */
  explanation?: Localized;
  /** Optional link to production practice. */
  production?: Localized;
}

export interface IdentifyNoteExercise extends ExerciseBase {
  kind: "identify-note";
  /** Note name without octave; any octave is accepted ("Gb" accepts the F#/Gb key). */
  note: string;
}

export interface BuildIntervalExercise extends ExerciseBase {
  kind: "build-interval";
  /** Starting note with octave, shown on the keyboard */
  from: string;
  /** Interval short name: m2, M2, m3, M3, P4, TT, P5, m6, M6, m7, M7, P8 */
  interval: string;
}

export interface BuildScaleExercise extends ExerciseBase {
  kind: "build-scale";
  tonic: string;
  scale: ScaleId;
}

export interface BuildChordExercise extends ExerciseBase {
  kind: "build-chord";
  root: string;
  chord: ChordType;
  /** If set, the lowest selected note must be this chord member (0 root, 1 third, 2 fifth, 3 seventh). */
  inversion?: number;
}

export interface ChoiceExercise extends ExerciseBase {
  kind: "choice";
  options: Localized[];
  answer: number;
  audio?: AudioCue;
  /** Notes to show (highlighted, read-only) on a keyboard */
  show?: number[];
  /** Ear-training questions hide the visual answer */
  ear?: boolean;
}

export interface EarIntervalExercise extends ExerciseBase {
  kind: "ear-interval";
  pool: string[];
  mode: "melodic" | "harmonic";
}

export interface EarChordExercise extends ExerciseBase {
  kind: "ear-chord";
  pool: ChordType[];
}

export interface ProgressionExercise extends ExerciseBase {
  kind: "complete-progression";
  tonic: string;
  scale: ScaleId;
  degrees: number[];
  /** index in `degrees` that is hidden */
  missing: number;
  /** candidate degrees to choose from */
  options: number[];
  sevenths?: boolean;
  /** Other degrees that are musically valid but not the target answer (creative choices) */
  alsoWorks?: Array<{ degree: number; why: Localized }>;
}

export interface FixMelodyExercise extends ExerciseBase {
  kind: "fix-melody";
  tonic: string;
  scale: ScaleId;
  chord: { root: string; type: ChordType };
  /** 8 eighth-note MIDI pitches over one bar */
  melody: number[];
  /** indices the user may change */
  editable: number[];
  /** indices that must be chord tones for the theoretical goal (e.g. the final note) */
  mustBeChordTone: number[];
}

export interface BasslineExercise extends ExerciseBase {
  kind: "bassline";
  tonic: string;
  scale: ScaleId;
  /** chords spread evenly across 16 steps */
  chords: Array<{ root: string; type: ChordType }>;
  /** lowest MIDI note of the sequencer rows */
  low: number;
  bpm?: number;
}

export interface CallResponseExercise extends ExerciseBase {
  kind: "call-response";
  tonic: string;
  scale: ScaleId;
  /** 32 steps (2 bars) call phrase */
  call: StepNote[];
  /** chord under the phrases (for chord-tone feedback) */
  chord: { root: string; type: ChordType };
  low: number;
  bpm?: number;
}

export type ExerciseDef =
  | IdentifyNoteExercise
  | BuildIntervalExercise
  | BuildScaleExercise
  | BuildChordExercise
  | ChoiceExercise
  | EarIntervalExercise
  | EarChordExercise
  | ProgressionExercise
  | FixMelodyExercise
  | BasslineExercise
  | CallResponseExercise;

/** Exercise ready to render (random ear-training definitions are instantiated into choice exercises). */
export type ConcreteExercise = Exclude<ExerciseDef, EarIntervalExercise | EarChordExercise>;

export type Answer =
  | { kind: "keys"; midis: number[] }
  | { kind: "choice"; index: number }
  | { kind: "melody"; notes: number[] }
  | { kind: "steps"; notes: StepNote[] };

export type EvalStatus = "correct" | "incorrect" | "creative";

export interface Evaluation {
  status: EvalStatus;
  /** Did the answer satisfy the objective requirements of the task? */
  correct: boolean;
  message: Localized;
  /** Bullet-point details (why) */
  details: Localized[];
  /** Pitch-class feedback for keyboard highlighting */
  pcs?: { right: number[]; wrong: number[]; missing: number[] };
}
