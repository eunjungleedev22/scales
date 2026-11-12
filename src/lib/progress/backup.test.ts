import { describe, expect, it } from "vitest";
import { applyBackup, backupToCode, createBackup, parseBackup, summarize } from "./backup";

function memory(init: Record<string, string> = {}) {
  const m = new Map(Object.entries(init));
  return { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => void m.set(k, v), m };
}

describe("progress backup", () => {
  const progress = JSON.stringify({ state: { xp: 420, lessons: { a: {}, b: {} }, achievements: { "first-purr": 1 } }, version: 1 });
  const src = memory({ "harmonic-cat-progress": progress, "harmonic-cat-lab": JSON.stringify({ state: { project: { tonic: "Ab" } } }), other: "x" });

  it("round-trips through JSON and the copy code (incl. non-ASCII)", () => {
    const b = createBackup(src);
    expect(Object.keys(b.data)).toEqual(["harmonic-cat-progress", "harmonic-cat-lab"]);
    expect(summarize(b)).toBe("420 XP · 2 lessons · 1 achievements");
    for (const input of [JSON.stringify(b), backupToCode(b)]) {
      const dst = memory();
      applyBackup(parseBackup(input), dst);
      expect(dst.m.get("harmonic-cat-progress")).toBe(progress);
      expect(dst.m.has("other")).toBe(false);
    }
    const ko = { ...b, data: { "harmonic-cat-settings": JSON.stringify({ state: { note: "반음" } }) } };
    expect(parseBackup(backupToCode(ko as typeof b)).data["harmonic-cat-settings"]).toContain("반음");
  });

  it("rejects junk", () => {
    expect(() => parseBackup("hello")).toThrow();
    expect(() => parseBackup(JSON.stringify({ app: "other", data: {} }))).toThrow();
    expect(() => parseBackup(JSON.stringify({ app: "harmonic-cat", data: { evil: "{}" } }))).toThrow();
  });
});
