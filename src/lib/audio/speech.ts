/**
 * Voiceover via the browser's built-in speech synthesis (Web Speech API).
 * Free, offline-capable on most devices, no API keys.
 */

const ROMAN: Record<string, string> = {
  i: "one", ii: "two", iii: "three", iv: "four", v: "five", vi: "six", vii: "seven",
};

function romanWord(tok: string): string {
  const dim = tok.endsWith("°");
  const core = dim ? tok.slice(0, -1) : tok;
  const n = ROMAN[core.toLowerCase()];
  if (!n) return tok;
  const quality = dim ? " diminished" : core === core.toUpperCase() ? " major" : " minor";
  return `${n}${quality}`;
}

const ROMAN_TOKEN = "(?:VII|VI|IV|V|III|II|I|vii|vi|iv|v|iii|ii|i)°?";

/** Make music text readable by a speech engine. Pure — unit-tested. */
export function toSpeech(text: string): string {
  let t = text;
  // Step recipes: "W W H W W W H" / "W H W" → "whole, whole, half…"
  t = t.replace(/\b([WH](?:[ -][WH]){2,})\b/g, (m) =>
    m
      .split(/[ -]/)
      .map((x) => (x === "W" ? "whole" : "half"))
      .join(", "),
  );
  // Roman numeral sequences like "I ii iii IV V vi vii°" or "(I, vi)" / "(V, vii°)"
  t = t.replace(new RegExp(`(?<![\\w])(${ROMAN_TOKEN}(?:[ ,–-]+${ROMAN_TOKEN}){1,})(?![\\w])`, "g"), (m) => {
    const toks = m.split(/[ ,–-]+/).filter(Boolean);
    // Avoid reading a lone pronoun "I" in normal sentences as a numeral
    if (toks.length < 2) return m;
    return toks.map(romanWord).join(", ");
  });
  t = t.replace(/\(([IVX]+|[ivx]+°?)\)/g, (_, r) => `(${romanWord(r)})`);
  // Accidentals
  t = t.replace(/♯/g, " sharp ").replace(/♭/g, " flat ").replace(/♮/g, " natural ");
  t = t.replace(/\b([A-G])#/g, "$1 sharp").replace(/\b([A-G])b(?=\d|\b)/g, "$1 flat");
  t = t.replace(/\bflat\s+(\d)/g, "flat $1").replace(/\bsharp\s+(\d)/g, "sharp $1");
  // Intervals & chord shorthand
  t = t.replace(/\bm3\b/g, "minor third").replace(/\bM3\b/g, "major third").replace(/\bP5\b/g, "perfect fifth").replace(/\bP4\b/g, "perfect fourth");
  t = t.replace(/\bm7\b/g, "minor seventh").replace(/\bTT\b/g, "tritone").replace(/\bmaj7\b/g, "major seven");
  t = t.replace(/°/g, " diminished");
  // Note with octave: "C4" → "C 4"
  t = t.replace(/\b([A-G])(-?\d)\b/g, "$1 $2");
  // Note ranges: "E–F", "B-C" → "E to F"
  t = t.replace(/\b([A-G](?: sharp| flat)?)\s*[–-]\s*([A-G](?: sharp| flat)?)\b/g, "$1 to $2");
  // Symbols
  t = t.replace(/\s*[—–]\s*/g, ", ").replace(/→/g, " to ").replace(/\+/g, " plus ").replace(/=/g, " equals ").replace(/·/g, ", ").replace(/\//g, " or ");
  t = t.replace(/\bBPM\b/g, "B P M").replace(/\bMIDI\b/g, "midi");
  return t.replace(/\s{2,}/g, " ").replace(/\s+([,.!?])/g, "$1").trim();
}

export function speechSupported(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window && typeof SpeechSynthesisUtterance !== "undefined";
}

let voicesCache: SpeechSynthesisVoice[] = [];

export function getVoices(): Promise<SpeechSynthesisVoice[]> {
  if (!speechSupported()) return Promise.resolve([]);
  const now = window.speechSynthesis.getVoices();
  if (now.length) {
    voicesCache = now;
    return Promise.resolve(now);
  }
  return new Promise((resolve) => {
    const done = () => {
      voicesCache = window.speechSynthesis.getVoices();
      resolve(voicesCache);
    };
    window.speechSynthesis.addEventListener?.("voiceschanged", done, { once: true });
    setTimeout(done, 1200);
  });
}

/** Natural-sounding voices first, by name, then any local voice in the language. */
const PREFERRED = ["Samantha", "Ava", "Allison", "Susan", "Google US English", "Microsoft Aria", "Microsoft Jenny", "Karen", "Serena", "Daniel", "Google UK English Female"];

export function pickVoice(voices: SpeechSynthesisVoice[], preferredURI: string | null, lang = "en"): SpeechSynthesisVoice | null {
  if (preferredURI) {
    const v = voices.find((x) => x.voiceURI === preferredURI);
    if (v) return v;
  }
  const inLang = voices.filter((v) => v.lang.toLowerCase().startsWith(lang));
  for (const name of PREFERRED) {
    const v = inLang.find((x) => x.name.includes(name));
    if (v) return v;
  }
  return inLang.find((v) => v.localService) ?? inLang[0] ?? null;
}

/** Call synchronously inside a tap so iOS allows later speech started from timers/effects. */
export function primeSpeech() {
  if (!speechSupported()) return;
  try {
    const u = new SpeechSynthesisUtterance(" ");
    u.volume = 0;
    window.speechSynthesis.speak(u);
  } catch {
    /* ignore */
  }
}

export function cancelSpeech() {
  if (speechSupported()) window.speechSynthesis.cancel();
}

export interface SpeakOptions {
  rate?: number;
  voiceURI?: string | null;
  lang?: string;
}

/**
 * Speak text; resolves when finished (or cancelled). Has a safety timeout because some
 * browsers occasionally never fire `onend`.
 */
export function speak(text: string, opts: SpeakOptions = {}): Promise<"ended" | "cancelled" | "unsupported"> {
  if (!speechSupported() || !text.trim()) return Promise.resolve("unsupported");
  const synth = window.speechSynthesis;
  synth.cancel();
  const u = new SpeechSynthesisUtterance(text);
  const lang = opts.lang ?? "en";
  const voice = pickVoice(voicesCache.length ? voicesCache : synth.getVoices(), lang === "en" ? opts.voiceURI ?? null : null, lang.slice(0, 2));
  if (voice) {
    u.voice = voice;
    u.lang = voice.lang;
  } else u.lang = lang === "ko" ? "ko-KR" : "en-US";
  u.rate = opts.rate ?? 1;
  const words = text.split(/\s+/).length;
  const estimateMs = (words / (2.6 * (opts.rate ?? 1))) * 1000;
  return new Promise((resolve) => {
    let settled = false;
    const finish = (r: "ended" | "cancelled") => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolve(r);
    };
    const timer = setTimeout(() => finish("ended"), estimateMs * 1.8 + 2500);
    u.onend = () => finish("ended");
    u.onerror = (e) => finish(e.error === "interrupted" || e.error === "canceled" ? "cancelled" : "ended");
    synth.speak(u);
  });
}

/** Rough speaking time in ms (for progress bars). */
export function estimateSpeechMs(text: string, rate = 1): number {
  return (text.split(/\s+/).length / (2.6 * rate)) * 1000 + 400;
}
