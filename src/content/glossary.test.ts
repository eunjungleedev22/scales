import { describe, expect, it } from "vitest";
import { segmentText, termsIn, lookupTerm } from "./glossary";

describe("Korean glossary", () => {
  it("maps core terms to Korean", () => {
    expect(lookupTerm("semitone")?.ko).toBe("반음");
    expect(lookupTerm("Whole Tone")?.ko).toBe("온음");
    expect(lookupTerm("tritone")?.ko).toContain("트라이톤");
  });
  it("prefers the longest match and annotates each term once", () => {
    const segs = segmentText("A whole tone = 2 semitones. Another semitone here. Natural minor scale.");
    const annotated = segs.filter((s) => s.entry).map((s) => s.text);
    expect(annotated).toEqual(["whole tone", "semitones", "Natural minor", "scale"]);
    expect(segs.map((s) => s.text).join("")).toBe("A whole tone = 2 semitones. Another semitone here. Natural minor scale.");
  });
  it("matches whole words only", () => {
    expect(termsIn(["Flatten the rooty modest sharpener"])).toHaveLength(0);
    expect(termsIn(["a minor 3rd and a major 3rd"]).map((e) => e.ko)).toEqual(["단3도", "장3도"]);
  });
});
