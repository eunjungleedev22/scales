/**
 * Pure XP / mastery rules. Reward demonstrated understanding, not grinding:
 * - first-try correct answers earn the most
 * - hints and retries still earn something (no punishment)
 * - repeating an already-mastered exercise earns little
 */
export interface ExerciseStat {
  attempts: number;
  correct: number;
  firstTryCorrect: number;
  lastSeen: number;
}

export interface AttemptInfo {
  correct: boolean;
  firstTry: boolean;
  usedHint: boolean;
  boss?: boolean;
}

export function xpForAttempt(a: AttemptInfo, prior: ExerciseStat | undefined): number {
  if (!a.correct) return 0;
  let xp = a.firstTry ? (a.usedHint ? 6 : 10) : 4;
  if (a.boss) xp *= 2;
  // Diminishing returns on exercises already solved first-try several times
  const mastered = prior ? prior.firstTryCorrect : 0;
  if (mastered >= 3) xp = Math.max(1, Math.round(xp * 0.2));
  else if (mastered >= 1) xp = Math.round(xp * 0.6);
  return xp;
}

export const LESSON_BONUS = 20;
export const BOSS_BONUS = 100;
export const PERFECT_BONUS = 15;

/** Level from total XP: each level needs a bit more than the last (100, 220, 360, ...). */
export function levelFromXp(xp: number): { level: number; into: number; needed: number } {
  let level = 1;
  let need = 100;
  let remaining = xp;
  while (remaining >= need) {
    remaining -= need;
    level++;
    need = 100 + (level - 1) * 20;
  }
  return { level, into: remaining, needed: need };
}

/** Mastery 0..1 from exercise stats: first-try accuracy weighted by coverage. */
export function masteryFrom(stats: Array<ExerciseStat | undefined>): number {
  if (!stats.length) return 0;
  let score = 0;
  for (const s of stats) {
    if (!s || s.attempts === 0) continue;
    const firstTryRate = Math.min(1, s.firstTryCorrect / Math.max(1, Math.min(s.attempts, 3)));
    const solved = s.correct > 0 ? 0.5 : 0;
    score += Math.min(1, solved + firstTryRate * 0.5);
  }
  return score / stats.length;
}

export function masteryLabel(m: number): { paws: number; label: string } {
  const paws = m >= 0.95 ? 5 : m >= 0.75 ? 4 : m >= 0.5 ? 3 : m >= 0.25 ? 2 : m > 0 ? 1 : 0;
  const label = ["Not started", "Curious kitten", "Learning", "Getting it", "Confident", "Mastered"][paws];
  return { paws, label };
}
