import { describe, expect, it } from "vitest";
import { INTROS, introFor } from "./intros";
import { ALL_LESSONS, getLesson } from "./curriculum";
import { loc } from "@/lib/exercises/types";

describe("lesson intro videos", () => {
  it("every lesson has an intro with at least one scene", () => {
    for (const l of ALL_LESSONS) expect(introFor(l, (x) => loc(x, "en")).length, l.id).toBeGreaterThan(0);
  });
  it("hand-written intros reference real lessons and visible keys", () => {
    for (const [id, scenes] of Object.entries(INTROS)) {
      expect(getLesson(id), id).toBeDefined();
      for (const s of scenes) {
        for (const k of s.keys ?? []) {
          expect(k, id).toBeGreaterThanOrEqual(36);
          expect(k, id).toBeLessThanOrEqual(84);
        }
        for (const k of Object.keys(s.badges ?? {})) expect((s.keys ?? []).length > 0 || Number(k) > 0, id).toBe(true);
      }
    }
  });
});
