import { describe, expect, it } from "vitest";
import { generateReflection, reflectionToMarkdown } from "./generate";

const T = 1_800_000_000_000;
const log = [
  { t: T, id: "w1-steps-1", correct: true, firstTry: true },
  { t: T + 30_000, id: "w1-steps-2", correct: true, firstTry: true },
  { t: T + 60_000, id: "w1-steps-3", correct: true, firstTry: true },
  { t: T + 90_000, id: "w2-modes-1", correct: false, firstTry: true },
  { t: T + 120_000, id: "w2-modes-1", correct: true, firstTry: false },
  { t: T + 150_000, id: "w2-modes-2", correct: false, firstTry: true },
  { t: T + 160_000, id: "drill-ear-interval", correct: true, firstTry: true },
  { t: T - 5 * 86_400_000, id: "w1-keyboard-1", correct: true, firstTry: true }, // older, outside window
];

describe("reflection generator", () => {
  it("summarises the window: covered lessons, wins, tricky spots, practice", () => {
    const r = generateReflection(log, { kind: "since", since: T - 1000, label: "Today" }, T + 200_000);
    expect(r.empty).toBe(false);
    expect(r.totals.answered).toBe(7);
    expect(r.covered.map((c) => c.lessonId)).toEqual(["w1-steps", "w2-modes"]);
    expect(r.wins.map((w) => w.lessonId)).toEqual(["w1-steps"]);
    expect(r.tricky.map((w) => w.lessonId)).toEqual(["w2-modes"]);
    expect(r.recheckIds).toEqual(["w2-modes-1", "w2-modes-2"]);
    expect(r.practice).toEqual([{ label: "Hear intervals", answered: 1, firstTryRate: 1 }]);
    expect(r.questions[0].id).toBe("w2-modes:0"); // tricky lesson prompt comes first
    expect(r.questions).toHaveLength(3);
    expect(r.keyTerms.map((k) => k.ko)).toContain("반음");
    expect(r.covered[0].notes[0]).toMatch(/semitone/);
  });
  it("scopes to a single lesson", () => {
    const r = generateReflection(log, { kind: "lesson", lessonId: "w1-keyboard" });
    expect(r.covered.map((c) => c.lessonId)).toEqual(["w1-keyboard"]);
    expect(r.title).toBe("Reflection: Keyboard orientation");
  });
  it("is empty when nothing happened and renders markdown notes", () => {
    expect(generateReflection(log, { kind: "since", since: T + 999_999, label: "x" }, T + 2_000_000).empty).toBe(true);
    const r = generateReflection(log, { kind: "since", since: T - 1000, label: "Today" }, T + 200_000);
    const md = reflectionToMarkdown(r, { [r.questions[0].id]: "Dorian has a raised 6th." });
    expect(md).toContain("## Summary notes");
    expect(md).toContain("Dorian has a raised 6th.");
    expect(md).toContain("반음");
  });
});
