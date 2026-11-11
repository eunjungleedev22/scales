"use client";
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { ALL_LESSONS, WORLDS } from "@/content/curriculum";
import { BOSS_BONUS, ExerciseStat, LESSON_BONUS, PERFECT_BONUS, xpForAttempt, AttemptInfo } from "@/lib/progress/xp";
import { useUI } from "./ui";

export interface LessonRecord {
  completedAt: number;
  bestScore: number; // 0..1 first-try accuracy
  testedOut?: boolean;
}

interface ProgressState {
  xp: number;
  stats: Record<string, ExerciseStat>;
  lessons: Record<string, LessonRecord>;
  achievements: Record<string, number>;
  lastLessonId: string | null;
  lastActive: number | null;
  earStreak: number;
  explored: string[];
  deepDiveMinutes: number;
  placementDone: boolean;
  totalAnswered: number;
  labFlags: { progression: boolean; bass: boolean; melody: boolean };

  recordAttempt: (exerciseId: string, info: AttemptInfo & { ear?: boolean }) => number;
  completeLesson: (lessonId: string, firstTryRate: number) => number;
  testOut: (lessonIds: string[]) => void;
  unlock: (id: string) => void;
  touch: () => void;
  explore: (key: string) => void;
  addDeepDiveMinutes: (m: number) => void;
  setLastLesson: (id: string) => void;
  setPlacementDone: () => void;
  flagLab: (k: "progression" | "bass" | "melody") => void;
  reset: () => void;
}

const initial = {
  xp: 0,
  stats: {},
  lessons: {},
  achievements: {},
  lastLessonId: null,
  lastActive: null,
  earStreak: 0,
  explored: [],
  deepDiveMinutes: 0,
  placementDone: false,
  totalAnswered: 0,
  labFlags: { progression: false, bass: false, melody: false },
};

export const useProgress = create<ProgressState>()(
  persist(
    (set, get) => ({
      ...initial,

      unlock: (id) => {
        if (get().achievements[id]) return;
        set((s) => ({ achievements: { ...s.achievements, [id]: Date.now() } }));
        useUI.getState().pushAchievement(id);
      },

      recordAttempt: (exerciseId, info) => {
        const prior = get().stats[exerciseId];
        const xp = xpForAttempt(info, prior);
        const stat: ExerciseStat = {
          attempts: (prior?.attempts ?? 0) + 1,
          correct: (prior?.correct ?? 0) + (info.correct ? 1 : 0),
          firstTryCorrect: (prior?.firstTryCorrect ?? 0) + (info.correct && info.firstTry ? 1 : 0),
          lastSeen: Date.now(),
        };
        const earStreak = info.ear ? (info.correct ? get().earStreak + 1 : 0) : get().earStreak;
        set((s) => ({ xp: s.xp + xp, stats: { ...s.stats, [exerciseId]: stat }, earStreak, totalAnswered: s.totalAnswered + 1, lastActive: Date.now() }));
        const u = get().unlock;
        if (info.correct) u("first-purr");
        if (info.correct && !info.firstTry) u("nine-lives");
        if (earStreak >= 10) u("golden-ears");
        const h = new Date().getHours();
        if (h >= 0 && h < 5) u("night-prowler");
        if (xp > 0) useUI.getState().pushXp(xp);
        return xp;
      },

      completeLesson: (lessonId, firstTryRate) => {
        const lesson = ALL_LESSONS.find((l) => l.id === lessonId);
        const prev = get().lessons[lessonId];
        let bonus = 0;
        if (!prev || prev.testedOut) bonus += lesson?.boss ? BOSS_BONUS : LESSON_BONUS;
        if (firstTryRate === 1 && (!prev || prev.bestScore < 1)) bonus += PERFECT_BONUS;
        set((s) => ({
          xp: s.xp + bonus,
          lessons: { ...s.lessons, [lessonId]: { completedAt: Date.now(), bestScore: Math.max(prev?.bestScore ?? 0, firstTryRate) } },
        }));
        const u = get().unlock;
        if (firstTryRate === 1) u("whisker-perfect");
        if (lesson?.boss) u("big-cat");
        for (const w of WORLDS.slice(0, 3)) {
          if (w.lessons.every((l) => get().lessons[l.id])) u(`world-${w.id}`);
        }
        if (bonus > 0) useUI.getState().pushXp(bonus);
        return bonus;
      },

      testOut: (ids) => {
        if (ids.every((id) => get().lessons[id])) return;
        set((s) => {
          const lessons = { ...s.lessons };
          for (const id of ids) if (!lessons[id]) lessons[id] = { completedAt: Date.now(), bestScore: 0, testedOut: true };
          return { lessons };
        });
        if (ids.length) get().unlock("skip-ahead");
      },

      touch: () => {
        const last = get().lastActive;
        if (last && Date.now() - last > 3 * 24 * 3600 * 1000) get().unlock("long-nap");
        set({ lastActive: Date.now() });
      },

      explore: (key) => {
        if (get().explored.includes(key)) return;
        const explored = [...get().explored, key];
        set({ explored });
        if (explored.length >= 10) get().unlock("curious-cat");
      },

      addDeepDiveMinutes: (m) => set((s) => ({ deepDiveMinutes: s.deepDiveMinutes + m })),
      setLastLesson: (id) => set({ lastLessonId: id }),
      setPlacementDone: () => set({ placementDone: true }),
      flagLab: (k) => {
        const labFlags = { ...get().labFlags, [k]: true };
        set({ labFlags });
        if (k === "bass") get().unlock("acid-kitty");
        if (labFlags.progression && labFlags.bass && labFlags.melody) get().unlock("composer");
      },
      reset: () => set({ ...initial }),
    }),
    { name: "harmonic-cat-progress", version: 1, storage: createJSONStorage(() => localStorage), skipHydration: true },
  ),
);
