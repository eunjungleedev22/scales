"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Coffee, Pause, Timer, X } from "lucide-react";
import type { ConcreteExercise } from "@/lib/exercises/types";
import { useProgress } from "@/store/progress";
import { useSettings } from "@/store/settings";
import { useT } from "@/i18n/useT";
import { ExercisePlayer, ExerciseOutcome } from "./ExercisePlayer";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Cat } from "@/components/mascot/Cat";

interface Props {
  title: string;
  /** Produce the next exercise (index = how many done so far). Return null to end. */
  nextExercise: (index: number, history: ExerciseOutcome[]) => ConcreteExercise | null;
  /** Total count for finite sessions */
  total?: number;
  /** Deep dive: show timer and break reminders */
  timed?: boolean;
  onFinish?: (history: ExerciseOutcome[]) => React.ReactNode;
  exitHref?: string;
}

export function PracticeSession({ title, nextExercise, total, timed, onFinish, exitHref = "/practice" }: Props) {
  const { t } = useT();
  const [history, setHistory] = useState<ExerciseOutcome[]>([]);
  const [current, setCurrent] = useState<ConcreteExercise | null>(() => nextExercise(0, []));
  const [finished, setFinished] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [onBreak, setOnBreak] = useState(false);
  const [breakDismissedAt, setBreakDismissedAt] = useState(0);
  const breakEvery = useSettings((s) => s.breakReminderMinutes);
  const addMinutes = useProgress((s) => s.addDeepDiveMinutes);
  const unlock = useProgress((s) => s.unlock);
  const xpStart = useRef(useProgress.getState().xp);
  const xpNow = useProgress((s) => s.xp);

  // Session timer (pauses on break and when tab hidden)
  useEffect(() => {
    if (!timed || onBreak || finished) return;
    const id = setInterval(() => {
      if (document.visibilityState === "visible") setElapsed((e) => e + 1);
    }, 1000);
    return () => clearInterval(id);
  }, [timed, onBreak, finished]);

  useEffect(() => {
    if (!timed || elapsed === 0) return;
    if (elapsed % 60 === 0) addMinutes(1);
    if (elapsed >= 3600) unlock("deep-diver");
  }, [elapsed, timed, addMinutes, unlock]);

  const minutes = Math.floor(elapsed / 60);
  const showBreakNudge = timed && breakEvery > 0 && minutes > 0 && minutes % breakEvery === 0 && breakDismissedAt !== minutes && !onBreak;

  const onDone = useCallback(
    (o: ExerciseOutcome) => {
      const h = [...history, o];
      setHistory(h);
      const n = total !== undefined && h.length >= total ? null : nextExercise(h.length, h);
      if (!n) setFinished(true);
      else setCurrent(n);
    },
    [history, nextExercise, total],
  );

  const solved = history.filter((h) => h.correct).length;

  if (finished) {
    return (
      <div className="mx-auto flex max-w-xl flex-col items-center gap-4 text-center">
        <Cat mood="party" size={130} />
        <h1 className="display text-4xl sm:text-5xl">{title} — done!</h1>
        <p className="text-muted-foreground">
          {solved}/{history.length} solved · +{xpNow - xpStart.current} XP
          {timed && ` · ${minutes} ${t("minutes")}`}
        </p>
        {onFinish?.(history)}
        <div className="flex gap-2">
          <Button asChild variant="lime" size="lg">
            <Link href="/practice">More practice</Link>
          </Button>
          <Button asChild variant="secondary" size="lg">
            <Link href="/">Home</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6 flex items-center gap-3">
        <Link href={exitHref} aria-label="Exit session" className="rounded-full p-2 hover:bg-secondary">
          <X className="size-5" />
        </Link>
        {total ? (
          <Progress value={(history.length / total) * 100} className="h-4" />
        ) : (
          <div className="flex flex-1 items-center gap-3 text-sm font-bold">
            <span className="text-primary">{title}</span>
            <span className="text-muted-foreground">
              {solved}/{history.length} solved · +{xpNow - xpStart.current} XP
            </span>
          </div>
        )}
        {timed && (
          <span className="flex items-center gap-1 readout rounded-md border border-border bg-[#0f0e0c] px-2.5 py-1 text-xs">
            <Timer className="size-3.5" />
            {String(Math.floor(elapsed / 3600)).padStart(1, "0")}:{String(minutes % 60).padStart(2, "0")}:{String(elapsed % 60).padStart(2, "0")}
          </span>
        )}
        {timed && (
          <Button variant="secondary" size="sm" onClick={() => setOnBreak(true)}>
            <Pause /> Break
          </Button>
        )}
        {!total && (
          <Button variant="ghost" size="sm" onClick={() => setFinished(true)}>
            {t("finish")}
          </Button>
        )}
      </div>

      {showBreakNudge && (
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="mb-4 flex flex-wrap items-center gap-3 rounded-2xl border border-primary/40 bg-primary/10 p-3 text-sm">
          <Coffee className="size-5 text-primary" />
          <span className="flex-1">You&apos;ve been in the zone for {minutes} minutes. Water? Stretch? Totally optional.</span>
          <Button size="sm" variant="secondary" onClick={() => setOnBreak(true)}>
            Take 5
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setBreakDismissedAt(minutes)}>
            Keep going
          </Button>
        </motion.div>
      )}

      {onBreak ? (
        <div className="flex flex-col items-center gap-4 py-16 text-center">
          <Cat mood="sleep" size={120} />
          <h2 className="text-2xl font-black">Paused. Your session is safe.</h2>
          <p className="text-muted-foreground">Timer stopped. Come back whenever.</p>
          <Button variant="lime" size="lg" onClick={() => setOnBreak(false)}>
            Resume
          </Button>
        </div>
      ) : (
        current && <ExercisePlayer key={history.length} exercise={current} onDone={onDone} />
      )}
    </div>
  );
}
