import type { StepNote, VoicingMode } from "./events";
import type { ProgChord } from "./progression";
import type { ScaleId } from "@/lib/theory/scales";

export interface LabProjectLike {
  bpm: number;
  tonic: string;
  scale: ScaleId;
  bars: number;
  chords: ProgChord[];
  voicing: VoicingMode;
  stabs: boolean;
  bass: StepNote[];
  melody: StepNote[];
  drums: "house" | "minimal" | "off";
  metronome: boolean;
  mute: { chords: boolean; bass: boolean; melody: boolean };
}
import { chordEvents, drumLoop, NoteEvent, stepsToEvents, voiceProgression } from "./events";
import { resolveProgression } from "./progression";

/** All note events of a Composition Lab project (shared by playback and MIDI export). */
export function projectEvents(p: LabProjectLike, opts: { includeDrums?: boolean } = {}): NoteEvent[] {
  const chords = resolveProgression(p.tonic, p.scale, p.chords);
  const evs: NoteEvent[] = [];
  if (!p.mute.chords) evs.push(...chordEvents(voiceProgression(chords, p.voicing, 55), 4, p.stabs ? "keys" : "pad", 0, p.stabs));
  if (!p.mute.bass) evs.push(...stepsToEvents(p.bass, "bass"));
  if (!p.mute.melody) evs.push(...stepsToEvents(p.melody, "lead", 0, 0.8));
  if (opts.includeDrums !== false) {
    if (p.drums !== "off") evs.push(...drumLoop(p.bars, p.drums));
    if (p.metronome) evs.push(...drumLoop(p.bars, "click"));
  }
  return evs;
}

