"use client";
import Link from "next/link";
import { Check, Crown, FastForward } from "lucide-react";
import { WORLDS } from "@/content/curriculum";
import { useProgress } from "@/store/progress";
import { useT } from "@/i18n/useT";
import { lessonMastery, nextRecommended, worldCompletion } from "@/lib/progress/selectors";
import { masteryLabel } from "@/lib/progress/xp";
import { loc } from "@/lib/exercises/types";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/** The skill tree, drawn as a bank of sequencer pads per world. */
export default function LearnPage() {
  const { t } = useT();
  const en = (x: Parameters<typeof loc>[0]) => loc(x, "en");
  const { lessons, stats, placementDone } = useProgress();
  const next = nextRecommended(lessons);

  return (
    <div className="flex flex-col gap-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="label">7 worlds · {WORLDS.reduce((n, w) => n + w.lessons.length, 0)} lessons</p>
          <h1 className="display mt-2 text-4xl sm:text-5xl">{t("nav_learn")}</h1>
          <p className="mt-2 text-muted-foreground">Every pad is open. Follow the lit path or jump anywhere.</p>
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
          <section key={w.id} aria-labelledby={`world-${w.id}`} className="panel overflow-hidden">
            <div className="flex flex-wrap items-center gap-4 border-b border-border bg-[#171512] px-5 py-4">
              <span className="readout text-3xl" style={{ color: w.color }}>
                {String(w.id).padStart(2, "0")}
              </span>
              <div className="min-w-0 flex-1">
                <h2 id={`world-${w.id}`} className="text-xl font-extrabold uppercase leading-tight" style={{ fontStretch: "118%" }}>
                  {en(w.title)}
                </h2>
                <p className="text-sm text-muted-foreground">{en(w.tagline)}</p>
              </div>
              <div className="w-full sm:w-44">
                <div className="mb-1.5 flex justify-between">
                  <span className="label">Progress</span>
                  <span className="readout text-xs">{Math.round(pct * 100)}%</span>
                </div>
                <Progress value={pct * 100} />
              </div>
            </div>

            <ol className="grid grid-cols-3 gap-2 p-3 sm:grid-cols-4 sm:gap-3 sm:p-5 lg:grid-cols-6">
              {w.lessons.map((l, i) => {
                const rec = lessons[l.id];
                const paws = masteryLabel(lessonMastery(l, stats, rec)).paws;
                const isNext = next?.id === l.id;
                return (
                  <li key={l.id}>
                    <Link
                      href={`/learn/${l.id}`}
                      aria-label={`${en(l.title)}${rec ? ` (${rec.testedOut ? t("testedOut") : t("done")})` : ""}${isNext ? " — next up" : ""}`}
                      className={cn(
                        "group relative flex aspect-square flex-col justify-between rounded-md border p-2 sm:p-2.5 transition-[transform,filter] active:translate-y-[2px]",
                        rec ? "border-transparent text-[#18140a] shadow-[0_3px_0_0_#00000080]" : "border-border bg-[#14120f] shadow-[inset_0_2px_0_#00000060,0_3px_0_0_#0b0a09] hover:border-muted-foreground/40",
                        isNext && "border-primary ring-1 ring-primary",
                        l.boss && !rec && "border-dashed border-primary/70",
                      )}
                      style={rec ? { background: w.color, boxShadow: `0 0 18px -6px ${w.color}, 0 3px 0 0 #00000080` } : undefined}
                    >
                      <span className="flex items-start justify-between">
                        <span className={cn("readout text-[11px]", rec ? "opacity-70" : "text-muted-foreground")}>{String(i + 1).padStart(2, "0")}</span>
                        {isNext ? <span className="led led-orange blink" /> : rec ? <Check className="size-4" strokeWidth={3} /> : l.boss ? <Crown className="size-4 text-primary" /> : null}
                      </span>
                      <span className={cn("line-clamp-3 text-[11.5px] font-bold leading-tight sm:text-[13px]", !rec && "text-foreground")}>{en(l.title)}</span>
                      <span className="flex gap-0.5" aria-label={`Mastery ${paws} of 5`}>
                        {Array.from({ length: 5 }, (_, k) => (
                          <span key={k} className={cn("h-1 flex-1 rounded-[1px]", k < paws ? (rec ? "bg-[#18140a]" : "bg-lime") : rec ? "bg-[#18140a]/20" : "bg-border")} />
                        ))}
                      </span>
                    </Link>
                    {isNext && <p className="label mt-1.5 text-primary">{t("recommended")}</p>}
                    {rec?.testedOut && <p className="label mt-1.5">{t("testedOut")}</p>}
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
