"use client";
import { useState } from "react";
import { Ear } from "lucide-react";
import type { ConcreteExercise } from "@/lib/exercises/types";
import { instantiate, pick, shuffle } from "@/lib/exercises/instantiate";
import { scaleMidi, SCALES, ScaleId } from "@/lib/theory/scales";
import type { ChordType } from "@/lib/theory/chords";
import { useT } from "@/i18n/useT";
import { PracticeSession } from "@/components/exercises/PracticeSession";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface Mode {
  id: string;
  title: string;
  desc: string;
  make: () => ConcreteExercise;
}

const INTERVAL_SETS: Record<string, string[]> = {
  "Thirds": ["m3", "M3"],
  "4ths & 5ths": ["P4", "P5", "P8"],
  "Steps": ["m2", "M2"],
  "Sevenths": ["m7", "M7"],
  "All": ["m2", "M2", "m3", "M3", "P4", "TT", "P5", "m6", "M6", "m7", "M7", "P8"],
};

const CHORD_SETS: Record<string, ChordType[]> = {
  "Major / minor": ["maj", "min"],
  "Triads": ["maj", "min", "dim", "aug"],
  "Sevenths": ["maj7", "min7", "dom7", "m7b5"],
  "House colours": ["min7", "min9", "maj7", "sus4"],
};

const SCALE_SETS: Record<string, ScaleId[]> = {
  "Major vs minor": ["major", "minor"],
  "Minor flavours": ["minor", "dorian", "phrygian"],
  "Major flavours": ["major", "lydian", "mixolydian"],
  "Pentatonics": ["major-pentatonic", "minor-pentatonic"],
};

function earScale(pool: ScaleId[]): ConcreteExercise {
  const s = pick(pool, Math.random);
  const root = 57 + Math.floor(Math.random() * 6);
  const up = scaleMidi(root, s);
  const options = shuffle(pool, Math.random);
  return {
    id: "drill-ear-scale",
    kind: "choice",
    ear: true,
    prompt: { en: "Which scale or mode is this?", ko: "어떤 스케일/모드인가요?" },
    options: options.map((x) => SCALES[x].name),
    answer: options.indexOf(s),
    audio: { type: "notes", midis: [...up, ...[...up].reverse().slice(1)], mode: "melody", beats: 0.4 },
    hint: { en: options.map((x) => `${SCALES[x].name}: ${SCALES[x].vibe}`).join(" / ") },
    explanation: `${SCALES[s].name}. ${SCALES[s].vibe}`,
  };
}

export default function EarTrainingPage() {
  const { t } = useT();
  const [mode, setMode] = useState<Mode | null>(null);
  const [harmonic, setHarmonic] = useState(false);

  if (mode) return <PracticeSession title={mode.title} nextExercise={() => mode.make()} exitHref="/ear-training" />;

  const intervalModes: Mode[] = Object.entries(INTERVAL_SETS).map(([name, pool]) => ({
    id: `i-${name}`,
    title: `Intervals: ${name}`,
    desc: pool.join(" · "),
    make: () => instantiate({ id: `drill-ear-interval`, kind: "ear-interval", pool, mode: harmonic ? "harmonic" : "melodic", prompt: { en: "Which interval?", ko: "어떤 음정인가요?" } }),
  }));
  const chordModes: Mode[] = Object.entries(CHORD_SETS).map(([name, pool]) => ({
    id: `c-${name}`,
    title: `Chords: ${name}`,
    desc: pool.join(" · "),
    make: () => instantiate({ id: "drill-ear-chord", kind: "ear-chord", pool, prompt: { en: "Which chord quality?", ko: "어떤 코드 성질인가요?" } }),
  }));
  const scaleModes: Mode[] = Object.entries(SCALE_SETS).map(([name, pool]) => ({ id: `s-${name}`, title: `Scales: ${name}`, desc: pool.map((p) => SCALES[p].name).join(" · "), make: () => earScale(pool) }));

  const Section = ({ title, desc, modes, extra }: { title: string; desc: string; modes: Mode[]; extra?: React.ReactNode }) => (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{desc}</CardDescription>
        {extra}
      </CardHeader>
      <CardContent className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {modes.map((m) => (
          <button key={m.id} onClick={() => setMode(m)} className="rounded-2xl border-2 border-border bg-secondary/50 p-4 text-left transition-colors hover:border-pink">
            <span className="block font-black">{m.title.split(": ")[1]}</span>
            <span className="text-xs text-muted-foreground">{m.desc}</span>
          </button>
        ))}
      </CardContent>
    </Card>
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <Ear className="size-8 text-pink" />
        <div>
          <h1 className="text-3xl font-black">{t("nav_ear")}</h1>
          <p className="text-muted-foreground">Unlimited replays. Space to replay, 1–9 to answer, / for a hint.</p>
        </div>
      </div>
      <Section
        title="Intervals"
        desc="Two notes — name the distance."
        modes={intervalModes}
        extra={
          <div className="mt-2 flex gap-2">
            <Button size="sm" variant={harmonic ? "secondary" : "default"} onClick={() => setHarmonic(false)}>
              Melodic (one after another)
            </Button>
            <Button size="sm" variant={harmonic ? "default" : "secondary"} onClick={() => setHarmonic(true)}>
              Harmonic (together)
            </Button>
          </div>
        }
      />
      <Section title="Chord quality" desc="Hear the colour of a chord." modes={chordModes} />
      <Section title="Scales & modes" desc="Hear the flavour of a scale up and down." modes={scaleModes} />
    </div>
  );
}
