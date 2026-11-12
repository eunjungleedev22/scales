/**
 * Lists every sentence the app narrates (lesson intros + concept notes + the voice test line),
 * already cleaned for speech, with its file key. Feed the output to scripts/render-voice.py.
 *   npx tsx scripts/export-narration.ts > narration.json
 */
import { ALL_LESSONS } from "../src/content/curriculum";
import { introFor } from "../src/content/intros";
import { loc } from "../src/lib/exercises/types";
import { toSpeech } from "../src/lib/audio/speech";
import { voiceKey } from "../src/lib/audio/voiceKey";
import { VOICE_TEST_LINE } from "../src/lib/audio/narration-lines";

const en = (x: Parameters<typeof loc>[0]) => loc(x, "en");
const lines = new Map<string, string>();
const add = (text: string) => {
  const spoken = toSpeech(text);
  if (spoken) lines.set(voiceKey(spoken), spoken);
};
for (const lesson of ALL_LESSONS) {
  for (const scene of introFor(lesson, en)) add(scene.text);
  for (const c of lesson.concept) add(en(c));
}
add(VOICE_TEST_LINE);
process.stdout.write(JSON.stringify([...lines].map(([key, text]) => ({ key, text })), null, 1));
