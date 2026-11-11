"use client";
import { create } from "zustand";

export interface Toast {
  id: number;
  kind: "xp" | "achievement" | "info";
  value: string;
}

interface UIState {
  hydrated: boolean;
  toasts: Toast[];
  setHydrated: () => void;
  pushXp: (xp: number) => void;
  pushAchievement: (id: string) => void;
  pushInfo: (msg: string) => void;
  dismiss: (id: number) => void;
}

let nextId = 1;

export const useUI = create<UIState>()((set, get) => ({
  hydrated: false,
  toasts: [],
  setHydrated: () => set({ hydrated: true }),
  pushXp: (xp) => add({ id: nextId++, kind: "xp", value: `+${xp} XP` }),
  pushAchievement: (id) => add({ id: nextId++, kind: "achievement", value: id }),
  pushInfo: (msg) => add({ id: nextId++, kind: "info", value: msg }),
  dismiss: (id) => set({ toasts: get().toasts.filter((t) => t.id !== id) }),
}));

function add(t: Toast) {
  useUI.setState((s) => ({ toasts: [...s.toasts.slice(-3), t] }));
  setTimeout(() => useUI.getState().dismiss(t.id), t.kind === "achievement" ? 4500 : 1800);
}
