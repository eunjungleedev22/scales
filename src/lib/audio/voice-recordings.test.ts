import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { ALL_LESSONS } from "@/content/curriculum";
import { introFor } from "@/content/intros";
import { loc } from "@/lib/exercises/types";
import { toSpeech } from "./speech";
import { voiceKey } from "./voiceKey";
import { VOICE_TEST_LINE } from "./narration-lines";

describe("pre-recorded natural voice", () => {
  it("has a recording for every narrated sentence (re-run scripts/render-voice.py if this fails)", () => {
    const manifest: Record<string, number> = JSON.parse(readFileSync("public/voice/manifest.json", "utf8"));
    const missing: string[] = [];
    const check = (text: string) => {
      const spoken = toSpeech(text);
      const key = voiceKey(spoken);
      if (manifest[key] === undefined || !existsSync(`public/voice/${key}.mp3`)) missing.push(spoken);
    };
    for (const l of ALL_LESSONS) {
      for (const s of introFor(l, (x) => loc(x, "en"))) check(s.text);
      for (const c of l.concept) check(loc(c, "en"));
    }
    check(VOICE_TEST_LINE);
    expect(missing).toEqual([]);
  });
});
