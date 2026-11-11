import { describe, expect, it } from "vitest";
import { resolveProgression } from "./progression";
import { voiceProgression } from "./events";
import { movementCost } from "@/lib/theory/chords";

describe("progression resolution", () => {
  it("resolves degrees, overrides and borrowed chords with roman numerals", () => {
    const r = resolveProgression("A", "minor", [
      { degree: 1, seventh: true },
      { degree: 6, seventh: false },
      { degree: 5, seventh: false, override: "maj" },
      { degree: 7, seventh: false, root: "G", override: "maj" },
    ]);
    expect(r.map((c) => c.symbol)).toEqual(["Am7", "F", "E", "G"]);
    expect(r.map((c) => c.roman)).toEqual(["i7", "VI", "V", "VII"]);
    expect(r[2].diatonic).toBe(false);
    expect(r[0].fn).toBe("tonic");
  });
  it("smooth voicing moves less than root-position voicing", () => {
    const chords = [{ root: "C", type: "maj" as const }, { root: "A", type: "min" as const }, { root: "F", type: "maj" as const }, { root: "G", type: "maj" as const }];
    const cost = (vs: number[][]) => vs.slice(1).reduce((s, v, i) => s + movementCost(vs[i], v), 0);
    expect(cost(voiceProgression(chords, "smooth"))).toBeLessThan(cost(voiceProgression(chords, "root")));
  });
});
