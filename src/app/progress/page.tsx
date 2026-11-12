"use client";
import { Star } from "lucide-react";
import { WORLDS } from "@/content/curriculum";
import { ACHIEVEMENTS } from "@/content/achievements";
import { useProgress } from "@/store/progress";
import { useT } from "@/i18n/useT";
import { lessonMastery, worldCompletion, worldMastery } from "@/lib/progress/selectors";
import { levelFromXp, masteryLabel } from "@/lib/progress/xp";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Cat } from "@/components/mascot/Cat";
import { cn } from "@/lib/utils";

export default function ProgressPage() {
  const { t, L } = useT();
  const { xp, lessons, stats, achievements, totalAnswered, deepDiveMinutes } = useProgress();
  const lvl = levelFromXp(xp);
  const firstTry = Object.values(stats).reduce((s, x) => s + x.firstTryCorrect, 0);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center gap-5 rounded-lg bg-card p-6">
        <Cat mood="happy" size={96} />
        <div className="flex-1">
          <p className="text-sm font-bold uppercase tracking-widest text-lime">
            {t("level")} {lvl.level}
          </p>
          <p className="text-4xl font-black">{xp} XP</p>
          <Progress value={(lvl.into / lvl.needed) * 100} className="mt-2 max-w-sm" />
          <p className="mt-1 text-xs text-muted-foreground">
            {lvl.needed - lvl.into} XP to level {lvl.level + 1}
          </p>
        </div>
        <div className="grid grid-cols-3 gap-2 text-center">
          <Mini label="Answered" value={totalAnswered} />
          <Mini label="First-try" value={firstTry} />
          <Mini label="Deep dive min" value={deepDiveMinutes} />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("skillMastery")}</CardTitle>
          <CardDescription>Per lesson. Stars come from first-try accuracy — repeating easy stuff doesn&apos;t inflate them.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-5">
          {WORLDS.map((w) => (
            <div key={w.id}>
              <div className="mb-2 flex items-center justify-between gap-2">
                <p className="font-black" style={{ color: w.color }}>
                  {w.id}. {L(w.title)}
                </p>
                <p className="text-xs font-bold text-muted-foreground">
                  {Math.round(worldCompletion(w, lessons) * 100)}% complete · {masteryLabel(worldMastery(w, stats, lessons)).label}
                </p>
              </div>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {w.lessons.map((l) => {
                  const m = lessonMastery(l, stats, lessons[l.id]);
                  const { paws } = masteryLabel(m);
                  return (
                    <div key={l.id} className="flex min-w-0 items-center justify-between gap-2 rounded-xl bg-secondary/50 px-3 py-2 text-sm">
                      <span className="truncate font-bold">{L(l.title)}</span>
                      <span className="flex shrink-0 gap-0.5">
                        {Array.from({ length: 5 }, (_, k) => (
                          <Star key={k} className={cn("size-3", k < paws ? "fill-lime text-lime" : "text-border")} />
                        ))}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("achievements")}</CardTitle>
          <CardDescription>
            {Object.keys(achievements).length}/{ACHIEVEMENTS.length} unlocked
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {ACHIEVEMENTS.map((a) => {
            const got = achievements[a.id];
            return (
              <div key={a.id} className={cn("flex items-center gap-3 rounded-2xl border p-3", got ? "border-lime/60 bg-lime/5" : "border-border opacity-50 grayscale")}>
                <span className="text-3xl">{a.emoji}</span>
                <div>
                  <p className="font-black">{L(a.title)}</p>
                  <p className="text-xs text-muted-foreground">{L(a.description)}</p>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}

function Mini({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl bg-secondary px-3 py-2">
      <p className="text-xl font-black">{value}</p>
      <p className="text-[10px] font-bold uppercase text-muted-foreground">{label}</p>
    </div>
  );
}
