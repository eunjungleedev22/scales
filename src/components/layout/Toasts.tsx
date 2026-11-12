"use client";
import { AnimatePresence, motion } from "framer-motion";
import { useUI } from "@/store/ui";
import { ACHIEVEMENTS } from "@/content/achievements";
import { useT } from "@/i18n/useT";

export function Toasts() {
  const toasts = useUI((s) => s.toasts);
  const { L } = useT();
  return (
    <div className="pointer-events-none fixed right-4 top-16 z-50 flex flex-col items-end gap-2" aria-live="polite">
      <AnimatePresence>
        {toasts.map((t) => {
          if (t.kind === "achievement") {
            const a = ACHIEVEMENTS.find((x) => x.id === t.value);
            if (!a) return null;
            return (
              <motion.div key={t.id} initial={{ opacity: 0, x: 40, scale: 0.9 }} animate={{ opacity: 1, x: 0, scale: 1 }} exit={{ opacity: 0, x: 40 }} className="panel flex items-center gap-3 border-l-4 border-l-lime px-4 py-3 shadow-xl">
                <span className="text-3xl">{a.emoji}</span>
                <div>
                  <p className="label text-lime">Achievement unlocked</p>
                  <p className="font-black">{L(a.title)}</p>
                </div>
              </motion.div>
            );
          }
          return (
            <motion.div key={t.id} initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="readout rounded-md bg-lime px-3 py-1.5 text-sm text-lime-foreground shadow-lg">
              {t.value}
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
