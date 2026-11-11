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
      document.documentElement.lang = useSettings.getState().lang;
    });
    const unlock = () => {
      void audio.init();
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("keydown", unlock);
    };
    window.addEventListener("pointerdown", unlock);
    window.addEventListener("keydown", unlock);
    const unsub = useSettings.subscribe((s) => {
      audio.setVolume(s.volume);
      document.documentElement.lang = s.lang;
    });
    const onHide = () => {
      if (document.visibilityState === "hidden") audio.stop();
    };
    document.addEventListener("visibilitychange", onHide);
    return () => {
      unsub();
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("keydown", unlock);
      document.removeEventListener("visibilitychange", onHide);
    };
  }, []);
  return <>{children}</>;
}
