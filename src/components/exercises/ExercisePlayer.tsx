"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Eye, Lightbulb, Play, RotateCcw, SkipForward, Square, Trash2, Volume2 } from "lucide-react";
import type { Answer, ConcreteExercise, Evaluation } from "@/lib/exercises/types";
import { evaluate } from "@/lib/exercises/evaluate";
import { autoHint } from "@/lib/exercises/instantiate";
import { audio } from "@/lib/audio/engine";
import { playCue } from "@/lib/audio/cues";
import { chordMidi, chordPitchClasses, chordSymbol } from "@/lib/theory/chords";
import { diatonicChords } from "@/lib/theory/harmony";
import { intervalByShort } from "@/lib/theory/intervals";
import { mod12, noteToMidi, pcName, pitchClass, placeAbove, prefersFlats } from "@/lib/theory/notes";
import { scaleMidi, scalePitchClasses, SCALES } from "@/lib/theory/scales";
import { chordEvents, drumLoop, stepsToEvents, voiceProgression, StepNote, NoteEvent } from "@/lib/music/events";
import { useProgress } from "@/store/progress";
import { useSettings } from "@/store/settings";
import { useT } from "@/i18n/useT";
import { useAudioState } from "@/hooks/useAudio";
import { VirtualPiano, KeyMark } from "@/components/piano/VirtualPiano";
import { StepSequencer, rowsFor } from "@/components/tools/StepSequencer";
import { Button } from "@/components/ui/button";
import { Kbd } from "@/components/ui/kbd";
import { Cat } from "@/components/mascot/Cat";
import { cn } from "@/lib/utils";
import { GlossaryText } from "@/components/glossary/GlossaryText";
import { loc } from "@/lib/exercises/types";

export interface ExerciseOutcome {
  correct: boolean;
  firstTry: boolean;
  skipped: boolean;
}

interface Props {
  exercise: ConcreteExercise;
  onDone: (o: ExerciseOutcome) => void;
  boss?: boolean;
  /** Label for the continue button */
  nextLabel?: string;
  /** Hide the "skip" button */
  noSkip?: boolean;
}

/** Renders any exercise type, evaluates via the theory engine, records progress. */
export function ExercisePlayer({ exercise, onDone, boss, nextLabel, noSkip }: Props) {
  const { t, L } = useT();
  const record = useProgress((s) => s.recordAttempt);
  const [attempts, setAttempts] = useState(0);
  const [usedHint, setUsedHint] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [evaluation, setEvaluation] = useState<Evaluation | null>(null);
  const [revealed, setRevealed] = useState(false);
  const firstResult = useRef<boolean | null>(null);
  const solved = evaluation?.correct === true;
  const hint = autoHint(exercise);

  // reset when exercise changes
  useEffect(() => {
    setAttempts(0);
    setUsedHint(false);
    setShowHint(false);
    setEvaluation(null);
    setRevealed(false);
    firstResult.current = null;
    return () => audio.stop();
  }, [exercise]);

  const submit = useCallback(
    (answer: Answer): Evaluation => {
      const ev = evaluate(exercise, answer);
      const firstTry = attempts === 0;
      if (firstResult.current === null) firstResult.current = ev.correct;
      record(exercise.id, { correct: ev.correct, firstTry, usedHint, boss, ear: exercise.kind === "choice" && exercise.ear });
      setAttempts((a) => a + 1);
      setEvaluation(ev);
      return ev;
    },
    [exercise, attempts, usedHint, boss, record],
  );

  const next = useCallback(() => {
    audio.stop();
    onDone({ correct: solved, firstTry: firstResult.current === true && attempts === 1, skipped: !solved });
  }, [onDone, solved, attempts]);

  const retry = () => setEvaluation(null);

  const takeHint = () => {
    setShowHint(true);
    setUsedHint(true);
  };

  // Global shortcuts: Enter = next (when solved), "/" = hint
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      if (e.key === "/" && hint) {
        e.preventDefault();
        takeHint();
      }
      if (e.key === "Enter" && solved) {
        e.preventDefault();
        next();
      }
      if (e.key === "Enter" && evaluation && !evaluation.correct && !(exercise.kind === "build-scale" || exercise.kind === "build-chord")) {
        e.preventDefault();
        retry();
      }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [solved, next, hint, evaluation, exercise.kind]);

  const mood = evaluation ? (evaluation.correct ? "happy" : "oops") : showHint ? "think" : "idle";

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-start gap-3">
        <Cat mood={mood} size={64} className="shrink-0" />
        <div className="panel relative flex-1 border-l-2 border-l-primary px-4 py-3">
          <h2 className="text-lg font-black leading-snug sm:text-xl">
            <GlossaryText text={exercise.prompt} />
          </h2>
          {boss && <span className="label text-primary">Boss challenge · 2× XP</span>}
        </div>
      </div>

      <ExerciseBody exercise={exercise} onSubmit={submit} evaluation={evaluation} revealed={revealed} onRetry={retry} />

      {/* Hint */}
      <AnimatePresence>
        {showHint && hint && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0 }} className="rounded-2xl border border-primary/40 bg-primary/10 px-4 py-3 text-sm">
            <span className="font-black text-primary">💡 {t("hint")}: </span>
            <GlossaryText text={hint} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Feedback */}
      <AnimatePresence mode="wait">
        {evaluation && (
          <motion.div
            key={`${attempts}`}
            role="status"
            initial={{ opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            className={cn(
              "rounded-3xl border p-4",
              evaluation.status === "correct" && "border-lime bg-lime/10",
              evaluation.status === "creative" && "border-primary bg-primary/10",
              evaluation.status === "incorrect" && "border-destructive/70 bg-destructive/10",
            )}
          >
            <p className={cn("text-lg font-black", evaluation.status === "correct" ? "text-lime" : evaluation.status === "creative" ? "text-primary" : "text-destructive")}>
              {evaluation.status === "correct" ? "🎉 " : evaluation.status === "creative" ? "🎨 " : "🙀 "}
              {loc(evaluation.message, "en")}
            </p>
            {evaluation.details.length > 0 && (
              <div className="mt-2">
                <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">{t("why")}</p>
                <ul className="mt-1 space-y-1 text-sm">
                  {evaluation.details.map((d, i) => (
                    <li key={i} className="flex gap-2">
                      <span className="text-muted-foreground">•</span>
                      <span>
                        <GlossaryText text={d} />
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {evaluation.correct && exercise.production && (
              <p className="mt-3 rounded-2xl bg-background/50 px-3 py-2 text-sm">
                <span className="font-black text-pink">🎛️ {t("inTheStudio")}: </span>
                <GlossaryText text={exercise.production} />
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer actions */}
      <div className="flex flex-wrap items-center gap-2">
        {hint && !showHint && !solved && (
          <Button variant="secondary" size="sm" onClick={takeHint}>
            <Lightbulb /> {t("hint")} <Kbd>/</Kbd>
          </Button>
        )}
        {evaluation && !evaluation.correct && attempts >= 2 && !revealed && ["build-scale", "build-chord", "identify-note", "build-interval"].includes(exercise.kind) && (
          <Button variant="secondary" size="sm" onClick={() => setRevealed(true)}>
            <Eye /> Show answer
          </Button>
        )}
        <div className="flex-1" />
        {!solved && !noSkip && (
          <Button variant="ghost" size="sm" onClick={next}>
            <SkipForward /> {t("skip")}
          </Button>
        )}
        {solved && (
          <Button variant="lime" size="lg" onClick={next} autoFocus>
            {nextLabel ?? t("next")} <ArrowRight /> <Kbd className="border-black/20 bg-black/15 text-current">Enter</Kbd>
          </Button>
        )}
      </div>
    </div>
  );
}

/* ====================================================================== */

interface BodyProps {
  exercise: ConcreteExercise;
  onSubmit: (a: Answer) => Evaluation;
  evaluation: Evaluation | null;
  revealed: boolean;
  onRetry: () => void;
}

function ExerciseBody(props: BodyProps) {
  switch (props.exercise.kind) {
    case "identify-note":
    case "build-interval":
    case "build-scale":
    case "build-chord":
      return <KeysBody {...props} />;
    case "choice":
      return <ChoiceBody {...props} />;
    case "complete-progression":
      return <ProgressionBody {...props} />;
    case "fix-melody":
      return <MelodyBody {...props} />;
    case "bassline":
    case "call-response":
      return <SequencerBody {...props} />;
  }
}

function ShortcutRow({ items }: { items: Array<[string, string]> }) {
  return (
    <div className="hidden flex-wrap gap-3 text-xs text-muted-foreground md:flex">
      {items.map(([k, v]) => (
        <span key={k} className="flex items-center gap-1">
          <Kbd>{k}</Kbd> {v}
        </span>
      ))}
    </div>
  );
}

/* ---------- Piano-based exercises ---------- */

function KeysBody({ exercise, onSubmit, evaluation, revealed }: BodyProps) {
  const { t } = useT();
  const [selected, setSelected] = useState<number[]>([]);
  const single = exercise.kind === "identify-note" || exercise.kind === "build-interval";
  const fromMidi = exercise.kind === "build-interval" ? noteToMidi(exercise.from) : null;
  const solved = evaluation?.correct === true;

  useEffect(() => setSelected([]), [exercise]);

  const target = useMemo((): number[] => {
    switch (exercise.kind) {
      case "identify-note":
        return [pitchClass(exercise.note)];
      case "build-interval":
        return [mod12(noteToMidi(exercise.from) + (intervalByShort(exercise.interval)?.semitones ?? 0))];
      case "build-scale":
        return scalePitchClasses(exercise.tonic, exercise.scale);
      case "build-chord":
        return chordPitchClasses(exercise.root, exercise.chord);
      default:
        return [];
    }
  }, [exercise]);

  const celebrate = useCallback(
    (sel: number[]) => {
      if (exercise.kind === "build-scale") {
        const tonicMidi = placeAbove(pitchClass(exercise.tonic), 57);
        void audio.playMelody(scaleMidi(tonicMidi, exercise.scale), 0.5, 150);
      } else if (exercise.kind === "build-chord") {
        void audio.playChord([...sel].sort((a, b) => a - b), { arpeggiate: true });
      } else if (exercise.kind === "build-interval" && fromMidi !== null) {
        void audio.playMelody([fromMidi, sel[sel.length - 1]], 0.6, 110);
      }
    },
    [exercise, fromMidi],
  );

  const check = useCallback(
    (sel: number[]) => {
      if (!sel.length) return;
      const answer: Answer = { kind: "keys", midis: fromMidi !== null ? [fromMidi, ...sel] : sel };
      const ev = onSubmit(answer);
      if (ev.correct) celebrate(sel);
    },
    [onSubmit, fromMidi, celebrate],
  );

  const press = (m: number) => {
    if (solved) return;
    if (single) {
      if (fromMidi !== null && m === fromMidi) return;
      setSelected([m]);
      check([m]);
      return;
    }
    setSelected((s) => (s.includes(m) ? s.filter((x) => x !== m) : [...s, m]));
  };

  // Shortcuts for multi-select: Enter check, Backspace clear, Space play selection
  useEffect(() => {
    if (single) return;
    const h = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      if (solved) return;
      if (e.key === "Enter") {
        e.preventDefault();
        check(selected);
      } else if (e.key === "Backspace") {
        e.preventDefault();
        setSelected([]);
      } else if (e.key === " ") {
        e.preventDefault();
        if (selected.length) void audio.playNotes(selected, 1.2);
      }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [single, selected, check, solved]);

  const marks: Record<number, KeyMark> = {};
  const pcMarks: Record<number, KeyMark> = {};
  if (fromMidi !== null) marks[fromMidi] = "given";
  for (const m of selected) {
    if (!evaluation) marks[m] = "selected";
    else marks[m] = target.includes(mod12(m)) ? (evaluation.correct ? "right" : "selected") : "wrong";
  }
  if (revealed || solved) for (const pc of target) if (!selected.some((m) => mod12(m) === pc)) pcMarks[pc] = solved ? "scale" : "missing";

  return (
    <div className="flex flex-col gap-3">
      <VirtualPiano startMidi={48} octaves={2} marks={marks} pcMarks={pcMarks} onPress={press} keyboardInput />
      {!single && (
        <div className="flex flex-wrap items-center gap-2">
          <Button onClick={() => check(selected)} disabled={!selected.length || solved}>
            {t("check")} <Kbd className="border-black/20 bg-black/15 text-current">Enter</Kbd>
          </Button>
          <Button variant="secondary" onClick={() => setSelected([])} disabled={!selected.length || solved}>
            <Trash2 /> {t("clear")}
          </Button>
          <Button variant="secondary" onClick={() => selected.length && audio.playNotes(selected, 1.2)} disabled={!selected.length}>
            <Volume2 /> {t("play")}
          </Button>
          <span className="text-sm text-muted-foreground">
            {t("selected")}: {selected.length ? [...selected].sort((a, b) => a - b).map((m) => pcName(m, exercise.kind === "build-scale" && prefersFlats(exercise.tonic) ? "flat" : exercise.kind === "build-chord" && exercise.root.includes("b") ? "flat" : "sharp")).join(" ") : "—"}
          </span>
        </div>
      )}
      {!single && <ShortcutRow items={[["Enter", t("check")], ["Backspace", t("clear")], ["Space", t("play")], ["/", t("hint")]]} />}
    </div>
  );
}

/* ---------- Multiple choice (incl. ear training) ---------- */

function ChoiceBody({ exercise, onSubmit, evaluation, onRetry }: BodyProps) {
  const { t, L } = useT();
  const ex = exercise as Extract<ConcreteExercise, { kind: "choice" }>;
  const [picked, setPicked] = useState<number | null>(null);
  const { playing } = useAudioState();
  const solved = evaluation?.correct === true;

  useEffect(() => {
    setPicked(null);
    if (ex.audio && ex.ear) {
      const id = setTimeout(() => audio.ready && playCue(ex.audio!), 250);
      return () => clearTimeout(id);
    }
  }, [ex]);

  const choose = useCallback(
    (i: number) => {
      if (solved) return;
      if (evaluation && !evaluation.correct) onRetry();
      setPicked(i);
      onSubmit({ kind: "choice", index: i });
    },
    [solved, evaluation, onRetry, onSubmit],
  );

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      const n = Number(e.key);
      if (n >= 1 && n <= ex.options.length) {
        e.preventDefault();
        choose(n - 1);
      } else if (e.key === " " && ex.audio) {
        e.preventDefault();
        void playCue(ex.audio);
      }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [ex, choose]);

  return (
    <div className="flex flex-col gap-4">
      {ex.audio && (
        <div className="flex items-center gap-3">
          <Button variant="pink" size="lg" onClick={() => (playing ? audio.stop() : playCue(ex.audio!))} aria-label={t("replay")}>
            {playing ? <Square /> : <Play />} {ex.ear ? t("replay") : t("listen")} <Kbd className="border-black/20 bg-black/15 text-current">Space</Kbd>
          </Button>
          {ex.ear && <span className="text-sm text-muted-foreground">Replay as often as you like.</span>}
        </div>
      )}
      {ex.show && !ex.ear && <VirtualPiano startMidi={48} octaves={2} marks={Object.fromEntries(ex.show.map((m) => [m, "given" as KeyMark]))} />}
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {ex.options.map((o, i) => {
          const isPicked = picked === i;
          const state = evaluation && isPicked ? (evaluation.correct ? "right" : "wrong") : solved && i === ex.answer ? "right" : null;
          return (
            <motion.button
              key={i}
              whileTap={{ scale: 0.97 }}
              onClick={() => choose(i)}
              disabled={solved}
              className={cn(
                "flex items-center gap-3 rounded-2xl border border-border bg-card px-4 py-3 text-left font-bold transition-colors hover:border-primary disabled:cursor-default",
                state === "right" && "border-lime bg-lime/15",
                state === "wrong" && "border-destructive bg-destructive/15",
              )}
            >
              <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-secondary text-xs">{i + 1}</span>
              {loc(o, "en")}
            </motion.button>
          );
        })}
      </div>
      <ShortcutRow items={[["1–" + ex.options.length, "choose"], ...(ex.audio ? ([["Space", t("replay")]] as Array<[string, string]>) : [])]} />
    </div>
  );
}

/* ---------- Complete the progression ---------- */

function ProgressionBody({ exercise, onSubmit, evaluation, onRetry }: BodyProps) {
  const { t } = useT();
  const ex = exercise as Extract<ConcreteExercise, { kind: "complete-progression" }>;
  const chords = useMemo(() => diatonicChords(ex.tonic, ex.scale, ex.sevenths), [ex]);
  const [picked, setPicked] = useState<number | null>(null);
  const [playhead, setPlayhead] = useState<number | null>(null);
  const solved = evaluation?.correct === true;
  useEffect(() => setPicked(null), [ex]);

  const play = (fill: number | null) => {
    const seq = ex.degrees.map((d, i) => (i === ex.missing ? (fill === null ? null : chords[fill - 1]) : chords[d - 1]));
    const present = seq.map((c) => (c ? { root: c.root, type: c.type } : { root: ex.tonic, type: "maj" as const }));
    const voicings = voiceProgression(present, "smooth", 55);
    const events: NoteEvent[] = [];
    seq.forEach((c, i) => {
      if (!c) return;
      events.push(...chordEvents([voicings[i]], 4, "keys", i * 4));
      events.push({ midi: placeAbove(pitchClass(c.root), 36), start: i * 4, duration: 3.8, instrument: "bass" });
    });
    void audio.playEvents(events, 110, { onStep: (s) => setPlayhead(Math.floor(s / 16)), onEnd: () => setPlayhead(null), lengthBeats: seq.length * 4 });
  };

  const choose = (i: number) => {
    if (solved) return;
    if (evaluation && !evaluation.correct) onRetry();
    setPicked(i);
    const ev = onSubmit({ kind: "choice", index: i });
    if (ev.correct) play(ex.options[i]);
  };

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      const n = Number(e.key);
      if (n >= 1 && n <= ex.options.length) choose(n - 1);
      if (e.key === " ") {
        e.preventDefault();
        play(picked !== null ? ex.options[picked] : null);
      }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  });

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-muted-foreground">
        Key: <b className="text-foreground">{ex.tonic} {SCALES[ex.scale].name}</b>
      </p>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {ex.degrees.map((d, i) => {
          const missing = i === ex.missing;
          const c = missing ? (picked !== null ? chords[ex.options[picked] - 1] : null) : chords[d - 1];
          return (
            <div
              key={i}
              className={cn(
                "flex h-24 flex-col items-center justify-center rounded-2xl border bg-card transition-all",
                missing ? "border-dashed border-pink" : "border-border",
                playhead === i && "scale-105 border-lime",
              )}
            >
              {c ? (
                <>
                  <span className="text-2xl font-black">{c.roman}</span>
                  <span className="text-sm text-muted-foreground">{c.symbol}</span>
                </>
              ) : (
                <span className="text-3xl font-black text-pink">?</span>
              )}
            </div>
          );
        })}
      </div>
      <div className="flex flex-wrap gap-2">
        <Button variant="pink" onClick={() => play(picked !== null ? ex.options[picked] : null)}>
          <Play /> {t("play")} <Kbd className="border-black/20 bg-black/15 text-current">Space</Kbd>
        </Button>
      </div>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        {ex.options.map((d, i) => {
          const c = chords[d - 1];
          const isPicked = picked === i;
          const st = evaluation && isPicked ? evaluation.status : null;
          return (
            <button
              key={i}
              onClick={() => choose(i)}
              disabled={solved}
              className={cn(
                "flex items-center gap-3 rounded-2xl border border-border bg-card px-4 py-3 text-left font-bold hover:border-primary",
                st === "correct" && "border-lime bg-lime/15",
                st === "creative" && "border-primary bg-primary/15",
                st === "incorrect" && "border-destructive bg-destructive/15",
              )}
            >
              <span className="flex size-7 items-center justify-center rounded-lg bg-secondary text-xs">{i + 1}</span>
              <span className="text-lg font-black">{c.roman}</span>
              <span className="text-sm text-muted-foreground">{c.symbol}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ---------- Fix the melody ---------- */

function MelodyBody({ exercise, onSubmit, evaluation }: BodyProps) {
  const { t } = useT();
  const ex = exercise as Extract<ConcreteExercise, { kind: "fix-melody" }>;
  const [notes, setNotes] = useState<number[]>(ex.melody);
  const solved = evaluation?.correct === true;
  useEffect(() => setNotes(ex.melody), [ex]);
  const scalePcs = scalePitchClasses(ex.tonic, ex.scale);
  const chordPcs = chordPitchClasses(ex.chord.root, ex.chord.type);
  const flats = prefersFlats(ex.tonic, SCALES[ex.scale].quality);

  const step = (i: number, dir: 1 | -1) => {
    setNotes((ns) => {
      const out = [...ns];
      let m = out[i] + dir;
      while (!scalePcs.includes(mod12(m))) m += dir;
      out[i] = Math.max(48, Math.min(96, m));
      void audio.playNotes([out[i]], 0.4, "lead");
      return out;
    });
  };
  const chromatic = (i: number, dir: 1 | -1) => {
    setNotes((ns) => {
      const out = [...ns];
      out[i] += dir;
      void audio.playNotes([out[i]], 0.4, "lead");
      return out;
    });
  };

  const play = (ns: number[]) => {
    const pad = chordMidi(ex.chord.root, ex.chord.type, 0, 48).map((m) => ({ midi: m, start: 0, duration: 4, instrument: "pad" as const, velocity: 0.5 }));
    const mel: NoteEvent[] = ns.map((m, i) => ({ midi: m, start: i * 0.5, duration: i === ns.length - 1 ? 1 : 0.45, instrument: "lead" }));
    void audio.playEvents([...pad, ...mel], 100);
  };

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-muted-foreground">
        Chord: <b className="text-foreground">{chordSymbol(ex.chord.root, ex.chord.type)}</b> · chord tones are <span className="font-bold text-lime">green</span>, other notes are tension.
      </p>
      <div className="grid grid-cols-8 gap-1 sm:gap-2">
        {notes.map((m, i) => {
          const editable = ex.editable.includes(i) && !solved;
          const isCT = chordPcs.includes(mod12(m));
          const changed = m !== ex.melody[i];
          return (
            <div key={i} className="flex flex-col items-center gap-1">
              {editable ? (
                <button aria-label={`Raise note ${i + 1}`} onClick={() => step(i, 1)} className="w-full rounded-lg bg-secondary py-1 text-xs font-bold hover:bg-primary/40">
                  ▲
                </button>
              ) : (
                <div className="h-6" />
              )}
              <div
                className={cn(
                  "flex h-20 w-full flex-col items-center justify-center rounded-xl border text-sm font-black",
                  isCT ? "border-lime/70 bg-lime/10 text-lime" : "border-border bg-card",
                  editable && "ring-2 ring-pink/60",
                  changed && "border-pink",
                )}
                style={{ transform: `translateY(${(72 - m) * 1.2}px)` }}
              >
                {pcName(m, flats ? "flat" : "sharp")}
                <span className="text-[10px] font-bold text-muted-foreground">{Math.floor(m / 12) - 1}</span>
              </div>
              {editable ? (
                <button aria-label={`Lower note ${i + 1}`} onClick={() => step(i, -1)} className="w-full rounded-lg bg-secondary py-1 text-xs font-bold hover:bg-primary/40">
                  ▼
                </button>
              ) : (
                <div className="h-6" />
              )}
              {editable && (
                <div className="flex gap-0.5">
                  <button aria-label={`Raise note ${i + 1} by a semitone`} onClick={() => chromatic(i, 1)} className="rounded bg-secondary px-1 text-[10px]">♯</button>
                  <button aria-label={`Lower note ${i + 1} by a semitone`} onClick={() => chromatic(i, -1)} className="rounded bg-secondary px-1 text-[10px]">♭</button>
                </div>
              )}
            </div>
          );
        })}
      </div>
      <div className="mt-6 flex flex-wrap gap-2">
        <Button variant="secondary" onClick={() => play(ex.melody)}>
          <Play /> {t("original")}
        </Button>
        <Button variant="pink" onClick={() => play(notes)}>
          <Play /> {t("revised")}
        </Button>
        <Button variant="secondary" onClick={() => setNotes(ex.melody)} disabled={solved}>
          <RotateCcw /> Reset
        </Button>
        <Button onClick={() => onSubmit({ kind: "melody", notes })} disabled={solved}>
          {t("check")}
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">▲▼ move within the scale · ♯♭ move chromatically. Tension notes aren&apos;t &quot;wrong&quot; — the goal here is a resolved ending.</p>
    </div>
  );
}

/* ---------- Bassline builder & call-and-response ---------- */

function SequencerBody({ exercise, onSubmit, evaluation }: BodyProps) {
  const { t } = useT();
  const ex = exercise as Extract<ConcreteExercise, { kind: "bassline" | "call-response" }>;
  const isCall = ex.kind === "call-response";
  const steps = isCall ? 32 : 16;
  const [notes, setNotes] = useState<StepNote[]>([]);
  const [len, setLen] = useState(isCall ? 2 : 1);
  const [chromaticRows, setChromaticRows] = useState(false);
  const [playhead, setPlayhead] = useState<number | null>(null);
  const { playing } = useAudioState();
  const solved = evaluation?.correct === true;
  useEffect(() => {
    setNotes([]);
    setPlayhead(null);
  }, [ex]);

  const scalePcs = scalePitchClasses(ex.tonic, ex.scale);
  const rows = rowsFor(ex.low, isCall ? 17 : 15, chromaticRows ? null : scalePcs);
  const chords = ex.kind === "bassline" ? ex.chords : [ex.chord];
  const per = steps / chords.length;
  const flats = prefersFlats(ex.tonic, SCALES[ex.scale].quality);

  const play = (which: "all" | "call" | "response") => {
    if (playing) {
      audio.stop();
      setPlayhead(null);
      return;
    }
    const events: NoteEvent[] = [];
    let bars = 1;
    if (ex.kind === "bassline") {
      events.push(...stepsToEvents(notes, "bass"));
      const voicings = voiceProgression(ex.chords, "smooth", 57);
      events.push(...chordEvents(voicings, 4 / ex.chords.length, "keys", 0, true));
      events.push(...drumLoop(1, "house"));
    } else {
      const call = which === "response" ? [] : ex.call;
      const resp = which === "call" ? [] : notes.map((n) => ({ ...n, step: n.step + 32 }));
      events.push(...stepsToEvents([...call, ...resp], "lead"));
      bars = 4;
      for (let b = 0; b < bars; b++) events.push(...chordMidi(ex.chord.root, ex.chord.type, 0, 48).map((m) => ({ midi: m, start: b * 4, duration: 3.9, instrument: "pad" as const, velocity: 0.45 })));
      events.push({ midi: placeAbove(pitchClass(ex.chord.root), 33), start: 0, duration: 15.9, instrument: "bass", velocity: 0.6 });
      events.push(...drumLoop(bars, "minimal"));
    }
    void audio.playEvents(events, ex.bpm ?? 122, { loop: ex.kind === "bassline", lengthBeats: bars * 4, onStep: (s) => setPlayhead(isCall ? s - 32 : s % 16), onEnd: () => setPlayhead(null) });
  };

  // live-update the loop when editing the bassline while playing
  useEffect(() => {
    if (playing && ex.kind === "bassline") {
      audio.stop();
      play("all");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [notes]);

  return (
    <div className="flex flex-col gap-3">
      {isCall && (
        <div>
          <p className="mb-1 text-xs font-bold uppercase tracking-wide text-muted-foreground">Call (bars 1–2)</p>
          <StepSequencer steps={32} rows={rows} notes={[]} ghost={ex.call} onChange={() => {}} lockedBefore={32} preferFlats={flats} label="Call phrase (read only)" />
        </div>
      )}
      {isCall && <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Your response (bars 3–4)</p>}
      <StepSequencer
        steps={steps}
        rows={rows}
        notes={notes}
        onChange={solved ? () => {} : setNotes}
        noteLength={len}
        playhead={playhead}
        preferFlats={flats}
        regionLabels={chords.map((c) => chordSymbol(c.root, c.type))}
        isHighlightRow={(m, s) => {
          const c = chords[Math.min(chords.length - 1, Math.floor(s / per))];
          return chordPitchClasses(c.root, c.type).includes(mod12(m));
        }}
      />
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="pink" onClick={() => play("all")}>
          {playing ? <Square /> : <Play />} {playing ? t("stop") : isCall ? "Call + response" : "Play with drums"}
        </Button>
        {isCall && !playing && (
          <Button variant="secondary" onClick={() => play("call")}>
            <Play /> Call only
          </Button>
        )}
        <div className="flex items-center gap-1 rounded-xl bg-secondary p-1 text-xs font-bold">
          {[1, 2, 4].map((l) => (
            <button key={l} onClick={() => setLen(l)} className={cn("rounded-lg px-2 py-1", len === l && "bg-primary text-primary-foreground")} aria-pressed={len === l}>
              {l === 1 ? "1/16" : l === 2 ? "1/8" : "1/4"}
            </button>
          ))}
        </div>
        <label className="flex items-center gap-1 text-xs font-bold text-muted-foreground">
          <input type="checkbox" checked={chromaticRows} onChange={(e) => setChromaticRows(e.target.checked)} /> all 12 notes
        </label>
        <Button variant="secondary" size="sm" onClick={() => setNotes([])} disabled={solved}>
          <Trash2 /> {t("clear")}
        </Button>
        <div className="flex-1" />
        <Button onClick={() => onSubmit({ kind: "steps", notes })} disabled={solved || notes.length === 0}>
          {t("check")}
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">Highlighted rows are chord tones of the chord above. Click a note again to delete it.</p>
    </div>
  );
}

