"use client";
import Link from "next/link";
import { motion } from "framer-motion";
import { Check, Crown, FastForward, Star } from "lucide-react";
import { WORLDS } from "@/content/curriculum";
import { useProgress } from "@/store/progress";
import { useT } from "@/i18n/useT";
import { lessonMastery, nextRecommended, worldCompletion } from "@/lib/progress/selectors";
import { masteryLabel } from "@/lib/progress/xp";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function LearnPage() {
  const { t, L } = useT();
  const { lessons, stats, placementDone } = useProgress();
  const next = nextRecommended(lessons);

  return (
    <div className="flex flex-col gap-10">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-black">{t("nav_learn")}</h1>
          <p className="text-muted-foreground">Every lesson is open. Follow the path or jump to what you need.</p>
        </div>
        {!placementDone && (
          <Button asChild variant="secondary">
            <Link href="/practice?mode=placement">
              <FastForward /> {t("placementTest")}
            </Link>
          </Button>
        )}
      </div>

      {WORLDS.map((w) => {
        const pct = worldCompletion(w, lessons);
        return (
          <section key={w.id} aria-labelledby={`world-${w.id}`} className="rounded-[2rem] border-2 border-border bg-card/60 p-5 sm:p-7">
            <div className="mb-6 flex flex-wrap items-center gap-4">
              <div className="flex size-14 items-center justify-center rounded-2xl text-2xl font-black text-background" style={{ background: w.color }}>
                {w.id}
              </div>
              <div className="min-w-0 flex-1">
                <h2 id={`world-${w.id}`} className="text-2xl font-black">
                  {L(w.title)}
                </h2>
                <p className="text-sm text-muted-foreground">{L(w.tagline)}</p>
              </div>
              <div className="w-full sm:w-48">
                <div className="mb-1 flex justify-between text-xs font-bold">
                  <span>{Math.round(pct * 100)}% {t("worldComplete")}</span>
                </div>
                <Progress value={pct * 100} indicatorClassName="" style={{}} />
              </div>
            </div>

            <ol className="grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3 lg:grid-cols-4">
              {w.lessons.map((l, i) => {
                const rec = lessons[l.id];
                const m = lessonMastery(l, stats, rec);
                const paws = masteryLabel(m).paws;
                const isNext = next?.id === l.id;
                return (
                  <li key={l.id} className={cn("flex flex-col items-center text-center", i % 2 === 1 && "sm:translate-y-6")}>
                    <motion.div whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.95 }}>
                      <Link
                        href={`/learn/${l.id}`}
                        aria-label={`${L(l.title)}${rec ? ` (${rec.testedOut ? t("testedOut") : t("done")})` : ""}`}
                        className={cn(
                          "relative flex size-20 items-center justify-center rounded-full border-4 text-2xl font-black shadow-[0_6px_0_0_rgba(0,0,0,0.4)] transition-colors",
                          rec ? "border-transparent text-background" : "border-border bg-secondary text-foreground",
                          isNext && "ring-4 ring-lime/60 ring-offset-4 ring-offset-card",
                          l.boss && !rec && "border-pink",
                        )}
                        style={rec ? { background: w.color } : undefined}
                      >
                        {l.boss ? <Crown className="size-8" /> : rec ? <Check className="size-8" strokeWidth={4} /> : i + 1}
                        {isNext && (
                          <motion.span className="absolute -top-3 rounded-full bg-lime px-2 py-0.5 text-[10px] font-black uppercase text-lime-foreground" animate={{ y: [0, -3, 0] }} transition={{ repeat: Infinity, duration: 1.5 }}>
                            {t("recommended")}
                          </motion.span>
                        )}
                      </Link>
                    </motion.div>
                    <p className="mt-3 text-sm font-bold leading-tight">{L(l.title)}</p>
                    <div className="mt-1 flex gap-0.5" aria-label={`Mastery ${paws} of 5`}>
                      {Array.from({ length: 5 }, (_, k) => (
                        <Star key={k} className={cn("size-3", k < paws ? "fill-lime text-lime" : "text-border")} />
                      ))}
                    </div>
                    {rec?.testedOut && <span className="text-[10px] text-muted-foreground">{t("testedOut")}</span>}
                  </li>
                );
              })}
            </ol>
          </section>
        );
      })}
    </div>
  );
}
