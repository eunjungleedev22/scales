import { describe, expect, it } from "vitest";
import { evaluate } from "./evaluate";
import { instantiate, seeded, generateDrill } from "./instantiate";
import type { ConcreteExercise } from "./types";
import { ALL_EXERCISES, WORLDS } from "@/content/curriculum";

const keys = (...midis: number[]) => ({ kind: "keys" as const, midis });

describe("identify note", () => {
  const ex: ConcreteExercise = { id: "t", kind: "identify-note", note: "F#", prompt: "" };
  it("accepts any octave and the enharmonic key", () => {
    expect(evaluate(ex, keys(66)).correct).toBe(true);
    expect(evaluate(ex, keys(54)).correct).toBe(true);
    expect(evaluate({ ...ex, note: "Gb" }, keys(66)).correct).toBe(true);
    expect(evaluate(ex, keys(65)).correct).toBe(false);
  });
});

describe("build interval", () => {
  const ex: ConcreteExercise = { id: "t", kind: "build-interval", from: "C4", interval: "M3", prompt: "" };
  it("checks the note above", () => {
    expect(evaluate(ex, keys(60, 64)).correct).toBe(true);
    expect(evaluate(ex, keys(60, 76)).correct).toBe(true); // compound is accepted (same pitch class above)
    expect(evaluate(ex, keys(60, 52)).correct).toBe(false); // below
    expect(evaluate(ex, keys(60, 63)).correct).toBe(false);
  });
});

describe("build scale", () => {
  const ex: ConcreteExercise = { id: "t", kind: "build-scale", tonic: "D", scale: "dorian", prompt: "" };
  it("validates pitch classes in any octave", () => {
    expect(evaluate(ex, keys(62, 64, 65, 67, 69, 71, 72)).correct).toBe(true);
    expect(evaluate(ex, keys(50, 52, 53, 55, 57, 59, 60, 74)).correct).toBe(true);
    const wrong = evaluate(ex, keys(62, 64, 65, 67, 69, 70, 72));
    expect(wrong.correct).toBe(false);
    expect(wrong.pcs?.wrong).toEqual([10]);
    expect(wrong.pcs?.missing).toEqual([11]);
  });
  it("is enharmonic-safe (Db major = C# major keys)", () => {
    const db: ConcreteExercise = { id: "t", kind: "build-scale", tonic: "Db", scale: "major", prompt: "" };
    expect(evaluate(db, keys(61, 63, 65, 66, 68, 70, 72)).correct).toBe(true);
  });
});

describe("build chord", () => {
  const ex: ConcreteExercise = { id: "t", kind: "build-chord", root: "A", chord: "min7", prompt: "" };
  it("accepts A C E G in any voicing", () => {
    expect(evaluate(ex, keys(57, 60, 64, 67)).correct).toBe(true);
    expect(evaluate(ex, keys(60, 64, 67, 69)).correct).toBe(true);
    expect(evaluate(ex, keys(57, 60, 64)).correct).toBe(false);
  });
  it("enforces inversions when asked", () => {
    const inv: ConcreteExercise = { id: "t", kind: "build-chord", root: "C", chord: "maj", inversion: 1, prompt: "" };
    expect(evaluate(inv, keys(64, 67, 72)).correct).toBe(true);
    expect(evaluate(inv, keys(60, 64, 67)).correct).toBe(false);
  });
});

describe("progressions", () => {
  const ex: ConcreteExercise = {
    id: "t", kind: "complete-progression", tonic: "C", scale: "major", degrees: [2, 5, 1], missing: 1, options: [5, 4, 3], prompt: "",
    alsoWorks: [{ degree: 4, why: "IV also leads home (plagal)." }],
  };
  it("distinguishes correct, creative and incorrect", () => {
    expect(evaluate(ex, { kind: "choice", index: 0 }).status).toBe("correct");
    const c = evaluate(ex, { kind: "choice", index: 1 });
    expect(c.status).toBe("creative");
    expect(c.correct).toBe(true);
    expect(evaluate(ex, { kind: "choice", index: 2 }).status).toBe("incorrect");
  });
});

describe("fix the melody", () => {
  const ex: ConcreteExercise = {
    id: "t", kind: "fix-melody", tonic: "A", scale: "minor", chord: { root: "A", type: "min" },
    melody: [69, 71, 72, 74, 76, 74, 72, 71], editable: [7], mustBeChordTone: [7], prompt: "",
  };
  it("requires the final note to be a chord tone, but allows other dissonance", () => {
    expect(evaluate(ex, { kind: "melody", notes: ex.melody }).correct).toBe(false);
    const fixed = [...ex.melody];
    fixed[7] = 69;
    const r = evaluate(ex, { kind: "melody", notes: fixed });
    expect(r.correct).toBe(true);
  });
});

describe("bassline and call/response", () => {
  it("bassline needs chord-tone anchors", () => {
    const ex: ConcreteExercise = { id: "t", kind: "bassline", tonic: "A", scale: "minor", chords: [{ root: "A", type: "min" }, { root: "F", type: "maj" }], low: 33, prompt: "" };
    expect(evaluate(ex, { kind: "steps", notes: [{ step: 0, midi: 33, len: 2 }, { step: 6, midi: 45, len: 1 }, { step: 8, midi: 41, len: 2 }] }).correct).toBe(true);
    expect(evaluate(ex, { kind: "steps", notes: [{ step: 0, midi: 35, len: 2 }, { step: 6, midi: 45, len: 1 }, { step: 8, midi: 41, len: 2 }] }).correct).toBe(false);
  });
  it("call and response is creative, never simply 'wrong' with enough notes", () => {
    const ex: ConcreteExercise = { id: "t", kind: "call-response", tonic: "A", scale: "minor", chord: { root: "A", type: "min" }, call: [{ step: 0, midi: 69, len: 2 }, { step: 4, midi: 72, len: 2 }], low: 57, prompt: "" };
    const r = evaluate(ex, { kind: "steps", notes: [{ step: 16, midi: 76, len: 2 }, { step: 20, midi: 74, len: 2 }, { step: 24, midi: 69, len: 4 }] });
    expect(r.status).toBe("creative");
  });
});

describe("ear training instantiation", () => {
  it("creates a choice question whose answer matches the audio", () => {
    const ex = instantiate({ id: "e", kind: "ear-interval", pool: ["m3", "M3", "P5"], mode: "harmonic", prompt: "" }, seeded(3));
    expect(ex.kind).toBe("choice");
    if (ex.kind !== "choice" || ex.audio?.type !== "notes") throw new Error();
    const semis = ex.audio.midis[1] - ex.audio.midis[0];
    expect([3, 4, 7][ex.answer]).toBe(semis);
  });
  it("drill generators produce answerable exercises", () => {
    const rng = seeded(7);
    for (let i = 0; i < 50; i++) {
      for (const k of ["note", "interval", "scale", "chord", "ear-interval", "ear-chord", "degree"] as const) {
        const ex = generateDrill(k, rng);
        if (ex.kind === "choice") expect(ex.answer).toBeGreaterThanOrEqual(0);
      }
    }
  });
});

describe("curriculum integrity", () => {
  it("has 7 worlds and >=10 exercises in worlds 1-3", () => {
    expect(WORLDS).toHaveLength(7);
    for (const w of WORLDS.slice(0, 3)) {
      const n = w.lessons.reduce((s, l) => s + l.exercises.length, 0);
      expect(n).toBeGreaterThanOrEqual(10);
    }
  });
  it("every exercise has a unique id and a reachable correct answer", () => {
    const ids = new Set<string>();
    for (const def of ALL_EXERCISES) {
      expect(ids.has(def.id), def.id).toBe(false);
      ids.add(def.id);
      const ex = instantiate(def, seeded(1));
      if (ex.kind === "choice") expect(ex.answer, ex.id).toBeGreaterThanOrEqual(0);
      if (ex.kind === "choice") expect(ex.answer, ex.id).toBeLessThan(ex.options.length);
      if (ex.kind === "complete-progression") expect(ex.options, ex.id).toContain(ex.degrees[ex.missing]);
      if (ex.kind === "fix-melody") expect(evaluate(ex, { kind: "melody", notes: ex.melody }).correct, `${ex.id} should start unresolved`).toBe(false);
    }
  });
});

import { exercisesFromProject } from "./fromProject";
import { resolveProgression } from "@/lib/music/progression";

describe("exercises generated from a Composition Lab project", () => {
  it("creates answerable exercises for an A minor progression", () => {
    const chords = resolveProgression("A", "minor", [1, 6, 3, 7].map((d) => ({ degree: d, seventh: false })));
    const exs = exercisesFromProject("A", "minor", chords, seeded(11));
    expect(exs.map((e) => e.id)).toEqual(expect.arrayContaining(["lab-chord-tones", "lab-compatible-scale", "lab-bass-note", "lab-voice-leading", "lab-build-scale"]));
    for (const e of exs) {
      if (e.kind === "choice") {
        expect(e.answer).toBeGreaterThanOrEqual(0);
        expect(new Set(e.options.map(String)).size).toBe(e.options.length);
      }
    }
    const vl = exs.find((e) => e.id === "lab-voice-leading");
    if (vl?.kind !== "choice") throw new Error();
    expect(vl.options[vl.answer]).toBe("2"); // Am & F share A, C
    const chordTones = exs[0];
    expect(evaluate(chordTones, { kind: "keys", midis: [57, 60, 64] }).correct).toBe(true);
  });
});
