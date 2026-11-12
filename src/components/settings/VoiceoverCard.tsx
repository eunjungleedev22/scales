"use client";
import { useEffect, useState } from "react";
import { Play } from "lucide-react";
import { getVoices, pickVoice, primeSpeech, speak, speechSupported } from "@/lib/audio/speech";
import { useSettings } from "@/store/settings";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { NativeSelect } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

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
          {supported ? "Lesson intros are read aloud so you can listen instead of reading. Uses your device's built-in voices — on iPhone you can download nicer ones in Settings → Accessibility → Spoken Content → Voices." : "This browser doesn't support voiceover."}
        </CardDescription>
      </CardHeader>
      {supported && (
        <CardContent className="flex flex-col gap-4">
          <label className="flex items-center justify-between gap-4 font-bold" htmlFor="narration">
            Read lesson intros aloud
            <Switch id="narration" checked={s.narration ?? true} onCheckedChange={(v) => s.set({ narration: v })} />
          </label>
          <label className="flex items-center justify-between gap-4 font-bold">
            Speed
            <NativeSelect value={String(s.narrationRate ?? 1)} onChange={(e) => s.set({ narrationRate: Number(e.target.value) })}>
              <option value="0.8">Slow</option>
              <option value="0.9">Relaxed</option>
              <option value="1">Normal</option>
              <option value="1.15">Brisk</option>
            </NativeSelect>
          </label>
          {voices.length > 1 && (
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
          <div>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                primeSpeech();
                void speak("A semitone is the smallest step on the keyboard. Two semitones make a whole tone.", { rate: s.narrationRate ?? 1, voiceURI: s.narrationVoice ?? null });
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
