"use client";
import { useEffect, useMemo, useState } from "react";
import { ArrowDown, ArrowUp, ArrowUpDown, Square } from "lucide-react";
import { audio } from "@/lib/audio/engine";
import { useAudioState } from "@/hooks/useAudio";
import { formulaWH } from "@/lib/exercises/evaluate";
import { diatonicChords } from "@/lib/theory/harmony";
import { chordMidi } from "@/lib/theory/chords";
import { intervalBySemitones } from "@/lib/theory/intervals";
import { COMMON_TONICS, noteColor, pitchClass, placeAbove } from "@/lib/theory/notes";
import { scaleMidi, scaleNotes, SCALES, SCALE_IDS, ScaleId } from "@/lib/theory/scales";
import { useProgress } from "@/store/progress";
import { VirtualPiano, KeyMark } from "@/components/piano/VirtualPiano";
import { Button } from "@/components/ui/button";
import { NativeSelect } from "@/components/ui/select";

export function ScaleExplorer() {
  const [tonic, setTonic] = useState("A");
  const [scale, setScale] = useState<ScaleId>("minor");
  const { playing } = useAudioState();
  const explore = useProgress((s) => s.explore);
  useEffect(() => explore(`scale:${tonic}:${scale}`), [tonic, scale, explore]);

  const def = SCALES[scale];
  const notes = scaleNotes(tonic, scale);
  const tonicMidi = placeAbove(pitchClass(tonic), 48);
  const up = scaleMidi(tonicMidi, scale);
  const pcMarks: Record<number, KeyMark> = {};
  def.steps.forEach((s, i) => (pcMarks[(pitchClass(tonic) + s) % 12] = i === 0 ? "root" : "scale"));
  const chords = useMemo(() => (def.steps.length === 7 ? diatonicChords(tonic, scale, true) : []), [tonic, scale, def.steps.length]);

  const play = (dir: "up" | "down" | "both") => {
    if (playing) return audio.stop();
    const seq = dir === "up" ? up : dir === "down" ? [...up].reverse() : [...up, ...[...up].reverse().slice(1)];
    void audio.playMelody(seq, 0.5, 140);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <NativeSelect aria-label="Tonic" value={tonic} onChange={(e) => setTonic(e.target.value)}>
          {COMMON_TONICS.map((n) => (
            <option key={n}>{n}</option>
          ))}
        </NativeSelect>
        <NativeSelect aria-label="Scale" value={scale} onChange={(e) => setScale(e.target.value as ScaleId)}>
          {SCALE_IDS.map((s) => (
            <option key={s} value={s}>
              {SCALES[s].name}
            </option>
          ))}
        </NativeSelect>
        <Button variant="pink" onClick={() => play("up")}>
          {playing ? <Square /> : <ArrowUp />} Up
        </Button>
        <Button variant="secondary" onClick={() => play("down")}>
          <ArrowDown /> Down
        </Button>
        <Button variant="secondary" onClick={() => play("both")}>
          <ArrowUpDown /> Both
        </Button>
      </div>
      <VirtualPiano startMidi={48} octaves={2} pcMarks={pcMarks} keyboardInput />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="rounded-2xl bg-secondary/50 p-4">
          <p className="text-sm text-muted-foreground">{def.vibe}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {notes.map((n, i) => (
              <div key={i} className="flex flex-col items-center rounded-xl bg-background px-3 py-2">
                <span className="text-lg font-black" style={{ color: noteColor(pitchClass(n)) }}>
                  {n}
                </span>
                <span className="text-[10px] font-bold text-muted-foreground">
                  {i + 1} · {intervalBySemitones(def.steps[i]).short}
                </span>
              </div>
            ))}
          </div>
          <p className="mt-3 text-sm">
            Step pattern: <b className="font-mono">{formulaWH(def.steps)}</b>
          </p>
        </div>
        {chords.length > 0 && (
          <div className="rounded-2xl bg-secondary/50 p-4">
            <p className="mb-2 text-sm font-bold">Chords in this scale (tap to hear)</p>
            <div className="grid grid-cols-4 gap-2 sm:grid-cols-7 md:grid-cols-4 lg:grid-cols-7">
              {chords.map((c) => (
                <button key={c.degree} onClick={() => audio.playNotes(chordMidi(c.root, c.type, 0, 60), 1.4)} className="rounded-xl bg-background px-1 py-2 text-center hover:ring-2 hover:ring-primary">
                  <span className="block font-black">{c.roman}</span>
                  <span className="block text-[11px] text-muted-foreground">{c.symbol}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
