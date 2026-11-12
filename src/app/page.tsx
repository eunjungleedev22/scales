"use client";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Dumbbell, FlaskConical, Waves, NotebookPen, ArrowUpRight } from "lucide-react";
import { WORLDS } from "@/content/curriculum";
import { useProgress } from "@/store/progress";
import { useT } from "@/i18n/useT";
import { nextRecommended, worldCompletion, worldMastery } from "@/lib/progress/selectors";
import { levelFromXp, masteryLabel } from "@/lib/progress/xp";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Cat } from "@/components/mascot/Cat";
import { loc } from "@/lib/exercises/types";

export default function Dashboard() {
  const { t } = useT();
  const en = (x: Parameters<typeof loc>[0]) => loc(x, "en");
  const { xp, lessons, stats, totalAnswered, achievements, placementDone } = useProgress();
  const next = nextRecommended(lessons);
  const currentWorld = WORLDS.find((w) => w.id === (next?.worldId ?? 7))!;
  const lvl = levelFromXp(xp);
  const fresh = totalAnswered === 0;
  const worldPct = Math.round(worldCompletion(currentWorld, lessons) * 100);

  return (
    <div className="flex flex-col gap-8">
      {/* Hero */}
      <motion.section initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="panel relative overflow-hidden">
        <div aria-hidden className="absolute inset-y-0 left-0 w-1.5 bg-primary" />
        <div className="flex flex-col gap-6 p-6 pl-8 sm:flex-row sm:items-end sm:justify-between sm:p-8 sm:pl-10">
          <div className="flex-1">
            <p className="label">
              {fresh ? "Welcome, producer" : `Up next · World ${String(currentWorld.id).padStart(2, "0")} · ${en(currentWorld.title)}`}
            </p>
            <h1 className="display mt-3 text-4xl sm:text-6xl">{fresh ? "Learn theory by ear." : next ? en(next.title) : "Go make a track."}</h1>
            <p className="mt-3 max-w-lg text-muted-foreground">
              {fresh ? "Short exercises you can hear. No streaks, no timers, no guilt — stop whenever." : next ? en(next.concept[0]) : "Every lesson is done. The Lab is waiting."}
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              {next && (
                <Button asChild size="lg" className="w-full sm:w-auto">
                  <Link href={`/learn/${next.id}`}>
                    {fresh ? t("startLearning") : t("continue")} <ArrowRight />
                  </Link>
                </Button>
              )}
              {fresh && !placementDone && (
                <Button asChild size="lg" variant="secondary" className="w-full sm:w-auto">
                  <Link href="/practice?mode=placement">{t("placementTest")}</Link>
                </Button>
              )}
            </div>
          </div>
          <div className="hidden shrink-0 sm:block">
            <Cat mood={fresh ? "idle" : "happy"} size={150} />
          </div>
        </div>
        {/* readout strip */}
        <div className="grid grid-cols-3 divide-x divide-border border-t border-border bg-[#171512]">
          {[
            ["Level", String(lvl.level).padStart(2, "0")],
            ["XP", String(xp).padStart(4, "0")],
            ["Badges", `${Object.keys(achievements).length}`],
          ].map(([k, v]) => (
            <div key={k} className="px-5 py-3 sm:px-8">
              <p className="label">{k}</p>
              <p className="readout text-xl text-lime sm:text-2xl">{v}</p>
            </div>
          ))}
        </div>
      </motion.section>

      {/* Modes */}
      <section className="grid grid-cols-1 gap-px overflow-hidden rounded-lg border border-border bg-border md:grid-cols-4">
        <ModeTile href="/practice?mode=quick" n="A" icon={Dumbbell} title={t("quickPractice")} desc="5 mixed drills · ~3 min" />
        <ModeTile href="/practice?mode=deep" n="B" icon={Waves} title={t("deepDive")} desc="Endless, adaptive, pause anytime" />
        <ModeTile href="/lab" n="C" icon={FlaskConical} title="Composition Lab" desc="Chords · bass · melody · MIDI" />
        <ModeTile href="/reflect" n="D" icon={NotebookPen} title="Reflect" desc="Generate notes on what you practised" />
      </section>

      {/* Worlds */}
      <section className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="mb-3 flex items-baseline justify-between">
            <h2 className="section-title">
              <span>01</span> {t("skillMastery")}
            </h2>
            <Link href="/learn" className="label hover:text-foreground">
              Open map →
            </Link>
          </div>
          <div className="panel divide-y divide-border">
            {WORLDS.map((w) => {
              const m = worldMastery(w, stats, lessons);
              const c = worldCompletion(w, lessons);
              return (
                <Link key={w.id} href="/learn" className="grid grid-cols-[2.5rem_1fr] items-center gap-x-3 gap-y-1.5 px-4 py-3 transition-colors hover:bg-secondary/50 sm:grid-cols-[2.5rem_1fr_8rem_7rem]">
                  <span className="readout text-sm" style={{ color: w.color }}>
                    W{String(w.id).padStart(2, "0")}
                  </span>
                  <span className="truncate font-semibold">{en(w.title)}</span>
                  <Progress value={c * 100} className="col-start-2 sm:col-start-auto" />
                  <span className="label col-start-2 sm:col-start-auto sm:text-right">{masteryLabel(m).label}</span>
                </Link>
              );
            })}
          </div>
        </div>
        <div>
          <h2 className="section-title mb-3">
            <span>02</span> {t("currentWorld")}
          </h2>
          <div className="panel p-5">
            <p className="label">World {String(currentWorld.id).padStart(2, "0")}</p>
            <p className="mt-1 text-xl font-extrabold">{en(currentWorld.title)}</p>
            <p className="readout mt-4 text-6xl" style={{ color: currentWorld.color }}>
              {worldPct}
              <span className="text-2xl text-muted-foreground">%</span>
            </p>
            <p className="label mt-1">
              {currentWorld.lessons.filter((l) => lessons[l.id]).length}/{currentWorld.lessons.length} lessons
            </p>
            <div className="mt-5 flex flex-col gap-1.5 text-sm">
              <Link href="/ear-training" className="flex items-center justify-between border-t border-border pt-2 hover:text-primary">
                {t("nav_ear")} <ArrowUpRight className="size-4" />
              </Link>
              <Link href="/playground" className="flex items-center justify-between border-t border-border pt-2 hover:text-primary">
                {t("nav_playground")} <ArrowUpRight className="size-4" />
              </Link>
              <Link href="/progress" className="flex items-center justify-between border-t border-border pt-2 hover:text-primary">
                {t("achievements")} <ArrowUpRight className="size-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function ModeTile({ href, n, icon: Icon, title, desc }: { href: string; n: string; icon: React.ComponentType<{ className?: string }>; title: string; desc: string }) {
  return (
    <Link href={href} className="group flex flex-col gap-3 bg-card p-5 transition-colors hover:bg-[#221f1b]">
      <span className="flex items-center justify-between">
        <span className="readout text-xs text-primary">{n}</span>
        <Icon className="size-5 text-muted-foreground transition-colors group-hover:text-primary" />
      </span>
      <span className="text-lg font-extrabold uppercase leading-tight" style={{ fontStretch: "115%" }}>
        {title}
      </span>
      <span className="text-sm text-muted-foreground">{desc}</span>
    </Link>
  );
}
