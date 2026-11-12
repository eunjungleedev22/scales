/**
 * Builds an on-demand reflective session from the user's activity log.
 * Pure and deterministic (no AI service): summary notes come from the lesson content,
 * questions from a prompt bank, and the re-check from exercises that were missed.
 */
import { ALL_LESSONS, getWorld, Lesson } from "@/content/curriculum";
import { GENERIC_QUESTIONS, REFLECT_QUESTIONS } from "@/content/reflection";
import { GlossaryEntry, termsIn } from "@/content/glossary";
import { loc, Localized } from "@/lib/exercises/types";

export interface ActivityLike {
  t: number;
  id: string;
  correct: boolean;
  firstTry: boolean;
}

export interface NoteLike {
  lessonId: string;
  kind: "highlight" | "note" | "question";
  text: string;
  context?: string;
  answer?: string;
  askedWith?: string;
  createdAt: number;
}

export interface ReflectionNote extends NoteLike {
  lessonTitle: string;
}

export type ReflectionScope = { kind: "since"; since: number; label: string } | { kind: "lesson"; lessonId: string };

export interface LessonSummary {
  lessonId: string;
  title: string;
  world: string;
  notes: string[];
  production?: string;
  answered: number;
  firstTry: number;
  correct: number;
  firstTryRate: number;
  missedIds: string[];
}

export interface ReflectionSession {
  title: string;
  scopeLabel: string;
  empty: boolean;
  totals: { answered: number; firstTry: number; correct: number; minutes: number; lessons: number };
  covered: LessonSummary[];
  wins: LessonSummary[];
  tricky: LessonSummary[];
  practice: { label: string; answered: number; firstTryRate: number }[];
  keyTerms: GlossaryEntry[];
  questions: { id: string; text: string }[];
  studioTask: string | null;
  recheckIds: string[];
  /** Highlights, notes and questions saved in this window / lesson */
  notes: ReflectionNote[];
}

const en = (l: Localized | undefined) => loc(l, "en");
const lessonOf = (exerciseId: string): Lesson | undefined => ALL_LESSONS.find((l) => exerciseId.startsWith(`${l.id}-`));

const DRILL_LABELS: Record<string, string> = {
  note: "Find notes",
  interval: "Build intervals",
  scale: "Build scales",
  chord: "Build chords",
  degree: "Scale degrees",
  "ear-interval": "Hear intervals",
  "ear-chord": "Hear chords",
  "ear-scale": "Hear scales",
};

function practiceLabel(id: string): string {
  if (id.startsWith("lab-")) return "Composition Lab exercises";
  const k = id.replace(/^drill-/, "");
  return DRILL_LABELS[k] ?? "Practice drills";
}

/** Active minutes: sum of gaps between answers, ignoring breaks longer than 10 minutes. */
function activeMinutes(entries: ActivityLike[]): number {
  let ms = 0;
  for (let i = 1; i < entries.length; i++) {
    const d = entries[i].t - entries[i - 1].t;
    if (d < 10 * 60_000) ms += d;
  }
  return Math.round(ms / 60_000 + (entries.length ? 1 : 0));
}

export function generateReflection(log: ActivityLike[], scope: ReflectionScope, now = Date.now(), savedNotes: NoteLike[] = []): ReflectionSession {
  const notes: ReflectionNote[] = savedNotes
    .filter((n) => (scope.kind === "since" ? n.createdAt >= scope.since && n.createdAt <= now : n.lessonId === scope.lessonId))
    .sort((a, b) => a.createdAt - b.createdAt)
    .map((n) => ({ ...n, lessonTitle: en(ALL_LESSONS.find((l) => l.id === n.lessonId)?.title) || n.lessonId }));
  const entries = log
    .filter((e) => (scope.kind === "since" ? e.t >= scope.since && e.t <= now : e.id.startsWith(`${scope.lessonId}-`)))
    .sort((a, b) => a.t - b.t);

  const byLesson = new Map<string, LessonSummary>();
  const practice = new Map<string, { answered: number; firstTry: number }>();
  for (const e of entries) {
    const lesson = lessonOf(e.id);
    if (!lesson) {
      const label = practiceLabel(e.id);
      const p = practice.get(label) ?? { answered: 0, firstTry: 0 };
      p.answered++;
      if (e.correct && e.firstTry) p.firstTry++;
      practice.set(label, p);
      continue;
    }
    let s = byLesson.get(lesson.id);
    if (!s) {
      s = {
        lessonId: lesson.id,
        title: en(lesson.title),
        world: en(getWorld(lesson.worldId)?.title),
        notes: lesson.concept.map(en),
        production: lesson.production ? en(lesson.production) : undefined,
        answered: 0,
        firstTry: 0,
        correct: 0,
        firstTryRate: 0,
        missedIds: [],
      };
      byLesson.set(lesson.id, s);
    }
    s.answered++;
    if (e.correct) s.correct++;
    if (e.correct && e.firstTry) s.firstTry++;
    // An exercise counts as "missed" if any attempt in this window was wrong
    if (!e.correct && !s.missedIds.includes(e.id)) s.missedIds.push(e.id);
  }
  // Rate per distinct exercise: first answer of each exercise decides first-try success
  for (const s of byLesson.values()) {
    const firstAnswers = new Map<string, boolean>();
    for (const e of entries) if (e.id.startsWith(`${s.lessonId}-`) && !firstAnswers.has(e.id)) firstAnswers.set(e.id, e.correct && e.firstTry);
    const vals = [...firstAnswers.values()];
    s.firstTryRate = vals.length ? vals.filter(Boolean).length / vals.length : 0;
  }

  const covered = [...byLesson.values()];
  const wins = covered.filter((s) => s.firstTryRate >= 0.8 && s.answered >= 2);
  const tricky = covered.filter((s) => s.firstTryRate < 0.6 || s.missedIds.length >= 2).sort((a, b) => a.firstTryRate - b.firstTryRate);

  // Questions: tricky lessons first, then other covered lessons, then generic prompts
  const questions: { id: string; text: string }[] = [];
  for (const s of [...tricky, ...covered.filter((c) => !tricky.includes(c))]) {
    const q = REFLECT_QUESTIONS[s.lessonId]?.[0];
    if (q && !questions.some((x) => x.text === q)) questions.push({ id: `${s.lessonId}:0`, text: q });
    if (questions.length >= 2) break;
  }
  for (const [i, g] of GENERIC_QUESTIONS.entries()) {
    if (questions.length >= 3) break;
    questions.push({ id: `generic:${i}`, text: g });
  }

  const studioTask = [...tricky, ...covered].map((s) => s.production).find(Boolean) ?? (covered.length ? `Open Ableton and spend 10 minutes using ${covered[0].title.toLowerCase()} in a 4-bar loop.` : null);
  const recheckIds = tricky.flatMap((s) => s.missedIds).slice(0, 3);
  const keyTerms = termsIn(covered.flatMap((s) => s.notes)).slice(0, 10);

  const totals = {
    answered: entries.length,
    firstTry: entries.filter((e) => e.correct && e.firstTry).length,
    correct: entries.filter((e) => e.correct).length,
    minutes: activeMinutes(entries),
    lessons: covered.length,
  };

  const lessonTitle = scope.kind === "lesson" ? en(ALL_LESSONS.find((l) => l.id === scope.lessonId)?.title) : "";
  return {
    title: scope.kind === "lesson" ? `Reflection: ${lessonTitle}` : "Reflection",
    scopeLabel: scope.kind === "lesson" ? lessonTitle : scope.label,
    empty: entries.length === 0 && notes.length === 0,
    totals,
    covered,
    wins,
    tricky,
    practice: [...practice.entries()].map(([label, p]) => ({ label, answered: p.answered, firstTryRate: p.answered ? p.firstTry / p.answered : 0 })),
    keyTerms,
    questions,
    studioTask,
    recheckIds,
    notes,
  };
}

/** Plain-text / Markdown notes for saving or downloading. */
export function reflectionToMarkdown(r: ReflectionSession, answers: Record<string, string>, date = new Date()): string {
  const lines: string[] = [];
  lines.push(`# ${r.title}`, "", `${date.toLocaleDateString()} · ${r.scopeLabel}`, "");
  lines.push(`**${r.totals.answered} answers · ${r.totals.firstTry} first try · ~${r.totals.minutes} min · ${r.totals.lessons} lessons**`, "");
  if (r.covered.length) {
    lines.push("## Summary notes", "");
    for (const s of r.covered) {
      lines.push(`### ${s.title} (${s.world}) — ${Math.round(s.firstTryRate * 100)}% first try`);
      for (const n of s.notes) lines.push(`- ${n}`);
      lines.push("");
    }
  }
  if (r.keyTerms.length) {
    lines.push("## Key terms", "");
    for (const t of r.keyTerms) lines.push(`- **${t.terms[0]}** — ${t.ko}: ${t.def}`);
    lines.push("");
  }
  if (r.notes.length) {
    lines.push("## My notes & questions", "");
    for (const n of r.notes) {
      const where = [n.lessonTitle, n.context].filter(Boolean).join(" · ");
      if (n.kind === "question") {
        lines.push(`- **Q (${where}):** ${n.text}`);
        if (n.answer) lines.push(`  - **A${n.askedWith ? ` (${n.askedWith})` : ""}:** ${n.answer.replace(/\n+/g, " ")}`);
      } else lines.push(`- ${n.kind === "highlight" ? "★" : "✎"} ${n.text} _(${where})_`);
    }
    lines.push("");
  }
  if (r.wins.length) lines.push("## Going well", "", ...r.wins.map((w) => `- ${w.title}`), "");
  if (r.tricky.length) lines.push("## Worth another look", "", ...r.tricky.map((w) => `- ${w.title}`), "");
  const answered = r.questions.filter((q) => answers[q.id]?.trim());
  if (answered.length) {
    lines.push("## My reflections", "");
    for (const q of answered) lines.push(`**${q.text}**`, "", answers[q.id].trim(), "");
  }
  if (r.studioTask) lines.push("## Studio task", "", r.studioTask, "");
  return lines.join("\n");
}
