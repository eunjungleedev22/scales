"use client";
import { useCallback, useEffect, useRef, useState } from "react";

/* Minimal typings for the Web Speech API recogniser (not in TS's DOM lib). */
interface RecognitionResultList {
  length: number;
  [i: number]: { isFinal: boolean; 0: { transcript: string } };
}
interface Recognition {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  onresult: ((e: { resultIndex: number; results: RecognitionResultList }) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}
type RecognitionCtor = new () => Recognition;

function getCtor(): RecognitionCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as { SpeechRecognition?: RecognitionCtor; webkitSpeechRecognition?: RecognitionCtor };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

/** Voice-to-text using the device's built-in speech recognition. */
export function useDictation(onText: (text: string) => void) {
  const [listening, setListening] = useState(false);
  const [interim, setInterim] = useState("");
  const [error, setError] = useState<string | null>(null);
  const recRef = useRef<Recognition | null>(null);
  const cb = useRef(onText);
  cb.current = onText;
  const supported = getCtor() !== null;

  const stop = useCallback(() => {
    recRef.current?.stop();
  }, []);

  const start = useCallback((lang: "en-US" | "ko-KR" = "en-US") => {
    const Ctor = getCtor();
    if (!Ctor) return setError("Voice input isn't supported in this browser. You can type instead.");
    recRef.current?.abort();
    const rec = new Ctor();
    rec.lang = lang;
    rec.interimResults = true;
    rec.continuous = false;
    rec.onresult = (e) => {
      let finalText = "";
      let live = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i];
        if (r.isFinal) finalText += r[0].transcript;
        else live += r[0].transcript;
      }
      setInterim(live);
      if (finalText.trim()) cb.current(finalText.trim());
    };
    rec.onerror = (e) => {
      setError(e.error === "not-allowed" || e.error === "service-not-allowed" ? "Microphone access was blocked. Allow it in your browser settings, or type instead." : e.error === "no-speech" ? "Didn't catch that — try again." : `Voice input error: ${e.error}`);
    };
    rec.onend = () => {
      setListening(false);
      setInterim("");
    };
    setError(null);
    setListening(true);
    recRef.current = rec;
    try {
      rec.start();
    } catch {
      setListening(false);
    }
  }, []);

  useEffect(() => () => recRef.current?.abort(), []);
  return { supported, listening, interim, error, start, stop };
}
