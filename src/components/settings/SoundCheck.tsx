"use client";
import { useEffect, useState } from "react";
import { Copy, Volume2 } from "lucide-react";
import { audio, wavDataUri } from "@/lib/audio/engine";
import { useAudioState } from "@/hooks/useAudio";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type Result = "untested" | "played" | "failed";

/** Three independent sound tests + live diagnostics, to pinpoint mobile audio problems. */
export function SoundCheck() {
  const { status } = useAudioState();
  const [, force] = useState(0);
  const [results, setResults] = useState<Record<string, Result>>({ raw: "untested", synth: "untested", media: "untested" });
  const [copied, setCopied] = useState(false);

  // Jump straight here when opened via /settings#sound-check
  useEffect(() => {
    if (window.location.hash === "#sound-check") setTimeout(() => document.getElementById("sound-check")?.scrollIntoView({ behavior: "smooth", block: "start" }), 150);
  }, []);

  // refresh the live readout
  useEffect(() => {
    const id = setInterval(() => force((n) => n + 1), 500);
    return () => clearInterval(id);
  }, []);

  const set = (k: string, r: Result) => setResults((x) => ({ ...x, [k]: r }));

  const tests = [
    {
      id: "raw",
      label: "1 · Plain beep",
      hint: "Basic Web Audio, no music engine",
      run: () => set("raw", audio.beepRaw() ? "played" : "failed"),
    },
    {
      id: "synth",
      label: "2 · Synth chord",
      hint: "The sound engine the lessons use",
      run: async () => {
        audio.unlockFromGesture();
        const ok = await audio.init();
        if (ok) void audio.playNotes([60, 64, 67], 1);
        set("synth", ok ? "played" : "failed");
      },
    },
    {
      id: "media",
      label: "3 · Media beep",
      hint: "Like a normal audio file",
      run: async () => {
        try {
          const el = new Audio(wavDataUri(0.6, 660));
          el.setAttribute("playsinline", "");
          await el.play();
          set("media", "played");
        } catch {
          set("media", "failed");
        }
      },
    },
  ];

  const nav = typeof navigator !== "undefined" ? (navigator as Navigator & { audioSession?: { type: string } }) : null;
  const info: Array<[string, string]> = [
    ["Engine status", status],
    ["Audio context", audio.contextState()],
    ["Sample rate", audio.sampleRate ? `${audio.sampleRate} Hz` : "—"],
    ["Engine loaded", audio.toneLoaded ? "yes" : "no"],
    ["Engine bound to context", audio.contextBound ? "yes" : "no"],
    ["iOS audio session", nav?.audioSession ? nav.audioSession.type : "n/a"],
    ["Last error", audio.lastError ?? audio.error ?? "none"],
  ];

  const report = () =>
    [
      `UA: ${typeof navigator !== "undefined" ? navigator.userAgent : ""}`,
      ...info.map(([k, v]) => `${k}: ${v}`),
      ...tests.map((t) => `${t.label}: ${results[t.id]}`),
    ].join("\n");

  return (
    <Card id="sound-check" className="scroll-mt-16">
      <CardHeader>
        <CardTitle>
          <span>♪</span> Sound check
        </CardTitle>
        <CardDescription>Tap each test and note which ones you can hear. If none play, check the phone volume buttons and that Bluetooth isn&apos;t connected to something else.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          {tests.map((t) => (
            <button key={t.id} onClick={() => void t.run()} className="panel flex flex-col items-start gap-1 p-3 text-left hover:border-primary">
              <span className="flex w-full items-center justify-between">
                <span className="font-bold">{t.label}</span>
                <Volume2 className="size-4 text-pink" />
              </span>
              <span className="text-xs text-muted-foreground">{t.hint}</span>
              <span className={results[t.id] === "failed" ? "label text-destructive" : results[t.id] === "played" ? "label text-lime" : "label"}>
                {results[t.id] === "played" ? "sent to speaker — did you hear it?" : results[t.id] === "failed" ? "blocked by browser" : "not tested"}
              </span>
            </button>
          ))}
        </div>
        <dl className="grid grid-cols-1 gap-x-6 gap-y-1 rounded-md border border-border bg-[#0f0e0c] p-3 font-mono text-xs sm:grid-cols-2">
          {info.map(([k, v]) => (
            <div key={k} className="flex justify-between gap-3">
              <dt className="text-muted-foreground">{k}</dt>
              <dd className={v === "running" || v === "ready" || v === "yes" ? "text-lime" : ""}>{v}</dd>
            </div>
          ))}
        </dl>
        <div>
          <Button
            variant="secondary"
            size="sm"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(report());
                setCopied(true);
              } catch {
                alert(report());
              }
            }}
          >
            <Copy /> {copied ? "Copied" : "Copy sound report"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
