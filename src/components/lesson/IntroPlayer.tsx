"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Pause, Play, RotateCcw, SkipBack, SkipForward } from "lucide-react";
import type { IntroScene } from "@/content/intros";
import { audio } from "@/lib/audio/engine";
import { playCue } from "@/lib/audio/cues";
import { VirtualPiano, KeyMark } from "@/components/piano/VirtualPiano";
import { GlossaryText } from "@/components/glossary/GlossaryText";
import { Cat } from "@/components/mascot/Cat";
import { cn } from "@/lib/utils";

const sceneMs = (s: IntroScene) => s.ms ?? Math.max(3500, s.text.length * 60);

/** A short "video": captioned, animated scenes with piano highlights and sound. */
export function IntroPlayer({ scenes, title, onFinished }: { scenes: IntroScene[]; title: string; onFinished?: () => void }) {
  const [idx, setIdx] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [started, setStarted] = useState(false);
  const [done, setDone] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const finishedRef = useRef(onFinished);
  finishedRef.current = onFinished;
  const scene = scenes[idx];

  // Sound for the current scene
  const sound = useCallback((s: IntroScene) => {
    if (s.cue) void playCue(s.cue);
    else if (s.keys?.length && s.play !== "none") {
      if (s.play === "chord") void audio.playChord(s.keys, { durationBeats: 2 });
      else void audio.playMelody(s.keys, 0.45, 120);
    }
  }, []);

  useEffect(() => {
    if (playing && scene) sound(scene);
    setElapsed(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idx, playing]);

  // Timer / auto-advance
  useEffect(() => {
    if (!playing || !scene) return;
    const total = sceneMs(scene);
    const started = performance.now() - elapsed;
    const id = setInterval(() => {
      const e = performance.now() - started;
      if (e >= total) {
        clearInterval(id);
        if (idx + 1 < scenes.length) setIdx(idx + 1);
        else {
          setPlaying(false);
          setDone(true);
          finishedRef.current?.();
        }
      } else setElapsed(e);
    }, 80);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing, idx]);

  useEffect(() => () => audio.stop(), []);

  const start = () => {
    setStarted(true);
    setDone(false);
    setIdx(0);
    setElapsed(0);
    setPlaying(true);
  };
  const toggle = () => {
    if (!started || done) return start();
    if (playing) audio.stop();
    setPlaying((p) => !p);
  };
  const go = (d: number) => {
    const n = Math.max(0, Math.min(scenes.length - 1, idx + d));
    audio.stop();
    setDone(false);
    setStarted(true);
    setIdx(n);
    setElapsed(0);
    if (!playing) sound(scenes[n]);
  };

  const marks: Record<number, KeyMark> = {};
  scene?.keys?.forEach((k) => (marks[k] = "given"));
  // Pick a 2-octave window (starting on a C) that fits the scene's keys
  const lowest = scene?.keys?.length ? Math.min(...scene.keys) : 60;
  const highest = scene?.keys?.length ? Math.max(...scene.keys) : 60;
  const startMidi = Math.min(lowest - (lowest % 12), Math.max(48, highest - 24 + ((12 - ((highest - 24) % 12)) % 12)));

  return (
    <div className="overflow-hidden rounded-3xl border-2 border-border bg-[#0a0712]" aria-label={`Intro video: ${title}`} role="region">
      {/* progress segments */}
      <div className="flex gap-1 p-3 pb-0">
        {scenes.map((s, i) => (
          <button key={i} aria-label={`Scene ${i + 1}`} onClick={() => go(i - idx)} className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/15">
            <div className="h-full rounded-full bg-lime transition-[width] duration-100" style={{ width: i < idx || done ? "100%" : i === idx ? `${Math.min(100, (elapsed / sceneMs(s)) * 100)}%` : "0%" }} />
          </button>
        ))}
      </div>

      <div className="relative px-4 pb-3 pt-4 sm:px-6">
        <div className="flex min-h-[5.5rem] items-start gap-3">
          <Cat mood={done ? "happy" : playing ? "idle" : "think"} size={52} className="shrink-0" />
          <AnimatePresence mode="wait">
            <motion.p key={idx} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} className="text-base font-bold leading-relaxed sm:text-lg">
              {scene && <GlossaryText text={scene.text} />}
            </motion.p>
          </AnimatePresence>
        </div>
        <div className={cn("mt-3 transition-opacity", scene?.keys?.length ? "opacity-100" : "opacity-40")}>
          <VirtualPiano startMidi={startMidi} octaves={2} marks={marks} badges={scene?.badges} playSound={false} compact disabled label="Intro piano" />
        </div>

        {!started && (
          <button onClick={start} className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/60 backdrop-blur-[2px]" aria-label="Play intro video">
            <span className="flex size-16 items-center justify-center rounded-full bg-pink shadow-[0_0_40px_rgba(255,79,163,0.5)]">
              <Play className="size-8 translate-x-0.5 fill-white text-white" />
            </span>
            <span className="text-sm font-black">Watch the intro · ~{Math.round(scenes.reduce((s, x) => s + sceneMs(x), 0) / 1000)}s</span>
          </button>
        )}
      </div>

      <div className="flex items-center gap-1 border-t border-white/10 px-3 py-2">
        <button onClick={() => go(-1)} disabled={idx === 0} aria-label="Previous scene" className="rounded-lg p-2 hover:bg-white/10 disabled:opacity-30">
          <SkipBack className="size-4" />
        </button>
        <button onClick={toggle} aria-label={playing ? "Pause" : "Play"} className="rounded-lg p-2 hover:bg-white/10">
          {done ? <RotateCcw className="size-4" /> : playing ? <Pause className="size-4" /> : <Play className="size-4" />}
        </button>
        <button onClick={() => go(1)} disabled={idx === scenes.length - 1} aria-label="Next scene" className="rounded-lg p-2 hover:bg-white/10 disabled:opacity-30">
          <SkipForward className="size-4" />
        </button>
        <span className="ml-2 text-xs font-bold text-muted-foreground">
          {idx + 1} / {scenes.length}
        </span>
        <span className="ml-auto truncate text-xs font-bold text-muted-foreground">{title}</span>
      </div>
    </div>
  );
}
