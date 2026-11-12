"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Mic, MicOff, Pause, Play, RotateCcw, SkipBack, SkipForward } from "lucide-react";
import type { IntroScene } from "@/content/intros";
import { audio } from "@/lib/audio/engine";
import { cueToEvents, playCue } from "@/lib/audio/cues";
import { cancelSpeech, estimateSpeechMs, getVoices, primeSpeech, speak, speechSupported, toSpeech } from "@/lib/audio/speech";
import { useSettings } from "@/store/settings";
import { VirtualPiano, KeyMark } from "@/components/piano/VirtualPiano";
import { GlossaryText } from "@/components/glossary/GlossaryText";
import { Cat } from "@/components/mascot/Cat";
import { cn } from "@/lib/utils";

const silentSceneMs = (s: IntroScene) => s.ms ?? Math.max(3500, s.text.length * 60);
const hasSound = (s: IntroScene) => Boolean(s.cue || (s.keys?.length && s.play !== "none"));

/** How long the scene's music lasts (ms). */
function soundMs(s: IntroScene): number {
  if (s.cue) {
    const { events, bpm } = cueToEvents(s.cue);
    const beats = events.reduce((m, e) => Math.max(m, e.start + e.duration), 0);
    return (beats * 60_000) / bpm + 300;
  }
  if (!s.keys?.length || s.play === "none") return 0;
  if (s.play === "chord") return 1500;
  return s.keys.length * 225 + 600;
}

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * A short "video": captioned scenes with piano highlights, sound and a voiceover.
 * With voiceover on, each scene is read aloud first, then its music plays, then it moves on.
 */
export function IntroPlayer({ scenes, title, onFinished }: { scenes: IntroScene[]; title: string; onFinished?: () => void }) {
  const narrationSetting = useSettings((s) => s.narration ?? true);
  const rate = useSettings((s) => s.narrationRate ?? 1);
  const voiceURI = useSettings((s) => s.narrationVoice ?? null);
  const setSettings = useSettings((s) => s.set);
  const canSpeak = speechSupported();
  const narrate = narrationSetting && canSpeak;

  const [idx, setIdx] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [started, setStarted] = useState(false);
  const [done, setDone] = useState(false);
  const [progress, setProgress] = useState(0);
  const [speaking, setSpeaking] = useState(false);
  const runRef = useRef(0);
  const finishedRef = useRef(onFinished);
  finishedRef.current = onFinished;
  const scene = scenes[idx];

  useEffect(() => {
    void getVoices();
  }, []);

  const playSceneSound = useCallback((s: IntroScene) => {
    if (s.cue) void playCue(s.cue);
    else if (s.keys?.length && s.play !== "none") {
      if (s.play === "chord") void audio.playChord(s.keys, { durationBeats: 2 });
      else void audio.playMelody(s.keys, 0.45, 120);
    }
  }, []);

  const stopAll = () => {
    runRef.current++;
    cancelSpeech();
    audio.stop();
    setSpeaking(false);
  };

  const runScene = useCallback(
    async (i: number, withVoice: boolean) => {
      const token = ++runRef.current;
      const s = scenes[i];
      setIdx(i);
      setProgress(0);
      const text = toSpeech(s.text);
      const total = withVoice ? estimateSpeechMs(text, rate) + soundMs(s) + 600 : Math.max(silentSceneMs(s), soundMs(s));
      const t0 = performance.now();
      const ticker = setInterval(() => {
        if (token !== runRef.current) return clearInterval(ticker);
        setProgress(Math.min(0.98, (performance.now() - t0) / total));
      }, 80);
      try {
        if (withVoice) {
          setSpeaking(true);
          await speak(text, { rate, voiceURI });
          setSpeaking(false);
          if (token !== runRef.current) return;
          if (hasSound(s)) {
            playSceneSound(s);
            await wait(soundMs(s));
          }
          await wait(500);
        } else {
          if (hasSound(s)) playSceneSound(s);
          await wait(Math.max(silentSceneMs(s), soundMs(s)));
        }
      } finally {
        clearInterval(ticker);
      }
      if (token !== runRef.current) return;
      setProgress(1);
      if (i + 1 < scenes.length) void runScene(i + 1, withVoice);
      else {
        setPlaying(false);
        setDone(true);
        finishedRef.current?.();
      }
    },
    [scenes, rate, voiceURI, playSceneSound],
  );

  useEffect(() => () => stopAll(), []); // eslint-disable-line react-hooks/exhaustive-deps

  const start = (from = 0) => {
    // Inside the tap: unlock audio and speech (required on iOS)
    audio.unlockFromGesture();
    if (narrate) primeSpeech();
    stopAll();
    setStarted(true);
    setDone(false);
    setPlaying(true);
    void runScene(from, narrate);
  };

  const togglePlay = () => {
    if (!started || done) return start(0);
    if (playing) {
      stopAll();
      setPlaying(false);
    } else start(idx);
  };

  const go = (d: number) => {
    const n = Math.max(0, Math.min(scenes.length - 1, idx + d));
    setDone(false);
    setStarted(true);
    if (playing) return start(n);
    stopAll();
    setIdx(n);
    setProgress(0);
    audio.unlockFromGesture();
    playSceneSound(scenes[n]);
  };

  const toggleVoice = () => {
    if (narrationSetting) cancelSpeech();
    else primeSpeech();
    setSettings({ narration: !narrationSetting });
    if (playing) {
      // restart the current scene with the new setting
      runRef.current++;
      cancelSpeech();
      setTimeout(() => void runScene(idx, !narrationSetting && canSpeak), 50);
    }
  };

  const marks: Record<number, KeyMark> = {};
  scene?.keys?.forEach((k) => (marks[k] = "given"));
  // A 2-octave window (starting on a C) that fits the scene's keys
  const lowest = scene?.keys?.length ? Math.min(...scene.keys) : 60;
  const highest = scene?.keys?.length ? Math.max(...scene.keys) : 60;
  const startMidi = Math.min(lowest - (lowest % 12), Math.max(48, highest - 24 + ((12 - ((highest - 24) % 12)) % 12)));
  const totalSec = Math.round(scenes.reduce((sum, x) => sum + (narrate ? estimateSpeechMs(toSpeech(x.text), rate) + soundMs(x) + 600 : Math.max(silentSceneMs(x), soundMs(x))), 0) / 1000);

  return (
    <section className="panel overflow-hidden" aria-label={`Intro video: ${title}`}>
      {/* Header strip */}
      <div className="flex items-center justify-between gap-3 border-b border-border bg-[#171512] px-4 py-2.5">
        <span className="label flex items-center gap-2">
          <span className={cn("led", playing && "led-orange blink")} /> Intro · {scenes.length} scenes · ~{totalSec}s
        </span>
        <span className="label hidden truncate sm:inline">{title}</span>
      </div>

      {!started ? (
        /* Title card — the play button has its own space and never covers the visual */
        <div className="flex flex-col items-center gap-4 px-5 py-8 text-center sm:flex-row sm:gap-6 sm:px-8 sm:text-left">
          <Cat mood="idle" size={88} className="shrink-0" />
          <div className="flex flex-1 flex-col items-center gap-3 sm:items-start">
            <div>
              <p className="label">Start here</p>
              <h3 className="mt-1 text-2xl font-extrabold uppercase leading-tight" style={{ fontStretch: "115%" }}>
                Watch &amp; listen
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {narrate ? "Narrated, with sound and piano. Just listen along." : canSpeak ? "Captions, sound and piano. Voiceover is off." : "Captions, sound and piano (this browser has no voiceover)."}
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-2">
              <button
                onClick={() => start(0)}
                className="flex items-center gap-2.5 rounded-md bg-primary px-5 py-3 text-sm font-bold uppercase tracking-[0.05em] text-primary-foreground shadow-[0_3px_0_0_var(--primary-shadow)] active:translate-y-[2px] active:shadow-none"
                aria-label="Play intro video"
              >
                <Play className="size-5 fill-current" /> Play intro
              </button>
              {canSpeak && (
                <button onClick={toggleVoice} aria-pressed={narrationSetting} className="flex items-center gap-2 rounded-md border border-border px-3 py-3 font-mono text-[11px] uppercase tracking-wider text-muted-foreground hover:text-foreground">
                  {narrationSetting ? <Mic className="size-4 text-pink" /> : <MicOff className="size-4" />} Voice {narrationSetting ? "on" : "off"}
                </button>
              )}
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Scene progress */}
          <div className="flex gap-1 px-4 pt-3">
            {scenes.map((_, i) => (
              <button key={i} aria-label={`Go to scene ${i + 1}`} onClick={() => go(i - idx)} className="h-1.5 flex-1 overflow-hidden rounded-[1px] bg-white/10">
                <div className="h-full bg-primary transition-[width] duration-100" style={{ width: i < idx || done ? "100%" : i === idx ? `${progress * 100}%` : "0%" }} />
              </button>
            ))}
          </div>

          <div className="px-4 pb-3 pt-4 sm:px-6">
            <div className="flex min-h-[5.5rem] items-start gap-3">
              <Cat mood={done ? "happy" : speaking ? "idle" : "think"} size={48} className="shrink-0" />
              <AnimatePresence mode="wait">
                <motion.p key={idx} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} className="text-base font-semibold leading-relaxed sm:text-lg" aria-live="polite">
                  {speaking && <span className="label mr-2 text-pink">● speaking</span>}
                  {scene && <GlossaryText text={scene.text} />}
                </motion.p>
              </AnimatePresence>
            </div>
            <div className={cn("mt-3 transition-opacity", scene?.keys?.length ? "opacity-100" : "opacity-35")}>
              <VirtualPiano startMidi={startMidi} octaves={2} marks={marks} badges={scene?.badges} playSound={false} compact disabled label="Intro piano" />
            </div>
          </div>
        </>
      )}

      {/* Transport controls — always in their own bar, below the visual */}
      {started && (
        <div className="flex flex-wrap items-center gap-2 border-t border-border bg-[#171512] px-3 py-2.5">
          <button onClick={() => go(-1)} disabled={idx === 0} aria-label="Previous scene" className="rounded-md border border-border p-2 hover:bg-secondary disabled:opacity-30">
            <SkipBack className="size-4" />
          </button>
          <button
            onClick={togglePlay}
            aria-label={done ? "Replay" : playing ? "Pause" : "Play"}
            className="flex min-w-[6.5rem] items-center justify-center gap-2 rounded-md bg-primary px-3 py-2 text-xs font-bold uppercase tracking-[0.05em] text-primary-foreground shadow-[0_2px_0_0_var(--primary-shadow)] active:translate-y-[1px]"
          >
            {done ? <RotateCcw className="size-4" /> : playing ? <Pause className="size-4 fill-current" /> : <Play className="size-4 fill-current" />}
            {done ? "Replay" : playing ? "Pause" : "Play"}
          </button>
          <button onClick={() => go(1)} disabled={idx === scenes.length - 1} aria-label="Next scene" className="rounded-md border border-border p-2 hover:bg-secondary disabled:opacity-30">
            <SkipForward className="size-4" />
          </button>
          <span className="readout ml-1 text-xs text-muted-foreground">
            {String(idx + 1).padStart(2, "0")}/{String(scenes.length).padStart(2, "0")}
          </span>
          {canSpeak && (
            <button onClick={toggleVoice} aria-pressed={narrationSetting} aria-label={narrationSetting ? "Turn voiceover off" : "Turn voiceover on"} className="ml-auto flex items-center gap-1.5 rounded-md border border-border px-2.5 py-2 font-mono text-[11px] uppercase tracking-wider text-muted-foreground hover:text-foreground">
              {narrationSetting ? <Mic className="size-4 text-pink" /> : <MicOff className="size-4" />}
              <span className="hidden sm:inline">Voice {narrationSetting ? "on" : "off"}</span>
            </button>
          )}
        </div>
      )}
    </section>
  );
}
