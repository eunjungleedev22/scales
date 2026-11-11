"use client";
import { Suspense, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Dumbbell, FastForward, RefreshCcw, Waves } from "lucide-react";
import { ALL_EXERCISES, WORLDS } from "@/content/curriculum";
import type { ConcreteExercise, ExerciseDef } from "@/lib/exercises/types";
import { DrillKind, generateDrill, instantiate, pick } from "@/lib/exercises/instantiate";
import { weakExerciseIds } from "@/lib/progress/selectors";
import { useProgress } from "@/store/progress";
import { useT } from "@/i18n/useT";
import { PracticeSession } from "@/components/exercises/PracticeSession";
import type { ExerciseOutcome } from "@/components/exercises/ExercisePlayer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const DRILLS: Array<{ kind: DrillKind; label: string; world: number }> = [
  { kind: "note", label: "Find notes", world: 1 },
  { kind: "interval", label: "Build intervals", world: 1 },
  { kind: "ear-interval", label: "Hear intervals", world: 1 },
  { kind: "scale", label: "Build scales", world: 2 },
  { kind: "degree", label: "Scale degrees", world: 2 },
  { kind: "chord", label: "Build chords", world: 3 },
  { kind: "ear-chord", label: "Hear chords", world: 3 },
];

/** Placement: 3 representative exercises per world (1–4). */
const PLACEMENT: Array<{ world: number; ids: string[] }> = [
  { world: 1, ids: ["w1-accidentals-4", "w1-intervals-3", "w1-ear-intervals-2"] },
  { world: 2, ids: ["w2-major-3", "w2-modes-1", "w2-degrees-3"] },
  { world: 3, ids: ["w3-sevenths-1", "w3-dim-aug-1", "w3-inversions-1"] },
  { world: 4, ids: ["w4-diatonic-1", "w4-functions-1", "w4-roman-1"] },
];

function byId(id: string): ExerciseDef {
  const d = ALL_EXERCISES.find((e) => e.id === id);
  if (!d) throw new Error(`Unknown exercise ${id}`);
  return d;
}

function PracticeInner() {
  const params = useSearchParams();
  const mode = params.get("mode");
  const drill = params.get("drill") as DrillKind | null;
  const { t } = useT();
  const progress = useProgress();

  const unlockedDrills = DRILLS.filter((d) => d.world === 1 || WORLDS[d.world - 2].lessons.some((l) => progress.lessons[l.id]) || WORLDS[d.world - 1].lessons.some((l) => progress.lessons[l.id]));

  if (mode === "quick") {
    const kinds = unlockedDrills.map((d) => d.kind);
    return <PracticeSession title={t("quickPractice")} total={5} nextExercise={() => generateDrill(pick(kinds, Math.random))} />;
  }

  if (drill && DRILLS.some((d) => d.kind === drill)) {
    return <PracticeSession title={DRILLS.find((d) => d.kind === drill)!.label} nextExercise={() => generateDrill(drill)} />;
  }

  if (mode === "deep") return <DeepDive />;
  if (mode === "review") return <Review />;
  if (mode === "placement") return <Placement />;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-black">{t("nav_practice")}</h1>
        <p className="text-muted-foreground">Pick anything. Stop anytime. Nothing expires.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <ModeCard href="/practice?mode=quick" icon={Dumbbell} title={t("quickPractice")} desc="5 mixed drills, about 3 minutes." color="#c6ff3d" />
        <ModeCard href="/practice?mode=deep" icon={Waves} title={t("deepDive")} desc="Endless adaptive session for 2–4 hour hyperfocus blocks. Timer, optional break nudges, pause anytime." color="#a855f7" />
        <ModeCard href="/practice?mode=review" icon={RefreshCcw} title={t("review")} desc="Optional: revisit exercises you found tricky." color="#36c5ff" />
        <ModeCard href="/practice?mode=placement" icon={FastForward} title={t("placementTest")} desc="12 questions. Skip whole worlds you already know." color="#ff4fa3" />
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Endless drills</CardTitle>
          <CardDescription>Randomised, unlimited. Unlock more by touching later worlds.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {DRILLS.map((d) => {
            const open = unlockedDrills.includes(d);
            return (
              <Button key={d.kind} asChild={open} variant={open ? "secondary" : "outline"} disabled={!open} className={cn(!open && "opacity-50")}>
                {open ? <Link href={`/practice?drill=${d.kind}`}>{d.label}</Link> : <span>{d.label} · World {d.world}</span>}
              </Button>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}

function ModeCard({ href, icon: Icon, title, desc, color }: { href: string; icon: React.ComponentType<{ className?: string }>; title: string; desc: string; color: string }) {
  return (
    <Link href={href} className="flex gap-4 rounded-3xl border-2 border-border bg-card p-5 transition-transform hover:-translate-y-1">
      <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl" style={{ background: `${color}22`, color }}>
        <Icon className="size-6" />
      </span>
      <span>
        <span className="block text-lg font-black">{title}</span>
        <span className="text-sm text-muted-foreground">{desc}</span>
      </span>
    </Link>
  );
}

/** Adaptive: mixes weak lesson exercises, lessons in progress and drills from unlocked worlds. */
function DeepDive() {
  const { t } = useT();
  const gen = useMemo(() => {
    return (i: number, history: ExerciseOutcome[]): ConcreteExercise => {
      const p = useProgress.getState();
      const weak = weakExerciseIds(p.stats, 20);
      const doneLessons = Object.keys(p.lessons);
      const pool = ALL_EXERCISES.filter((e) => doneLessons.some((l) => e.id.startsWith(`${l}-`)));
      const recentMiss = history.slice(-3).some((h) => !h.correct);
      const r = Math.random();
      if (weak.length && (r < 0.3 || recentMiss)) return instantiate(byId(pick(weak, Math.random)));
      if (pool.length && r < 0.65) return instantiate(pick(pool, Math.random));
      const maxWorld = Math.max(1, ...doneLessons.map((l) => Number(l[1]) || 1));
      const kinds = DRILLS.filter((d) => d.world <= maxWorld + 1).map((d) => d.kind);
      return generateDrill(pick(kinds, Math.random));
    };
  }, []);
  return <PracticeSession title={t("deepDive")} timed nextExercise={gen} />;
}

function Review() {
  const { t } = useT();
  const [ids] = useState(() => weakExerciseIds(useProgress.getState().stats, 8));
  if (!ids.length) {
    return (
      <div className="py-16 text-center">
        <p className="font-bold">{t("noReviewYet")}</p>
        <Button asChild variant="lime" className="mt-4">
          <Link href="/learn">{t("nav_learn")}</Link>
        </Button>
      </div>
    );
  }
  return <PracticeSession title={t("review")} total={ids.length} nextExercise={(i) => (ids[i] ? instantiate(byId(ids[i])) : null)} />;
}

function Placement() {
  const { t } = useT();
  const testOut = useProgress((s) => s.testOut);
  const setDone = useProgress((s) => s.setPlacementDone);
  const flat = useMemo(() => PLACEMENT.flatMap((p) => p.ids.map((id) => ({ world: p.world, ex: instantiate(byId(id)) }))), []);
  const applied = useRef(false);
  return (
    <PracticeSession
      title={t("placementTest")}
      total={flat.length}
      nextExercise={(i) => flat[i]?.ex ?? null}
      onFinish={(history) => {
        const passed: number[] = [];
        for (const p of PLACEMENT) {
          const idxs = flat.map((f, i) => (f.world === p.world ? i : -1)).filter((i) => i >= 0);
          const ok = idxs.filter((i) => history[i]?.firstTry).length;
          if (ok >= 2) passed.push(p.world);
        }
        // Only skip consecutive worlds from the start, so foundations aren't missed
        const skip: number[] = [];
        for (const w of [1, 2, 3, 4]) {
          if (passed.includes(w)) skip.push(w);
          else break;
        }
        if (!applied.current) applied.current = true, setTimeout(() => {
          testOut(WORLDS.filter((w) => skip.includes(w.id)).flatMap((w) => w.lessons.filter((l) => !l.boss).map((l) => l.id)));
          setDone();
        }, 0);
        return (
          <div className="rounded-2xl border-2 border-border bg-card p-4 text-left text-sm">
            {skip.length ? (
              <p>
                You tested out of <b>World {skip.join(", ")}</b>. Those lessons are marked as skipped — revisit anytime. Boss challenges stay open if you want the XP.
              </p>
            ) : (
              <p>Starting from World 1 is the best fit. You can still jump to any lesson from the map.</p>
            )}
          </div>
        );
      }}
    />
  );
}

export default function PracticePage() {
  return (
    <Suspense fallback={<p className="text-muted-foreground">Loading…</p>}>
      <PracticeInner />
    </Suspense>
  );
}
