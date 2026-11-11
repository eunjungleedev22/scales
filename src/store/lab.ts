"use client";
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { StepNote, VoicingMode } from "@/lib/music/events";
import type { ScaleId } from "@/lib/theory/scales";
import type { ChordType } from "@/lib/theory/chords";
import { mod12, pitchClass } from "@/lib/theory/notes";

export interface LabChord {
  degree: number; // 1..7
  seventh: boolean;
  /** Optional quality override (e.g. major V in minor) */
  override?: ChordType;
  /** Optional custom root for borrowed/chromatic chords (e.g. "Bb" in C major) */
  root?: string;
}

export interface LabProject {
  bpm: number;
  tonic: string;
  scale: ScaleId;
  bars: 4 | 8 | 16;
  chords: LabChord[]; // one per bar
  voicing: VoicingMode;
  stabs: boolean;
  bass: StepNote[];
  melody: StepNote[];
  drums: "house" | "minimal" | "off";
  metronome: boolean;
  mute: { chords: boolean; bass: boolean; melody: boolean };
}

export const DEFAULT_PROJECT: LabProject = {
  bpm: 122,
  tonic: "A",
  scale: "minor",
  bars: 4,
  chords: [
    { degree: 1, seventh: true },
    { degree: 6, seventh: true },
    { degree: 3, seventh: true },
    { degree: 7, seventh: false },
  ],
  voicing: "smooth",
  stabs: false,
  bass: [
    { step: 0, midi: 33, len: 3 },
    { step: 6, midi: 45, len: 1 },
    { step: 10, midi: 40, len: 2 },
    { step: 16, midi: 29, len: 3 },
    { step: 22, midi: 41, len: 1 },
    { step: 26, midi: 36, len: 2 },
    { step: 32, midi: 36, len: 3 },
    { step: 38, midi: 48, len: 1 },
    { step: 42, midi: 43, len: 2 },
    { step: 48, midi: 31, len: 3 },
    { step: 54, midi: 43, len: 1 },
    { step: 58, midi: 38, len: 2 },
  ],
  melody: [],
  drums: "house",
  metronome: false,
  mute: { chords: false, bass: false, melody: false },
};

interface LabState {
  project: LabProject;
  update: (p: Partial<LabProject>) => void;
  setKey: (tonic: string, scale: ScaleId) => void;
  setChord: (bar: number, c: LabChord) => void;
  setBars: (bars: 4 | 8 | 16, mode: "repeat" | "vary" | "empty") => void;
  reset: () => void;
}

export const useLab = create<LabState>()(
  persist(
    (set, get) => ({
      project: DEFAULT_PROJECT,
      update: (p) => set({ project: { ...get().project, ...p } }),
      setKey: (tonic, scale) => {
        const p = get().project;
        // Transpose bass & melody by the smallest move between tonics
        let d = mod12(pitchClass(tonic) - pitchClass(p.tonic));
        if (d > 6) d -= 12;
        const tr = (ns: StepNote[]) => ns.map((n) => ({ ...n, midi: n.midi + d }));
        set({ project: { ...p, tonic, scale, bass: tr(p.bass), melody: tr(p.melody) } });
      },
      setChord: (bar, c) => {
        const chords = [...get().project.chords];
        chords[bar] = c;
        set({ project: { ...get().project, chords } });
      },
      setBars: (bars, mode) => {
        const p = get().project;
        const cur = p.bars;
        if (bars <= cur) {
          set({
            project: { ...p, bars, chords: p.chords.slice(0, bars), bass: p.bass.filter((n) => n.step < bars * 16), melody: p.melody.filter((n) => n.step < bars * 16) },
          });
          return;
        }
        const chords = [...p.chords];
        const bass = [...p.bass];
        const melody = [...p.melody];
        for (let b = cur; b < bars; b++) {
          const src = b % cur;
          if (mode === "empty") {
            chords.push({ degree: 1, seventh: false });
            continue;
          }
          let c = { ...p.chords[src] };
          // Variation: change the last chord of each new 4-bar group to a related chord (A A' form)
          if (mode === "vary" && b % 4 === 3) c = { ...c, degree: c.degree === 5 ? 4 : 5 };
          chords.push(c);
          const shift = (b - src) * 16;
          for (const n of p.bass.filter((n) => Math.floor(n.step / 16) === src)) bass.push({ ...n, step: n.step + shift });
          for (const n of p.melody.filter((n) => Math.floor(n.step / 16) === src)) {
            // Variation: last melody note of bar 8/16 resolves to the tonic
            melody.push({ ...n, step: n.step + shift });
          }
        }
        set({ project: { ...p, bars, chords, bass, melody } });
      },
      reset: () => set({ project: DEFAULT_PROJECT }),
    }),
    { name: "harmonic-cat-lab", version: 1, storage: createJSONStorage(() => localStorage), skipHydration: true },
  ),
);
