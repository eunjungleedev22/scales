"use client";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Dumbbell, FlaskConical, Waves, Ear, Shapes, Trophy } from "lucide-react";
import { WORLDS } from "@/content/curriculum";
import { useProgress } from "@/store/progress";
import { useT } from "@/i18n/useT";
import { nextRecommended, worldCompletion, worldMastery } from "@/lib/progress/selectors";
import { levelFromXp, masteryLabel } from "@/lib/progress/xp";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Cat } from "@/components/mascot/Cat";

export default function Dashboard() {
  const { t, L } = useT();
  const { xp, lessons, stats, totalAnswered, achievements, placementDone } = useProgress();
  const next = nextRecommended(lessons);
  const currentWorld = WORLDS.find((w) => w.id === (next?.worldId ?? 7))!;
  const lvl = levelFromXp(xp);
  const fresh = totalAnswered === 0;

  return (
    <div className="flex flex-col gap-6">
      <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-primary/40 via-card to-pink/20 p-6 sm:p-8">
        <div className="flex flex-col items-start gap-5 sm:flex-row sm:items-center">
          <Cat mood={fresh ? "idle" : "happy"} size={120} />
          <div className="flex-1">
            <p className="text-sm font-bold uppercase tracking-widest text-lime">{fresh ? "Welcome, producer" : `${t("level")} ${lvl.level}`}</p>
            <h1 className="mt-1 text-3xl font-black leading-tight sm:text-4xl">
              {fresh ? "Learn theory by making sounds." : next ? L(next.title) : "Everything complete — go make a track!"}
            </h1>
            <p className="mt-1 text-muted-foreground">
              {fresh ? "Short, punchy exercises. No streaks, no timers, no guilt. Take breaks whenever." : next ? `${L(currentWorld.title)} · ${L(currentWorld.tagline)}` : ""}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {next && (
                <Button asChild size="lg" variant="lime">
                  <Link href={`/learn/${next.id}`}>
                    {fresh ? t("startLearning") : t("continue")} <ArrowRight />
                  </Link>
                </Button>
              )}
              {fresh && !placementDone && (
                <Button asChild size="lg" variant="secondary">
                  <Link href="/practice?mode=placement">Already know some? {t("placementTest")}</Link>
                </Button>
              )}
            </div>
          </div>
        </div>
      </motion.section>

      <div className="grid gap-4 md:grid-cols-3">
        <QuickCard href="/practice?mode=quick" icon={Dumbbell} title={t("quickPractice")} desc="5 mixed drills from what you've learned. ~3 minutes." color="#c6ff3d" />
        <QuickCard href="/practice?mode=deep" icon={Waves} title={t("deepDive")} desc="Endless adaptive session for long, focused study blocks." color="#a855f7" />
        <QuickCard href="/lab" icon={FlaskConical} title={t("openLab")} desc="Chords, bass, melody, drums — export MIDI to Ableton." color="#ff4fa3" />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>{t("skillMastery")}</CardTitle>
            <CardDescription>Mastery grows with first-try answers, not repetition.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            {WORLDS.map((w) => {
              const m = worldMastery(w, stats, lessons);
              const c = worldCompletion(w, lessons);
              return (
                <Link key={w.id} href="/learn" className="rounded-2xl bg-secondary/60 p-3 transition-colors hover:bg-secondary">
                  <div className="flex items-center justify-between text-sm font-bold">
                    <span className="flex items-center gap-2">
                      <span className="size-3 rounded-full" style={{ background: w.color }} />
                      {L(w.title)}
                    </span>
                    <span className="text-xs text-muted-foreground">{masteryLabel(m).label}</span>
                  </div>
                  <Progress value={c * 100} className="mt-2 h-2" />
                </Link>
              );
            })}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>{t("currentWorld")}</CardTitle>
            <CardDescription>{L(currentWorld.title)}</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <div className="text-5xl font-black" style={{ color: currentWorld.color }}>
              {Math.round(worldCompletion(currentWorld, lessons) * 100)}%
            </div>
            <div className="text-sm text-muted-foreground">
              {currentWorld.lessons.filter((l) => lessons[l.id]).length}/{currentWorld.lessons.length} lessons
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              <Button asChild variant="secondary" size="sm">
                <Link href="/ear-training">
                  <Ear /> {t("nav_ear")}
                </Link>
              </Button>
              <Button asChild variant="secondary" size="sm">
                <Link href="/playground">
                  <Shapes /> {t("nav_playground")}
                </Link>
              </Button>
              <Button asChild variant="secondary" size="sm">
                <Link href="/progress">
                  <Trophy /> {Object.keys(achievements).length} {t("achievements")}
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function QuickCard({ href, icon: Icon, title, desc, color }: { href: string; icon: React.ComponentType<{ className?: string }>; title: string; desc: string; color: string }) {
  return (
    <motion.div whileHover={{ y: -4 }} whileTap={{ scale: 0.98 }}>
      <Link href={href} className="flex h-full flex-col gap-2 rounded-3xl border-2 border-border bg-card p-5 transition-colors hover:border-[color:var(--c)]" style={{ ["--c" as string]: color }}>
        <span className="flex size-11 items-center justify-center rounded-2xl" style={{ background: `${color}22`, color }}>
          <Icon className="size-6" />
        </span>
        <span className="text-lg font-black">{title}</span>
        <span className="text-sm text-muted-foreground">{desc}</span>
      </Link>
    </motion.div>
  );
}
