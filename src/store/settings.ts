"use client";
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { Lang } from "@/lib/exercises/types";
import type { TonePreset } from "@/lib/audio/engine";

export interface SettingsState {
  lang: Lang;
  showNoteNames: boolean;
  solfege: boolean;
  preferFlats: boolean;
  focusMode: boolean;
  volume: number;
  reducedMotion: boolean;
  breakReminderMinutes: number; // 0 = off
  /** Show Korean words next to English music terms */
  koreanTerms: boolean;
  /** Instrument sound for keys, pads, bass and lead */
  tonePreset: TonePreset;
  /** Read intros / concepts aloud */
  narration: boolean;
  narrationRate: number;
  narrationVoice: string | null;
  /** "natural" = pre-recorded neural voice, "device" = the browser/phone voice */
  voiceStyle: "natural" | "device";
  set: (p: Partial<Omit<SettingsState, "set">>) => void;
}

export const useSettings = create<SettingsState>()(
  persist(
    (set) => ({
      lang: "en",
      showNoteNames: true,
      solfege: false,
      preferFlats: false,
      focusMode: false,
      volume: 0.8,
      reducedMotion: false,
      breakReminderMinutes: 50,
      koreanTerms: true,
      tonePreset: "epiano",
      narration: true,
      narrationRate: 1,
      narrationVoice: null,
      voiceStyle: "natural",
      set: (p) => set(p),
    }),
    { name: "harmonic-cat-settings", version: 1, storage: createJSONStorage(() => localStorage), skipHydration: true },
  ),
);
