"use client";
import { useEffect, useState } from "react";
import { Download, Play, Square, Trash2 } from "lucide-react";
import { audio } from "@/lib/audio/engine";
import { useAudioState } from "@/hooks/useAudio";
import { drumLoop, eventsToMidiSong, StepNote, stepsToEvents } from "@/lib/music/events";
import { COMMON_TONICS, pitchClass, placeAbove } from "@/lib/theory/notes";
import { scalePitchClasses, SCALES, SCALE_IDS, ScaleId } from "@/lib/theory/scales";
import { downloadMidi } from "@/lib/midi/writer";
import { useProgress } from "@/store/progress";
import { StepSequencer, rowsFor } from "./StepSequencer";
import { Button } from "@/components/ui/button";
import { NativeSelect } from "@/components/ui/select";
import { cn } from "@/lib/utils";

export function FreeSequencer() {
  const [tonic, setTonic] = useState("A");
  const [scale, setScale] = useState<ScaleId>("minor-pentatonic");
  const [instrument, setInstrument] = useState<"bass" | "lead">("bass");
  const [bpm, setBpm] = useState(126);
  const [notes, setNotes] = useState<StepNote[]>([]);
  const [len, setLen] = useState(1);
  const [drums, setDrums] = useState(true);
  const [playhead, setPlayhead] = useState<number | null>(null);
  const { playing } = useAudioState();
  const unlock = useProgress((s) => s.unlock);
  const low = instrument === "bass" ? placeAbove(pitchClass(tonic), 28) : placeAbove(pitchClass(tonic), 57);
  const rows = rowsFor(low, 15, scalePitchClasses(tonic, scale));

  const events = () => [...stepsToEvents(notes, instrument), ...(drums ? drumLoop(1, "house") : [])];
  const play = () => void audio.playEvents(events(), bpm, { loop: true, lengthBeats: 4, onStep: (s) => setPlayhead(s % 16) });

  useEffect(() => {
    if (playing) play();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [notes, drums, instrument]);
  useEffect(() => audio.setBpm(bpm), [bpm]);
  useEffect(() => {
    if (!playing) setPlayhead(null);
  }, [playing]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <NativeSelect aria-label="Tonic" value={tonic} onChange={(e) => setTonic(e.target.value)}>
          {COMMON_TONICS.map((n) => <option key={n}>{n}</option>)}
        </NativeSelect>
        <NativeSelect aria-label="Scale" value={scale} onChange={(e) => setScale(e.target.value as ScaleId)}>
          {SCALE_IDS.map((s) => <option key={s} value={s}>{SCALES[s].name}</option>)}
        </NativeSelect>
        <NativeSelect aria-label="Instrument" value={instrument} onChange={(e) => { setInstrument(e.target.value as "bass" | "lead"); setNotes([]); }}>
          <option value="bass">Bass</option>
          <option value="lead">Lead</option>
        </NativeSelect>
        <label className="flex items-center gap-2 text-sm font-bold">
          BPM <input type="number" min={60} max={180} value={bpm} onChange={(e) => setBpm(Math.max(60, Math.min(180, Number(e.target.value) || 120)))} className="h-9 w-16 rounded-lg border border-border bg-secondary px-2" />
        </label>
      </div>
      <StepSequencer steps={16} rows={rows} notes={notes} onChange={(n) => { setNotes(n); if (n.length >= 4 && instrument === "bass") unlock("acid-kitty"); }} noteLength={len} playhead={playhead} />
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="pink" onClick={() => (playing ? audio.stop() : play())}>
          {playing ? <Square /> : <Play />} {playing ? "Stop" : "Play"}
        </Button>
        <div className="flex items-center gap-1 rounded-xl bg-secondary p-1 text-xs font-bold">
          {[1, 2, 4].map((l) => (
            <button key={l} onClick={() => setLen(l)} className={cn("rounded-lg px-2 py-1", len === l && "bg-primary text-white")}>{l === 1 ? "1/16" : l === 2 ? "1/8" : "1/4"}</button>
          ))}
        </div>
        <label className="flex items-center gap-1.5 text-sm font-bold"><input type="checkbox" checked={drums} onChange={(e) => setDrums(e.target.checked)} /> Drums</label>
        <Button variant="secondary" onClick={() => setNotes([])}><Trash2 /> Clear</Button>
        <Button
          variant="secondary"
          disabled={!notes.length}
          onClick={() => {
            downloadMidi(eventsToMidiSong(stepsToEvents(notes, instrument), bpm, "Sequencer pattern"), `harmonic-cat-${instrument}-${tonic}.mid`);
            unlock("midnight-export");
          }}
        >
          <Download /> Export MIDI
        </Button>
      </div>
    </div>
  );
}
