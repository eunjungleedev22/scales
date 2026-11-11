"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowRight, Crown, FlaskConical, Map, Play, RotateCcw, SkipForward, X } from "lucide-react";
import type { Lesson } from "@/content/curriculum";
import { getWorld, nextLesson } from "@/content/curriculum";
import { instantiate } from "@/lib/exercises/instantiate";
import { playCue } from "@/lib/audio/cues";
import { audio } from "@/lib/audio/engine";
import { useProgress } from "@/store/progress";
import { useT } from "@/i18n/useT";
import { ExercisePlayer, ExerciseOutcome } from "./ExercisePlayer";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Kbd } from "@/components/ui/kbd";
import { Cat } from "@/components/mascot/Cat";
import { cn } from "@/lib/utils";

type Phase = "intro" | "exercises" | "done";

export function LessonRunner({ lesson }: { lesson: Lesson }) {
  const { t, L } = useT();
  const router = useRouter();
  const world = getWorld(lesson.worldId)!;
  const [phase, setPhase] = useState<Phase>("intro");
  const [index, setIndex] = useState(0);
  const [outcomes, setOutcomes] = useState<ExerciseOutcome[]>([]);
  const [runId, setRunId] = useState(0);
  const exercises = useMemo(() => lesson.exercises.map((e) => instantiate(e)), [lesson, runId]); // eslint-disable-line react-hooks/exhaustive-deps
  const xpAtStart = useRef(0);
  const progress = useProgress();
  const [bonus, setBonus] = useState(0);

  useEffect(() => {
    progress.setLastLesson(lesson.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lesson.id]);

  const start = () => {
    audio.stop();
    xpAtStart.current = useProgress.getState().xp;
    setOutcomes([]);
    setIndex(0);
    setPhase("exercises");
  };

  const onDone = (o: ExerciseOutcome) => {
    const all = [...outcomes, o];
    setOutcomes(all);
    if (index + 1 < exercises.length) setIndex(index + 1);
    else {
      const solved = all.filter((x) => x.correct).length;
      const firstTry = all.filter((x) => x.firstTry).length / all.length;
      // A lesson counts as complete if most exercises were solved (skips are allowed, never punished)
      if (solved >= Math.ceil(all.length * 0.6)) setBonus(progress.completeLesson(lesson.id, firstTry));
      else setBonus(0);
      setPhase("done");
    }
  };

  // Keyboard: Enter starts, Escape exits
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === "Escape") router.push("/learn");
      if (phase === "intro" && e.key === "Enter") {
        e.preventDefault();
        start();
      }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  });

  const header = (
    <div className="mb-6 flex items-center gap-3">
      <Link href="/learn" aria-label={t("backToMap")} className="rounded-full p-2 hover:bg-secondary">
        <X className="size-5" />
      </Link>
      <Progress value={phase === "done" ? 100 : phase === "intro" ? 0 : (index / exercises.length) * 100} className="h-4" indicatorClassName={lesson.boss ? "bg-pink" : "bg-lime"} />
      <span className="text-xs font-bold text-muted-foreground">
        {phase === "exercises" ? `${index + 1}/${exercises.length}` : ""}
      </span>
    </div>
  );

  if (phase === "intro") {
    return (
      <div className="mx-auto max-w-2xl">
        {header}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-5">
          <div className="flex items-center gap-4">
            <Cat mood={lesson.boss ? "party" : "idle"} size={88} />
            <div>
              <p className="text-xs font-bold uppercase tracking-widest" style={{ color: world.color }}>
                World {world.id} · {L(world.title)}
              </p>
              <h1 className="flex items-center gap-2 text-3xl font-black">
                {lesson.boss && <Crown className="size-7 text-pink" />}
                {L(lesson.title)}
              </h1>
            </div>
          </div>
          <div className="rounded-3xl border-2 border-border bg-card p-5">
            <p className="mb-2 text-xs font-bold uppercase tracking-wide text-muted-foreground">{t("concept")}</p>
            <ul className="space-y-2">
              {lesson.concept.map((c, i) => (
                <li key={i} className="flex gap-2 text-base font-semibold">
                  <span style={{ color: world.color }}>▸</span> {L(c)}
                </li>
              ))}
            </ul>
            {lesson.demo && (
              <Button variant="pink" className="mt-4" onClick={() => playCue(lesson.demo!.cue)}>
                <Play /> {t("demo")}: {L(lesson.demo.label)}
              </Button>
            )}
          </div>
          {lesson.production && (
            <p className="rounded-2xl bg-secondary px-4 py-3 text-sm">
              <span className="font-black text-pink">🎛️ {t("inTheStudio")}: </span>
              {L(lesson.production)}
            </p>
          )}
          <div className="flex flex-wrap gap-2">
            <Button size="lg" variant="lime" onClick={start} autoFocus>
              {lesson.exercises.length} exercises <ArrowRight /> <Kbd className="bg-lime-foreground/10 text-lime-foreground">Enter</Kbd>
            </Button>
            {!progress.lessons[lesson.id] && (
              <Button
                variant="ghost"
                onClick={() => {
                  progress.testOut([lesson.id]);
                  const n = nextLesson(lesson.id);
                  router.push(n ? `/learn/${n.id}` : "/learn");
                }}
              >
                <SkipForward /> I know this — skip
              </Button>
            )}
          </div>
        </motion.div>
      </div>
    );
  }

  if (phase === "exercises") {
    return (
      <div className="mx-auto max-w-3xl">
        {header}
        <ExercisePlayer key={`${runId}-${index}`} exercise={exercises[index]} onDone={onDone} boss={lesson.boss} nextLabel={index + 1 === exercises.length ? t("finish") : t("next")} />
      </div>
    );
  }

  const solved = outcomes.filter((o) => o.correct).length;
  const firstTry = outcomes.filter((o) => o.firstTry).length;
  const passed = solved >= Math.ceil(outcomes.length * 0.6);
  const earned = useProgress.getState().xp - xpAtStart.current;
  const nxt = nextLesson(lesson.id);
  return (
    <div className="mx-auto max-w-xl">
      {header}
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="flex flex-col items-center gap-4 text-center">
        <Cat mood={passed ? "party" : "think"} size={140} />
        <h1 className="text-3xl font-black">{passed ? (lesson.boss ? t("bossDefeated") : t("lessonComplete")) : "Good effort — come back anytime!"}</h1>
        <div className="grid w-full grid-cols-3 gap-2">
          <Stat label="Solved" value={`${solved}/${outcomes.length}`} />
          <Stat label={t("correctFirstTry")} value={`${firstTry}`} />
          <Stat label={t("xpEarned")} value={`+${earned}`} accent />
        </div>
        {bonus > 0 && <p className="text-sm font-bold text-lime">Includes +{bonus} completion bonus</p>}
        {!passed && <p className="text-sm text-muted-foreground">Solve at least 60% to mark the lesson complete. No penalty for trying again.</p>}
        {lesson.labTask && (
          <div className="w-full rounded-2xl border-2 border-primary/50 bg-primary/10 p-4 text-left text-sm">
            <p className="font-black text-primary">Try it in the Lab</p>
            <p className="mt-1">{L(lesson.labTask)}</p>
            <Button asChild size="sm" className="mt-3">
              <Link href="/lab">
                <FlaskConical /> {t("openLab")}
              </Link>
            </Button>
          </div>
        )}
        <div className="flex flex-wrap justify-center gap-2">
          {nxt && (
            <Button size="lg" variant="lime" onClick={() => router.push(`/learn/${nxt.id}`)} autoFocus>
              {t("nextLesson")} <ArrowRight />
            </Button>
          )}
          <Button
            size="lg"
            variant="secondary"
            onClick={() => {
              setRunId((r) => r + 1);
              start();
            }}
          >
            <RotateCcw /> {t("retry")}
          </Button>
          <Button size="lg" variant="ghost" asChild>
            <Link href="/learn">
              <Map /> {t("backToMap")}
            </Link>
          </Button>
        </div>
      </motion.div>
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="rounded-2xl border-2 border-border bg-card p-3">
      <p className={cn("text-2xl font-black", accent && "text-lime")}>{value}</p>
      <p className="text-xs font-bold uppercase text-muted-foreground">{label}</p>
    </div>
  );
}
