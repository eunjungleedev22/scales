"use client";
import { useEffect, useMemo, useState } from "react";
import { Download, GraduationCap, Play, RotateCcw, Square, Trash2, Wand2, X } from "lucide-react";
import { useLab, LabProject } from "@/store/lab";
import { projectEvents } from "@/lib/music/project";
import { useProgress } from "@/store/progress";
import { audio } from "@/lib/audio/engine";
import { useAudioState } from "@/hooks/useAudio";
import { eventsToMidiSong, StepNote } from "@/lib/music/events";
import { HARMONY_SCALES, resolveProgression } from "@/lib/music/progression";
import { chordPitchClasses } from "@/lib/theory/chords";
import { COMMON_TONICS, mod12, pcName, pitchClass, placeAbove, prefersFlats } from "@/lib/theory/notes";
import { scalePitchClasses, SCALES, ScaleId } from "@/lib/theory/scales";
import { downloadMidi } from "@/lib/midi/writer";
import { exercisesFromProject } from "@/lib/exercises/fromProject";
import type { ConcreteExercise } from "@/lib/exercises/types";
import { ChordSlots } from "@/components/tools/ChordSlots";
import { StepSequencer, rowsFor } from "@/components/tools/StepSequencer";
import { VOICINGS } from "@/components/tools/ProgressionBuilder";
import { ExercisePlayer } from "@/components/exercises/ExercisePlayer";
import { Button } from "@/components/ui/button";
import { NativeSelect } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useT } from "@/i18n/useT";
import { cn } from "@/lib/utils";

export default function LabPage() {
  const { t } = useT();
  const { project: p, update, setKey, setChord, setBars, reset } = useLab();
  const progress = useProgress();
  const { playing } = useAudioState();
  const [step, setStep] = useState<number | null>(null);
  const [bassLen, setBassLen] = useState(2);
  const [melLen, setMelLen] = useState(2);
  const [page, setPage] = useState(0); // which 4-bar page of the sequencers
  const [quiz, setQuiz] = useState<{ list: ConcreteExercise[]; i: number } | null>(null);

  const chords = useMemo(() => resolveProgression(p.tonic, p.scale, p.chords), [p.tonic, p.scale, p.chords]);
  const scalePcs = scalePitchClasses(p.tonic, p.scale);
  const flats = prefersFlats(p.tonic, SCALES[p.scale].quality);
  const bassRows = rowsFor(placeAbove(pitchClass(p.tonic), 28), 17, scalePcs);
  const melRows = rowsFor(placeAbove(pitchClass(p.tonic), 60), 17, scalePcs);
  const pages = Math.ceil(p.bars / 4);
  const pageStart = page * 64;
  const pageSteps = Math.min(64, p.bars * 16 - pageStart);
  const chordAt = (s: number) => chords[Math.min(chords.length - 1, Math.floor(s / 16))];

  const play = () =>
    void audio.playEvents(projectEvents(useLab.getState().project), p.bpm, {
      loop: true,
      lengthBeats: p.bars * 4,
      onStep: (s) => setStep(s % (p.bars * 16)),
    });

  useEffect(() => {
    if (playing) play();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [p.chords, p.bass, p.melody, p.tonic, p.scale, p.voicing, p.stabs, p.drums, p.metronome, p.mute, p.bars]);
  useEffect(() => audio.setBpm(p.bpm), [p.bpm]);
  useEffect(() => {
    if (!playing) setStep(null);
  }, [playing]);
  useEffect(() => {
    if (page >= pages) setPage(0);
  }, [page, pages]);

  // Space toggles playback in the lab
  useEffect(() => {
    if (quiz) return;
    const h = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "SELECT" || tag === "TEXTAREA" || tag === "BUTTON") return;
      if (e.key === " ") {
        e.preventDefault();
        if (playing) audio.stop();
        else play();
      }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  });

  const pageNotes = (ns: StepNote[]) => ns.filter((n) => n.step >= pageStart && n.step < pageStart + 64).map((n) => ({ ...n, step: n.step - pageStart }));
  const mergePage = (all: StepNote[], edited: StepNote[]) => [...all.filter((n) => n.step < pageStart || n.step >= pageStart + 64), ...edited.map((n) => ({ ...n, step: n.step + pageStart }))].sort((a, b) => a.step - b.step);

  const exportMidi = () => {
    downloadMidi(eventsToMidiSong(projectEvents(p, { includeDrums: p.drums !== "off" }).filter((e) => e.instrument !== "click"), p.bpm, `Harmonic Cat ${p.tonic} ${SCALES[p.scale].name}`), `harmonic-cat-${p.tonic}-${p.scale}-${p.bpm}bpm.mid`);
    progress.unlock("midnight-export");
  };

  const suggestBass = () => {
    // Root on the downbeat, octave on the off-beat, fifth as a pickup — a classic house pattern
    const bass: StepNote[] = [];
    chords.forEach((c, bar) => {
      const root = placeAbove(chordPitchClasses(c.root, c.type)[0], placeAbove(pitchClass(p.tonic), 28));
      const fifth = placeAbove(chordPitchClasses(c.root, c.type)[2] ?? chordPitchClasses(c.root, c.type)[0], root);
      bass.push({ step: bar * 16, midi: root, len: 3 }, { step: bar * 16 + 6, midi: root + 12, len: 1 }, { step: bar * 16 + 10, midi: fifth > root + 12 ? fifth - 12 : fifth, len: 2 }, { step: bar * 16 + 14, midi: root + 12, len: 1 });
    });
    update({ bass });
  };

  if (quiz) {
    const ex = quiz.list[quiz.i];
    return (
      <div className="mx-auto max-w-3xl">
        <div className="mb-4 flex items-center gap-3">
          <button onClick={() => setQuiz(null)} aria-label="Close" className="rounded-full p-2 hover:bg-secondary">
            <X className="size-5" />
          </button>
          <p className="font-bold">
            Exercises from your project · {quiz.i + 1}/{quiz.list.length}
          </p>
        </div>
        {ex ? (
          <ExercisePlayer key={quiz.i} exercise={ex} onDone={() => setQuiz(quiz.i + 1 < quiz.list.length ? { ...quiz, i: quiz.i + 1 } : null)} />
        ) : null}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-black">{t("nav_lab")}</h1>
          <p className="text-muted-foreground">Your project autosaves. Space = play/stop.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="pink" size="lg" onClick={() => (playing ? audio.stop() : play())}>
            {playing ? <Square /> : <Play />} {playing ? t("stop") : t("play")}
          </Button>
          <Button variant="lime" size="lg" onClick={exportMidi}>
            <Download /> Export MIDI
          </Button>
          <Button variant="secondary" size="lg" onClick={() => setQuiz({ list: exercisesFromProject(p.tonic, p.scale, chords), i: 0 })}>
            <GraduationCap /> Generate exercises
          </Button>
        </div>
      </div>

      {/* Global controls */}
      <Card>
        <CardContent className="flex flex-wrap items-center gap-3 pt-5">
          <label className="flex items-center gap-2 text-sm font-bold">
            Tempo
            <input type="range" min={90} max={150} value={p.bpm} onChange={(e) => update({ bpm: Number(e.target.value) })} className="accent-[#a855f7]" aria-label="Tempo" />
            <span className="w-16 tabular-nums">{p.bpm} BPM</span>
          </label>
          <NativeSelect aria-label="Key" value={p.tonic} onChange={(e) => setKey(e.target.value, p.scale)}>
            {COMMON_TONICS.map((n) => (
              <option key={n}>{n}</option>
            ))}
          </NativeSelect>
          <NativeSelect aria-label="Scale" value={p.scale} onChange={(e) => setKey(p.tonic, e.target.value as ScaleId)}>
            {HARMONY_SCALES.map((s) => (
              <option key={s} value={s}>
                {SCALES[s].name}
              </option>
            ))}
          </NativeSelect>
          <NativeSelect aria-label="Drums" value={p.drums} onChange={(e) => update({ drums: e.target.value as LabProject["drums"] })}>
            <option value="house">Drums: house</option>
            <option value="minimal">Drums: minimal</option>
            <option value="off">Drums: off</option>
          </NativeSelect>
          <label className="flex items-center gap-1.5 text-sm font-bold">
            <input type="checkbox" checked={p.metronome} onChange={(e) => update({ metronome: e.target.checked })} /> Metronome
          </label>
          <div className="flex-1" />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              if (confirm("Reset the Lab project to the default example?")) reset();
            }}
          >
            <RotateCcw /> Reset
          </Button>
        </CardContent>
      </Card>

      {/* Chords */}
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <CardTitle>Chord progression</CardTitle>
              <CardDescription>One chord per bar. Roman numerals update with the key.</CardDescription>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <NativeSelect aria-label="Voicing" value={p.voicing} onChange={(e) => update({ voicing: e.target.value as LabProject["voicing"] })}>
                {VOICINGS.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.label}
                  </option>
                ))}
              </NativeSelect>
              <label className="flex items-center gap-1.5 text-sm font-bold">
                <input type="checkbox" checked={p.stabs} onChange={(e) => update({ stabs: e.target.checked })} /> Stabs
              </label>
              <MuteToggle label="chords" p={p} update={update} />
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <ChordSlots tonic={p.tonic} scale={p.scale} chords={p.chords} onChange={(i, c) => {
              setChord(i, c);
              progress.flagLab("progression");
            }} activeIndex={step === null ? null : Math.floor(step / 16)} />
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span className="font-bold text-muted-foreground">Length:</span>
            {([4, 8, 16] as const).map((b) => (
              <Button key={b} size="sm" variant={p.bars === b ? "default" : "secondary"} onClick={() => p.bars !== b && setBars(b, "repeat")}>
                {b} bars
              </Button>
            ))}
            {p.bars < 16 && (
              <Button size="sm" variant="secondary" onClick={() => setBars((p.bars * 2) as 8 | 16, "vary")}>
                <Wand2 /> Expand ×2 with variation (A A′)
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {pages > 1 && (
        <div className="flex items-center gap-2 text-sm font-bold">
          Sequencer page:
          {Array.from({ length: pages }, (_, i) => (
            <Button key={i} size="sm" variant={page === i ? "default" : "secondary"} onClick={() => setPage(i)}>
              Bars {i * 4 + 1}–{Math.min(p.bars, i * 4 + 4)}
            </Button>
          ))}
        </div>
      )}

      {/* Bass */}
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <CardTitle>Bassline</CardTitle>
              <CardDescription>Green rows = chord tones of the current bar.</CardDescription>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <LenPicker value={bassLen} onChange={setBassLen} />
              <Button size="sm" variant="secondary" onClick={suggestBass}>
                <Wand2 /> Suggest from chords
              </Button>
              <Button size="sm" variant="ghost" onClick={() => update({ bass: [] })}>
                <Trash2 />
              </Button>
              <MuteToggle label="bass" p={p} update={update} />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <StepSequencer
            steps={pageSteps}
            rows={bassRows}
            notes={pageNotes(p.bass)}
            onChange={(n) => {
              update({ bass: mergePage(p.bass, n) });
              progress.flagLab("bass");
            }}
            noteLength={bassLen}
            playhead={step !== null && step >= pageStart && step < pageStart + 64 ? step - pageStart : null}
            regionLabels={chords.slice(page * 4, page * 4 + 4).map((c) => c.symbol)}
            isHighlightRow={(m, s) => {
              const c = chordAt(s + pageStart);
              return chordPitchClasses(c.root, c.type).includes(mod12(m));
            }}
            preferFlats={flats}
            label="Bass sequencer"
          />
        </CardContent>
      </Card>

      {/* Melody */}
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <CardTitle>Melody</CardTitle>
              <CardDescription>Try a 2-bar call and a 2-bar response.</CardDescription>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <LenPicker value={melLen} onChange={setMelLen} />
              <Button size="sm" variant="ghost" onClick={() => update({ melody: [] })}>
                <Trash2 />
              </Button>
              <MuteToggle label="melody" p={p} update={update} />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <StepSequencer
            steps={pageSteps}
            rows={melRows}
            notes={pageNotes(p.melody)}
            onChange={(n) => {
              update({ melody: mergePage(p.melody, n) });
              if (n.length >= 3) progress.flagLab("melody");
            }}
            noteLength={melLen}
            playhead={step !== null && step >= pageStart && step < pageStart + 64 ? step - pageStart : null}
            regionLabels={chords.slice(page * 4, page * 4 + 4).map((c) => c.symbol)}
            isHighlightRow={(m, s) => {
              const c = chordAt(s + pageStart);
              return chordPitchClasses(c.root, c.type).includes(mod12(m));
            }}
            preferFlats={flats}
            label="Melody sequencer"
          />
          <p className="mt-2 text-xs text-muted-foreground">
            Scale notes: {scalePcs.map((pc) => pcName(pc, flats ? "flat" : "sharp")).join(" ")}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function LenPicker({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  return (
    <div className="flex items-center gap-1 rounded-xl bg-secondary p-1 text-xs font-bold" role="group" aria-label="Note length">
      {[1, 2, 4, 8].map((l) => (
        <button key={l} onClick={() => onChange(l)} aria-pressed={value === l} className={cn("rounded-lg px-2 py-1", value === l && "bg-primary text-white")}>
          {l === 1 ? "1/16" : l === 2 ? "1/8" : l === 4 ? "1/4" : "1/2"}
        </button>
      ))}
    </div>
  );
}

function MuteToggle({ label, p, update }: { label: "chords" | "bass" | "melody"; p: LabProject; update: (x: Partial<LabProject>) => void }) {
  const muted = p.mute[label];
  return (
    <button onClick={() => update({ mute: { ...p.mute, [label]: !muted } })} aria-pressed={muted} className={cn("rounded-lg px-2 py-1 text-xs font-black", muted ? "bg-destructive/30 text-destructive" : "bg-secondary text-muted-foreground")}>
      {muted ? "MUTED" : "M"}
    </button>
  );
}
