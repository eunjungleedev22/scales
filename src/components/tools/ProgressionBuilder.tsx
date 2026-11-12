"use client";
import { useEffect, useState } from "react";
import { Download, Play, Square } from "lucide-react";
import { audio } from "@/lib/audio/engine";
import { useAudioState } from "@/hooks/useAudio";
import { chordEvents, drumLoop, eventsToMidiSong, NoteEvent, voiceProgression, VoicingMode } from "@/lib/music/events";
import { HARMONY_SCALES, ProgChord, resolveProgression } from "@/lib/music/progression";
import { chordPitchClasses } from "@/lib/theory/chords";
import { COMMON_TONICS, placeAbove } from "@/lib/theory/notes";
import { SCALES, ScaleId } from "@/lib/theory/scales";
import { downloadMidi } from "@/lib/midi/writer";
import { useProgress } from "@/store/progress";
import { ChordSlots } from "./ChordSlots";
import { Button } from "@/components/ui/button";
import { NativeSelect } from "@/components/ui/select";

export const VOICINGS: Array<{ id: VoicingMode; label: string }> = [
  { id: "smooth", label: "Smooth (voice-led)" },
  { id: "root", label: "Root position" },
  { id: "first", label: "1st inversion" },
  { id: "second", label: "2nd inversion" },
  { id: "spread", label: "Spread / open" },
];

export function buildProgressionEvents(opts: { tonic: string; scale: ScaleId; chords: ProgChord[]; voicing: VoicingMode; stabs: boolean; bass: boolean; drums: boolean }): NoteEvent[] {
  const res = resolveProgression(opts.tonic, opts.scale, opts.chords);
  const voicings = voiceProgression(res, opts.voicing, 60);
  const evs = chordEvents(voicings, 4, opts.stabs ? "keys" : "pad", 0, opts.stabs);
  if (opts.bass) res.forEach((c, i) => evs.push({ midi: placeAbove(chordPitchClasses(c.root, c.type)[0], 36), start: i * 4, duration: 3.5, instrument: "bass", velocity: 0.8 }));
  if (opts.drums) evs.push(...drumLoop(res.length, "house"));
  return evs;
}

export function ProgressionBuilder() {
  const [tonic, setTonic] = useState("C");
  const [scale, setScale] = useState<ScaleId>("major");
  const [chords, setChords] = useState<ProgChord[]>([1, 6, 4, 5].map((d) => ({ degree: d, seventh: false })));
  const [voicing, setVoicing] = useState<VoicingMode>("smooth");
  const [stabs, setStabs] = useState(false);
  const [bass, setBass] = useState(true);
  const [drums, setDrums] = useState(false);
  const [bpm, setBpm] = useState(118);
  const [bar, setBar] = useState<number | null>(null);
  const { playing } = useAudioState();
  const unlock = useProgress((s) => s.unlock);

  const events = () => buildProgressionEvents({ tonic, scale, chords, voicing, stabs, bass, drums });
  const play = () => void audio.playEvents(events(), bpm, { loop: true, lengthBeats: chords.length * 4, onStep: (s) => setBar(Math.floor(s / 16) % chords.length) });

  // Restart loop with new settings while playing
  useEffect(() => {
    if (playing) play();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tonic, scale, chords, voicing, stabs, bass, drums]);
  useEffect(() => audio.setBpm(bpm), [bpm]);
  useEffect(() => {
    if (!playing) setBar(null);
  }, [playing]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <NativeSelect aria-label="Key" value={tonic} onChange={(e) => setTonic(e.target.value)}>
          {COMMON_TONICS.map((n) => (
            <option key={n}>{n}</option>
          ))}
        </NativeSelect>
        <NativeSelect aria-label="Scale" value={scale} onChange={(e) => setScale(e.target.value as ScaleId)}>
          {HARMONY_SCALES.map((s) => (
            <option key={s} value={s}>
              {SCALES[s].name}
            </option>
          ))}
        </NativeSelect>
        <NativeSelect aria-label="Bars" value={chords.length} onChange={(e) => {
          const n = Number(e.target.value);
          setChords((c) => (n > c.length ? [...c, ...c].slice(0, n) : c.slice(0, n)));
        }}>
          <option value={4}>4 bars</option>
          <option value={8}>8 bars</option>
        </NativeSelect>
        <NativeSelect aria-label="Voicing" value={voicing} onChange={(e) => setVoicing(e.target.value as VoicingMode)}>
          {VOICINGS.map((v) => (
            <option key={v.id} value={v.id}>
              {v.label}
            </option>
          ))}
        </NativeSelect>
      </div>
      <ChordSlots tonic={tonic} scale={scale} chords={chords} activeIndex={bar} onChange={(i, c) => setChords((cs) => cs.map((x, j) => (j === i ? c : x)))} />
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="pink" onClick={() => (playing ? audio.stop() : play())}>
          {playing ? <Square /> : <Play />} {playing ? "Stop" : "Play loop"}
        </Button>
        <label className="flex items-center gap-1.5 text-sm font-bold"><input type="checkbox" checked={stabs} onChange={(e) => setStabs(e.target.checked)} /> Off-beat stabs</label>
        <label className="flex items-center gap-1.5 text-sm font-bold"><input type="checkbox" checked={bass} onChange={(e) => setBass(e.target.checked)} /> Root bass</label>
        <label className="flex items-center gap-1.5 text-sm font-bold"><input type="checkbox" checked={drums} onChange={(e) => setDrums(e.target.checked)} /> Drums</label>
        <label className="flex items-center gap-2 text-sm font-bold">
          BPM <input type="number" min={60} max={180} value={bpm} onChange={(e) => setBpm(Math.max(60, Math.min(180, Number(e.target.value) || 120)))} className="h-9 w-16 rounded-lg border border-border bg-secondary px-2" />
        </label>
        <Button
          variant="secondary"
          onClick={() => {
            downloadMidi(eventsToMidiSong(events(), bpm, `Progression in ${tonic} ${SCALES[scale].name}`), `harmonic-cat-progression-${tonic}-${scale}.mid`);
            unlock("midnight-export");
          }}
        >
          <Download /> Export MIDI
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">
        Colours: <span className="text-lime">tonic</span> · <span className="text-[#46b7a5]">predominant</span> · <span className="text-pink">dominant</span> · <span className="text-[#c9a0dc]">modal</span> · <span className="text-[#e07a5f]">chromatic / borrowed</span>
      </p>
    </div>
  );
}
