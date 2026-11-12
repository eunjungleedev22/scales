"use client";
import { useEffect, useState } from "react";
import { Play } from "lucide-react";
import { getVoices, pickVoice, primeSpeech, speechSupported } from "@/lib/audio/speech";
import { narrate } from "@/lib/audio/narration";
import { audio } from "@/lib/audio/engine";
import { VOICE_TEST_LINE } from "@/lib/audio/narration-lines";
import { useSettings } from "@/store/settings";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { NativeSelect } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";

/** Voiceover settings: on/off, speed and voice (uses the device's built-in voices). */
export function VoiceoverCard() {
  const s = useSettings();
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const supported = speechSupported();
  useEffect(() => {
    void getVoices().then((v) => setVoices(v.filter((x) => x.lang.toLowerCase().startsWith("en"))));
  }, []);
  const current = pickVoice(voices, s.narrationVoice ?? null);

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <span>◉</span> Voiceover
        </CardTitle>
        <CardDescription>
          Lesson intros and concept notes are read aloud so you can listen instead of reading. The natural voice is pre-recorded and sounds the same on every device.
        </CardDescription>
      </CardHeader>
      {(
        <CardContent className="flex flex-col gap-4">
          <label className="flex items-center justify-between gap-4 font-bold" htmlFor="narration">
            Read lesson intros aloud
            <Switch id="narration" checked={s.narration ?? true} onCheckedChange={(v) => s.set({ narration: v })} />
          </label>
          <div className="flex flex-col gap-2">
            <span className="font-bold">Voice style</span>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {(
                [
                  ["natural", "Natural voice", "Pre-recorded neural voice. Warm and human-sounding."],
                  ["device", "Device voice", "Your phone or browser's built-in voice. Adjustable speed."],
                ] as const
              ).map(([id, name, desc]) => (
                <button key={id} onClick={() => s.set({ voiceStyle: id })} aria-pressed={(s.voiceStyle ?? "natural") === id} className={"panel flex flex-col items-start gap-1 p-3 text-left " + ((s.voiceStyle ?? "natural") === id ? "border-primary ring-1 ring-primary" : "")}>
                  <span className="flex items-center gap-2 font-bold">
                    <span className={"led " + ((s.voiceStyle ?? "natural") === id ? "led-orange" : "")} /> {name}
                  </span>
                  <span className="text-xs text-muted-foreground">{desc}</span>
                </button>
              ))}
            </div>
          </div>
          {s.voiceStyle === "device" && supported && (
          <label className="flex items-center justify-between gap-4 font-bold">
            Speed
            <NativeSelect value={String(s.narrationRate ?? 1)} onChange={(e) => s.set({ narrationRate: Number(e.target.value) })}>
              <option value="0.8">Slow</option>
              <option value="0.9">Relaxed</option>
              <option value="1">Normal</option>
              <option value="1.15">Brisk</option>
            </NativeSelect>
          </label>
          )}
          {s.voiceStyle === "device" && voices.length > 1 && (
            <label className="flex flex-wrap items-center justify-between gap-2 font-bold">
              Voice
              <NativeSelect className="max-w-full" value={current?.voiceURI ?? ""} onChange={(e) => s.set({ narrationVoice: e.target.value || null })}>
                {voices.map((v) => (
                  <option key={v.voiceURI} value={v.voiceURI}>
                    {v.name} ({v.lang})
                  </option>
                ))}
              </NativeSelect>
            </label>
          )}
          <label className="flex flex-wrap items-center justify-between gap-3 font-bold">
            Voice volume
            <span className="flex w-56 items-center gap-3">
              <Slider aria-label="Voice volume" value={[(s.voiceVolume ?? 0.7) * 100]} max={100} step={1} onValueChange={([v]) => s.set({ voiceVolume: v / 100 })} />
              <span className="readout w-9 text-right text-xs text-muted-foreground">{Math.round((s.voiceVolume ?? 0.7) * 100)}</span>
            </span>
          </label>
          <div>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                audio.unlockFromGesture();
                primeSpeech();
                void narrate(VOICE_TEST_LINE, { style: s.voiceStyle ?? "natural", rate: s.narrationRate ?? 1, voiceURI: s.narrationVoice ?? null });
              }}
            >
              <Play /> Test voice
            </Button>
          </div>
        </CardContent>
      )}
    </Card>
  );
}
