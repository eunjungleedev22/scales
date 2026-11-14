"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowRight, Crown, FlaskConical, Map, Play, RotateCcw, SkipForward, Tv, X, MonitorPlay, NotebookPen, Volume2, Star, BookOpen } from "lucide-react";
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
import { IntroPlayer } from "@/components/lesson/IntroPlayer";
import { LessonNotebook, NotebookContext } from "@/components/notes/LessonNotebook";
import type { IntroScene } from "@/content/intros";
import { GlossaryText, KeyTerms } from "@/components/glossary/GlossaryText";
import { introFor, youtubeSearchUrl } from "@/content/intros";
import { BOOK, READINGS } from "@/content/references";
import { termsIn } from "@/content/glossary";
import { loc } from "@/lib/exercises/types";
import { primeSpeech, speechSupported } from "@/lib/audio/speech";
import { narrate, stopNarration } from "@/lib/audio/narration";
import { useSettings } from "@/store/settings";
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
  const [showIntro, setShowIntro] = useState(false);
  const [sceneCtx, setSceneCtx] = useState<NotebookContext | null>(null);
  const onSceneChange = (sc: IntroScene | null) => setSceneCtx(sc ? { head: sc.head, text: sc.text } : null);
  const allNotes = useProgress((s) => s.notes);
  const starred = useMemo(() => (allNotes ?? []).filter((n) => n.lessonId === lesson.id && n.kind === "highlight").map((n) => n.text), [allNotes, lesson.id]);
  const en = (x: Parameters<typeof loc>[0]) => loc(x, "en");
  const scenes = useMemo(() => introFor(lesson, en), [lesson]); // eslint-disable-line react-hooks/exhaustive-deps
  const keyTerms = useMemo(
    () => termsIn([...lesson.concept.map(en), ...scenes.map((sc) => sc.text), en(lesson.production)]).slice(0, 8),
    [lesson, scenes], // eslint-disable-line react-hooks/exhaustive-deps
  );
  const ytQuery = `${en(lesson.title).replace(/^Boss: .*/, en(world.title))} music theory${lesson.worldId >= 5 ? " electronic music production" : ""}`;

  useEffect(() => {
    progress.setLastLesson(lesson.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lesson.id]);

  const start = () => {
    audio.stop();
    stopNarration();
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
      if (e.key === "Escape") {
        if (showIntro) return setShowIntro(false);
        router.push("/learn");
      }
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
      {phase === "exercises" && (
        <Button variant="secondary" size="sm" onClick={() => setShowIntro(true)}>
          <Tv /> Intro
        </Button>
      )}
    </div>
  );

  const introModal = showIntro && (
    <div role="dialog" aria-modal="true" aria-label="Lesson intro" className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={() => setShowIntro(false)}>
      <div className="w-full max-w-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-2 flex justify-end">
          <button onClick={() => setShowIntro(false)} aria-label="Close intro" className="rounded-full bg-secondary p-2">
            <X className="size-5" />
          </button>
        </div>
        <IntroPlayer scenes={scenes} title={en(lesson.title)} onSceneChange={onSceneChange} />
        <div className="mt-3">
          <LessonNotebook lessonId={lesson.id} lessonTitle={en(lesson.title)} world={en(world.title)} current={sceneCtx} />
        </div>
        <ul className="mt-3 space-y-1 rounded-2xl bg-card p-4 text-sm">
          {lesson.concept.map((c, i) => (
            <li key={i}>
              ▸ <GlossaryText text={c} />
            </li>
          ))}
        </ul>
      </div>
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
                {en(lesson.title)}
              </h1>
            </div>
          </div>
          <IntroPlayer scenes={scenes} title={en(lesson.title)} onSceneChange={onSceneChange} />
          <LessonNotebook lessonId={lesson.id} lessonTitle={en(lesson.title)} world={en(world.title)} current={sceneCtx} />
          <div className="rounded-3xl border border-border bg-card p-5">
            <p className="mb-2 text-xs font-bold uppercase tracking-wide text-muted-foreground">{t("concept")}</p>
            <ul className="space-y-2">
              {lesson.concept.map((c, i) => (
                <li key={i} className="flex gap-2 text-base font-semibold">
                  <span style={{ color: world.color }}>▸</span>
                  <span className="flex-1">
                    <GlossaryText text={c} />
                  </span>
                  <button
                    onClick={() => {
                      const txt = en(c);
                      const existing = useProgress.getState().notes?.find((n) => n.lessonId === lesson.id && n.kind === "highlight" && n.text === txt);
                      if (existing) progress.deleteNote(existing.id);
                      else progress.addNote({ lessonId: lesson.id, kind: "highlight", text: txt, context: "Concept" });
                    }}
                    aria-pressed={starred.includes(en(c))}
                    aria-label={starred.includes(en(c)) ? "Remove from notes" : "Save to notes"}
                    className={"self-start p-1 " + (starred.includes(en(c)) ? "text-lime" : "text-muted-foreground hover:text-lime")}
                  >
                    <Star className={"size-4 " + (starred.includes(en(c)) ? "fill-current" : "")} />
                  </button>
                </li>
              ))}
            </ul>
            <div className="mt-4 flex flex-wrap gap-2">
            {speechSupported() && (
              <Button
                variant="secondary"
                onClick={async () => {
                  audio.unlockFromGesture();
                  primeSpeech();
                  const st = useSettings.getState();
                  for (const c of lesson.concept) {
                    const r = await narrate(en(c), { style: st.voiceStyle ?? "natural", rate: st.narrationRate ?? 1, voiceURI: st.narrationVoice });
                    if (r === "cancelled") break;
                  }
                }}
              >
                <Volume2 /> Listen
              </Button>
            )}
            {lesson.demo && (
              <Button variant="pink" onClick={() => playCue(lesson.demo!.cue)}>
                <Play /> {t("demo")}: {en(lesson.demo.label)}
              </Button>
            )}
            </div>
          </div>
          {keyTerms.length > 0 && (
            <div>
              <p className="mb-2 text-xs font-bold uppercase tracking-wide text-muted-foreground">
                Key terms · <span lang="ko">핵심 용어</span>
              </p>
              <KeyTerms entries={keyTerms} />
            </div>
          )}
          {lesson.production && (
            <p className="rounded-2xl bg-secondary px-4 py-3 text-sm">
              <span className="font-black text-pink">🎛️ {t("inTheStudio")}: </span>
              <GlossaryText text={lesson.production} />
            </p>
          )}
          {READINGS[lesson.id] && (
            <a href={READINGS[lesson.id].url} target="_blank" rel="noopener noreferrer" className="flex items-start gap-2 text-sm font-bold text-muted-foreground hover:text-foreground">
              <BookOpen className="mt-0.5 size-4 shrink-0 text-lime" />
              <span>
                Go deeper: <i>{BOOK.title}</i>, {READINGS[lesson.id].chapter} ↗
                <span className="block text-xs font-normal">
                  Free textbook by {BOOK.author} ({BOOK.license}). This lesson's intro draws on its approach.
                </span>
              </span>
            </a>
          )}
          <a href={youtubeSearchUrl(ytQuery)} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-foreground">
            <MonitorPlay className="size-4 text-[#ff4d3d]" /> More video lessons on YouTube: “{ytQuery}” ↗
          </a>
          <div className="flex flex-wrap gap-2">
            <Button size="lg" variant="lime" onClick={start}>
              {lesson.exercises.length} exercises <ArrowRight /> <Kbd className="border-black/20 bg-black/15 text-current">Enter</Kbd>
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
        {introModal}
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
        <h1 className="display text-4xl sm:text-5xl">{passed ? (lesson.boss ? t("bossDefeated") : t("lessonComplete")) : "Good effort — come back anytime!"}</h1>
        <div className="grid w-full grid-cols-3 gap-2">
          <Stat label="Solved" value={`${solved}/${outcomes.length}`} />
          <Stat label={t("correctFirstTry")} value={`${firstTry}`} />
          <Stat label={t("xpEarned")} value={`+${earned}`} accent />
        </div>
        {bonus > 0 && <p className="text-sm font-bold text-lime">Includes +{bonus} completion bonus</p>}
        {!passed && <p className="text-sm text-muted-foreground">Solve at least 60% to mark the lesson complete. No penalty for trying again.</p>}
        {lesson.labTask && (
          <div className="w-full rounded-2xl border border-primary/50 bg-primary/10 p-4 text-left text-sm">
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
          <Button size="lg" variant="secondary" asChild>
            <Link href={`/reflect?lesson=${lesson.id}&auto=1`}>
              <NotebookPen /> Reflect
            </Link>
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
    <div className="rounded-2xl border border-border bg-card p-3">
      <p className={cn("text-2xl font-black", accent && "text-lime")}>{value}</p>
      <p className="text-xs font-bold uppercase text-muted-foreground">{label}</p>
    </div>
  );
}
