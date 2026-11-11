"use client";
import { useEffect, useSyncExternalStore } from "react";
import { audio } from "@/lib/audio/engine";

export function useAudioState() {
  const snap = useSyncExternalStore(audio.subscribe, audio.getSnapshot, () => "idle|false");
  const [status, playing] = snap.split("|");
  return { status: status as typeof audio.status, playing: playing === "true" };
}

/** Stop any audio when the component unmounts (prevents overlap between exercises/pages). */
export function useStopOnUnmount() {
  useEffect(() => () => audio.stop(), []);
}
