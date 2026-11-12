"use client";
/**
 * Narration: plays the pre-recorded natural voice (public/voice, see scripts/render-voice.py)
 * when available, otherwise falls back to the device's built-in speech voice.
 */
import { audio } from "./engine";
import { cancelSpeech, estimateSpeechMs, speak, toSpeech } from "./speech";
import { VOICE_BASE, voiceKey } from "./voiceKey";

export type VoiceStyle = "natural" | "device";

let manifestPromise: Promise<Record<string, number>> | null = null;

export function loadVoiceManifest(): Promise<Record<string, number>> {
  if (!manifestPromise) {
    manifestPromise = fetch(`${VOICE_BASE}/manifest.json`)
      .then((r) => (r.ok ? r.json() : {}))
      .catch(() => ({}));
  }
  return manifestPromise;
}

const clipUrl = (spoken: string) => `${VOICE_BASE}/${voiceKey(spoken)}.mp3`;

export interface NarrateOptions {
  style: VoiceStyle;
  rate?: number;
  voiceURI?: string | null;
}

/** Speak a sentence. Resolves when finished or cancelled. */
export async function narrate(text: string, opts: NarrateOptions): Promise<"ended" | "cancelled" | "unsupported"> {
  const spoken = toSpeech(text);
  if (opts.style === "natural") {
    const manifest = await loadVoiceManifest();
    if (manifest[voiceKey(spoken)] !== undefined) {
      const r = await audio.playVoiceClip(clipUrl(spoken));
      if (r !== "unsupported") return r;
    }
  }
  return speak(spoken, { rate: opts.rate, voiceURI: opts.voiceURI });
}

/** Start downloading a sentence's recording so it plays without a gap. */
export async function prefetchNarration(text: string) {
  const spoken = toSpeech(text);
  const manifest = await loadVoiceManifest();
  if (manifest[voiceKey(spoken)] !== undefined) void audio.loadVoiceClip(clipUrl(spoken));
}

/** Approximate length (ms) — exact for recorded clips. */
export function narrationMs(text: string, style: VoiceStyle, rate = 1, manifest?: Record<string, number>): number {
  const spoken = toSpeech(text);
  const sec = style === "natural" ? manifest?.[voiceKey(spoken)] : undefined;
  return sec !== undefined ? sec * 1000 : estimateSpeechMs(spoken, rate);
}

export function stopNarration() {
  cancelSpeech();
  audio.stopVoice();
}
