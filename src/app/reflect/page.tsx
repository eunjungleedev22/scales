"use client";
import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { BookOpen, Check, ChevronDown, Download, RotateCcw, Save, Sparkles, Trash2 } from "lucide-react";
import { ALL_EXERCISES, getLesson } from "@/content/curriculum";
import { generateReflection, reflectionToMarkdown, ReflectionScope, ReflectionSession } from "@/lib/reflection/generate";
import { instantiate } from "@/lib/exercises/instantiate";
import { useProgress } from "@/store/progress";
import { GlossaryText, KeyTerms } from "@/components/glossary/GlossaryText";
import { ExercisePlayer } from "@/components/exercises/ExercisePlayer";
import { Button } from "@/components/ui/button";
import { Cat } from "@/components/mascot/Cat";
import { cn } from "@/lib/utils";

const DAY = 86_400_000;

function download(text: string, name: string) {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([text], { type: "text/markdown" }));
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

function ReflectInner() {
  const params = useSearchParams();
  const lessonParam = params.get("lesson");
  const { log = [], lastReflectionAt, reflections = [], saveReflection, deleteReflection } = useProgress();
  const scopes = useMemo(() => {
    const now = Date.now();
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const list: Array<{ key: string; label: string; scope: ReflectionScope }> = [];
    const lesson = lessonParam ? getLesson(lessonParam) : undefined;
    if (lesson) list.push({ key: "lesson", label: "This lesson", scope: { kind: "lesson", lessonId: lesson.id } });
    if (lastReflectionAt) list.push({ key: "last", label: "Since my last reflection", scope: { kind: "since", since: lastReflectionAt, label: "Since your last reflection" } });
    list.push({ key: "today", label: "Today", scope: { kind: "since", since: startOfDay.getTime(), label: "Today" } });
    list.push({ key: "week", label: "Last 7 days", scope: { kind: "since", since: now - 7 * DAY, label: "Last 7 days" } });
    list.push({ key: "all", label: "Everything", scope: { kind: "since", since: 0, label: "All time" } });
    return list;
  }, [lessonParam, lastReflectionAt]);

  const [scopeKey, setScopeKey] = useState(scopes[0].key);
  const [session, setSession] = useState<ReflectionSession | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState(false);
  const [recheck, setRecheck] = useState<number | null>(null);
  const [openPast, setOpenPast] = useState<string | null>(null);

  const generate = (key = scopeKey) => {
    const s = scopes.find((x) => x.key === key) ?? scopes[0];
    setSession(generateReflection(log, s.scope));
    setAnswers({});
    setSaved(false);
    setRecheck(null);
  };

  // Auto-generate when opened from a lesson's "Reflect" button
  useEffect(() => {
    if (params.get("auto") === "1") generate(scopes[0].key);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const recheckExercises = useMemo(
    () => (session?.recheckIds ?? []).map((id) => ALL_EXERCISES.find((e) => e.id === id)).filter(Boolean).map((d) => instantiate(d!)),
    [session],
  );

  const save = () => {
    if (!session) return;
    const createdAt = Date.now();
    saveReflection({ id: `r-${createdAt}`, createdAt, title: `${session.title} · ${session.scopeLabel}`, notes: reflectionToMarkdown(session, answers), answers });
    setSaved(true);
  };

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-2">
        <p className="label">Reflect</p>
        <h1 className="display text-4xl sm:text-5xl">Look back, lock it in.</h1>
        <p className="max-w-xl text-muted-foreground">Optional and on demand. Generate a short reflective session from what you actually practised: summary notes, what went well, what to revisit, and a few questions to answer in your own words.</p>
      </header>

      <section className="panel flex flex-col gap-4 p-4 sm:p-5">
        <p className="label">Scope</p>
        <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Reflection scope">
          {scopes.map((s) => (
            <button key={s.key} role="radio" aria-checked={scopeKey === s.key} onClick={() => setScopeKey(s.key)} className={cn("chip", scopeKey === s.key && "chip-on")}>
              {s.label}
            </button>
          ))}
        </div>
        <div>
          <Button variant="lime" size="lg" onClick={() => generate()}>
            <Sparkles /> Generate reflection
          </Button>
        </div>
      </section>

      {session && session.empty && (
        <div className="panel flex flex-col items-center gap-3 p-8 text-center">
          <Cat mood="sleep" size={90} />
          <p className="font-bold">Nothing to reflect on in this window yet.</p>
          <p className="text-sm text-muted-foreground">Try a wider scope, or do a lesson first.</p>
        </div>
      )}

      {session && !session.empty && (
        <article className="flex flex-col gap-6" aria-label="Reflective session">
          {/* Recap */}
          <section className="grid grid-cols-2 gap-px overflow-hidden rounded-md border border-border bg-border sm:grid-cols-4">
            {[
              ["Answers", session.totals.answered],
              ["First try", session.totals.firstTry],
              ["Lessons", session.totals.lessons],
              ["Minutes", `~${session.totals.minutes}`],
            ].map(([k, v]) => (
              <div key={k} className="bg-card p-4">
                <p className="readout text-3xl">{v}</p>
                <p className="label mt-1">{k}</p>
              </div>
            ))}
          </section>

          {/* Summary notes */}
          {session.covered.length > 0 && (
            <section className="flex flex-col gap-3">
              <h2 className="section-title">
                <span>01</span> Summary notes
              </h2>
              {session.covered.map((s) => (
                <div key={s.lessonId} className="panel p-4">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <h3 className="text-lg font-extrabold">{s.title}</h3>
                    <span className="label">
                      {s.world} · {Math.round(s.firstTryRate * 100)}% first try
                    </span>
                  </div>
                  <ul className="mt-2 space-y-1.5">
                    {s.notes.map((n, i) => (
                      <li key={i} className="flex gap-2 text-sm leading-relaxed">
                        <span className="text-primary">—</span>
                        <span>
                          <GlossaryText text={n} />
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
              {session.practice.length > 0 && (
                <p className="text-sm text-muted-foreground">
                  Also practised: {session.practice.map((p) => `${p.label} (${p.answered}, ${Math.round(p.firstTryRate * 100)}% first try)`).join(" · ")}
                </p>
              )}
            </section>
          )}

          {session.keyTerms.length > 0 && (
            <section className="flex flex-col gap-3">
              <h2 className="section-title">
                <span>02</span> Key terms · <span lang="ko">핵심 용어</span>
              </h2>
              <KeyTerms entries={session.keyTerms} />
            </section>
          )}

          {(session.wins.length > 0 || session.tricky.length > 0) && (
            <section className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="panel p-4">
                <h2 className="section-title">
                  <span>03</span> Going well
                </h2>
                <ul className="mt-2 space-y-1 text-sm">{session.wins.length ? session.wins.map((w) => <li key={w.lessonId}>✓ {w.title}</li>) : <li className="text-muted-foreground">Keep going — wins show up after a few first-try answers.</li>}</ul>
              </div>
              <div className="panel p-4">
                <h2 className="section-title">
                  <span>04</span> Worth another look
                </h2>
                <ul className="mt-2 space-y-1 text-sm">
                  {session.tricky.length ? (
                    session.tricky.map((w) => (
                      <li key={w.lessonId}>
                        <Link className="underline decoration-primary underline-offset-4" href={`/learn/${w.lessonId}`}>
                          {w.title}
                        </Link>{" "}
                        <span className="text-muted-foreground">({Math.round(w.firstTryRate * 100)}% first try)</span>
                      </li>
                    ))
                  ) : (
                    <li className="text-muted-foreground">Nothing tricky this time. Nice.</li>
                  )}
                </ul>
              </div>
            </section>
          )}

          {/* Questions */}
          <section className="flex flex-col gap-3">
            <h2 className="section-title">
              <span>05</span> In your own words
            </h2>
            <p className="text-sm text-muted-foreground">Writing it down is the reflection. A sentence or two is plenty — skip any you like.</p>
            {session.questions.map((q) => (
              <label key={q.id} className="panel flex flex-col gap-2 p-4">
                <span className="font-bold">
                  <GlossaryText text={q.text} />
                </span>
                <textarea
                  value={answers[q.id] ?? ""}
                  onChange={(e) => {
                    setAnswers((a) => ({ ...a, [q.id]: e.target.value }));
                    setSaved(false);
                  }}
                  rows={3}
                  className="w-full rounded-md border border-border bg-background p-3 text-sm focus-visible:border-primary focus-visible:outline-none"
                  placeholder="Type your thoughts…"
                />
              </label>
            ))}
          </section>

          {/* Re-check */}
          {recheckExercises.length > 0 && (
            <section className="flex flex-col gap-3">
              <h2 className="section-title">
                <span>06</span> Quick re-check
              </h2>
              {recheck === null ? (
                <div className="panel flex flex-wrap items-center justify-between gap-3 p-4">
                  <p className="text-sm">{recheckExercises.length} exercise(s) you missed this time. Want to try them again now?</p>
                  <Button onClick={() => setRecheck(0)}>
                    <RotateCcw /> Start re-check
                  </Button>
                </div>
              ) : recheck < recheckExercises.length ? (
                <div className="panel p-4">
                  <ExercisePlayer key={recheck} exercise={recheckExercises[recheck]} onDone={() => setRecheck(recheck + 1)} nextLabel={recheck + 1 === recheckExercises.length ? "Done" : "Next"} />
                </div>
              ) : (
                <p className="panel p-4 text-sm font-bold">Re-check complete ✓</p>
              )}
            </section>
          )}

          {session.studioTask && (
            <section className="panel border-l-4 border-l-primary p-4">
              <h2 className="section-title">
                <span>07</span> Studio task
              </h2>
              <p className="mt-2">
                <GlossaryText text={session.studioTask} />
              </p>
            </section>
          )}

          <div className="flex flex-wrap gap-2">
            <Button variant="lime" size="lg" onClick={save} disabled={saved}>
              {saved ? <Check /> : <Save />} {saved ? "Saved to journal" : "Save to journal"}
            </Button>
            <Button variant="secondary" size="lg" onClick={() => download(reflectionToMarkdown(session, answers), `harmonic-cat-reflection-${new Date().toISOString().slice(0, 10)}.md`)}>
              <Download /> Download notes
            </Button>
          </div>
        </article>
      )}

      {reflections.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="section-title">
            <BookOpen className="size-4" /> Journal
          </h2>
          {reflections.map((r) => (
            <div key={r.id} className="panel">
              <button onClick={() => setOpenPast(openPast === r.id ? null : r.id)} className="flex w-full items-center justify-between gap-3 p-4 text-left" aria-expanded={openPast === r.id}>
                <span className="min-w-0">
                  <span className="block truncate font-bold">{r.title}</span>
                  <span className="label">{new Date(r.createdAt).toLocaleString()}</span>
                </span>
                <ChevronDown className={cn("size-4 shrink-0 transition-transform", openPast === r.id && "rotate-180")} />
              </button>
              {openPast === r.id && (
                <div className="border-t border-border p-4">
                  <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed">{r.notes}</pre>
                  <div className="mt-3 flex gap-2">
                    <Button size="sm" variant="secondary" onClick={() => download(r.notes, `${r.id}.md`)}>
                      <Download /> Download
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => confirm("Delete this reflection?") && deleteReflection(r.id)}>
                      <Trash2 /> Delete
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </section>
      )}
    </div>
  );
}

export default function ReflectPage() {
  return (
    <Suspense>
      <ReflectInner />
    </Suspense>
  );
}
