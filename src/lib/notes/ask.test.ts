import { describe, expect, it } from "vitest";
import { askUrl, buildPrompt } from "./ask";

const ctx = { lessonTitle: "Modes", world: "Scales & Keys", context: "Dorian is natural minor with a raised sixth." };

describe("ask an AI", () => {
  it("builds a self-contained prompt with the lesson context", () => {
    const p = buildPrompt("  Why does the 6th change the mood? ", ctx);
    expect(p).toContain('Lesson: "Modes" (Scales & Keys)');
    expect(p).toContain("Dorian is natural minor with a raised sixth.");
    expect(p).toContain("My question: Why does the 6th change the mood?");
  });
  it("creates provider URLs with the prompt encoded", () => {
    for (const prov of ["chatgpt", "claude", "perplexity"] as const) {
      const u = new URL(askUrl(prov, "What is Dorian?", ctx));
      expect(u.searchParams.get("q")).toContain("My question: What is Dorian?");
    }
    expect(new URL(askUrl("google", "What is Dorian?", ctx)).searchParams.get("q")).toBe("What is Dorian? Modes music theory");
    expect(askUrl("claude", "a & b?", ctx)).not.toContain("a & b");
  });
  it("keeps Korean questions intact", () => {
    const u = new URL(askUrl("chatgpt", "도리안은 왜 밝게 들려?", ctx));
    expect(u.searchParams.get("q")).toContain("도리안은 왜 밝게 들려?");
  });
});
