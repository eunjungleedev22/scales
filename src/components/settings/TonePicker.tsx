"use client";
import { Play } from "lucide-react";
import { audio, TonePreset } from "@/lib/audio/engine";
import { chordEvents, NoteEvent, voiceProgression } from "@/lib/music/events";
import { useSettings } from "@/store/settings";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export const TONE_PRESETS: Array<{ id: TonePreset; name: string; desc: string }> = [
  { id: "epiano", name: "Electric piano", desc: "Classic '80s FM electric piano with chorus. Warm, bell-like, round bass." },
  { id: "analog", name: "Analog poly", desc: "Vintage analog polysynth: soft detuned saws and lush chorus." },
  { id: "piano", name: "Soft piano", desc: "Gentle, piano-like tone. The most neutral for ear training." },
  { id: "acid", name: "Acid", desc: "Bright saws and a squelchy resonant bass (the original sound)." },
];

/** A short original ii–V–I phrase with bass and a little melody, for previewing a sound. */
function previewEvents(): NoteEvent[] {
  const chords = [
    { root: "D", type: "min7" as const },
    { root: "G", type: "dom7" as const },
    { root: "C", type: "maj7" as const },
  ];
  const evs = chordEvents(voiceProgression(chords, "smooth", 60), 2, "keys");
  [38, 43, 36].forEach((m, i) => evs.push({ midi: m, start: i * 2, duration: 1.8, instrument: "bass" }));
  [74, 72, 71, 72, 76].forEach((m, i) => evs.push({ midi: m, start: 0.5 + i * 1.1, duration: 0.5, instrument: "lead", velocity: 0.7 }));
  return evs;
}

export function TonePicker() {
  const tone = useSettings((s) => s.tonePreset ?? "epiano");
  const set = useSettings((s) => s.set);

  const choose = (id: TonePreset, preview: boolean) => {
    set({ tonePreset: id });
    audio.setPreset(id);
    if (preview) {
      audio.unlockFromGesture();
      void audio.playEvents(previewEvents(), 96);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <span>♫</span> Instrument sound
        </CardTitle>
        <CardDescription>Used for keys, chords, bass and melodies everywhere in the app. Drums stay the same.</CardDescription>
      </CardHeader>
      <CardContent className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {TONE_PRESETS.map((p) => (
          <div key={p.id} className={cn("panel flex items-start gap-3 p-3", tone === p.id && "border-primary ring-1 ring-primary")}>
            <button onClick={() => choose(p.id, false)} className="flex flex-1 flex-col items-start gap-1 text-left" aria-pressed={tone === p.id}>
              <span className="flex items-center gap-2 font-bold">
                <span className={cn("led", tone === p.id && "led-orange")} /> {p.name}
              </span>
              <span className="text-xs text-muted-foreground">{p.desc}</span>
            </button>
            <button onClick={() => choose(p.id, true)} aria-label={`Preview ${p.name}`} className="rounded-md border border-border bg-secondary p-2 text-pink hover:border-pink">
              <Play className="size-4" />
            </button>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
