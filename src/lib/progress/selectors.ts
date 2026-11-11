import { ALL_LESSONS, Lesson, World } from "@/content/curriculum";
import { masteryFrom, ExerciseStat } from "./xp";
import type { LessonRecord } from "@/store/progress";

export function lessonMastery(lesson: Lesson, stats: Record<string, ExerciseStat>, rec?: LessonRecord): number {
  const m = masteryFrom(lesson.exercises.map((e) => stats[e.id]));
  if (rec?.testedOut) return Math.max(m, 0.6);
  return m;
}

export function worldCompletion(world: World, lessons: Record<string, LessonRecord>): number {
  const done = world.lessons.filter((l) => lessons[l.id]).length;
  return done / world.lessons.length;
}

export function worldMastery(world: World, stats: Record<string, ExerciseStat>, lessons: Record<string, LessonRecord>): number {
  return world.lessons.reduce((s, l) => s + lessonMastery(l, stats, lessons[l.id]), 0) / world.lessons.length;
}

export function nextRecommended(lessons: Record<string, LessonRecord>): Lesson | undefined {
  return ALL_LESSONS.find((l) => !lessons[l.id]);
}

/** Exercises the user has struggled with, for review (lowest first-try ratio first). */
export function weakExerciseIds(stats: Record<string, ExerciseStat>, limit = 10): string[] {
  return Object.entries(stats)
    .filter(([id, s]) => !id.startsWith("drill-") && !id.startsWith("lab-") && s.attempts > 0 && s.firstTryCorrect / s.attempts < 0.8)
    .sort((a, b) => a[1].firstTryCorrect / a[1].attempts - b[1].firstTryCorrect / b[1].attempts)
    .slice(0, limit)
    .map(([id]) => id);
}
