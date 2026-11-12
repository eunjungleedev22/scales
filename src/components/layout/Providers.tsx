"use client";
import { useEffect } from "react";
import { useProgress } from "@/store/progress";
import { useSettings } from "@/store/settings";
import { useLab } from "@/store/lab";
import { useUI } from "@/store/ui";
import { audio } from "@/lib/audio/engine";

/** Rehydrates persisted stores on the client and unlocks audio on the first user gesture. */
export function Providers({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    Promise.all([useSettings.persist.rehydrate(), useProgress.persist.rehydrate(), useLab.persist.rehydrate()]).finally(() => {
      useUI.getState().setHydrated();
      useProgress.getState().touch();
      audio.setVolume(useSettings.getState().volume);
      audio.setPreset(useSettings.getState().tonePreset ?? "epiano");
      document.documentElement.lang = useSettings.getState().lang;
    });
    // Download the audio library right away, then start sound on any tap/click/key.
    // Listeners stay attached: they are cheap no-ops once audio is running, and they re-unlock
    // audio if the phone suspends it (calls, backgrounding, iOS "interrupted" state).
    void audio.preload();
    (window as unknown as { __harmonicCatAudio?: typeof audio }).__harmonicCatAudio = audio; // for the sound check / debugging
    const unlock = () => audio.unlockFromGesture();
    const events = ["pointerdown", "pointerup", "touchend", "click", "keydown"] as const;
    events.forEach((ev) => window.addEventListener(ev, unlock, { capture: true, passive: true }));
    const unsub = useSettings.subscribe((s) => {
      audio.setVolume(s.volume);
      if (s.tonePreset && s.tonePreset !== audio.preset) audio.setPreset(s.tonePreset);
      document.documentElement.lang = s.lang;
    });
    const onHide = () => {
      if (document.visibilityState === "hidden") audio.stop();
    };
    document.addEventListener("visibilitychange", onHide);
    return () => {
      unsub();
      events.forEach((ev) => window.removeEventListener(ev, unlock, { capture: true }));
      document.removeEventListener("visibilitychange", onHide);
    };
  }, []);
  return <>{children}</>;
}
