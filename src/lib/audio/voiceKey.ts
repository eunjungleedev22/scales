/** Recorded-voice settings shared by the renderer script and the app. */
export const VOICE_ID = "kokoro-af_heart-v1";
export const VOICE_BASE = "/voice";

/** Stable file key for a spoken sentence (FNV-1a 64-bit, hex). Must match scripts/export-narration.ts. */
export function voiceKey(spokenText: string): string {
  let h = 0xcbf29ce484222325n;
  const prime = 0x100000001b3n;
  const s = `${VOICE_ID}|${spokenText.trim()}`;
  for (let i = 0; i < s.length; i++) {
    h ^= BigInt(s.charCodeAt(i));
    h = (h * prime) & 0xffffffffffffffffn;
  }
  return h.toString(16).padStart(16, "0");
}
