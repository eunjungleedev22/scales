"use client";
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { Lang } from "@/lib/exercises/types";

export interface SettingsState {
  lang: Lang;
  showNoteNames: boolean;
  solfege: boolean;
  preferFlats: boolean;
  focusMode: boolean;
  volume: number;
  reducedMotion: boolean;
  breakReminderMinutes: number; // 0 = off
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
      set: (p) => set(p),
    }),
    { name: "harmonic-cat-settings", version: 1, storage: createJSONStorage(() => localStorage), skipHydration: true },
  ),
);
