"use client";
import { useEffect, useState } from "react";
import { Download, Music2, Play, Trash2 } from "lucide-react";
import { audio } from "@/lib/audio/engine";
import { chordIntervalLabels, chordMidi, chordNotes, chordSymbol, CHORD_TYPES, CHORD_TYPE_IDS, ChordType, detectChord } from "@/lib/theory/chords";
import { COMMON_TONICS, noteColor, pcName, pitchClass } from "@/lib/theory/notes";
import { downloadMidi } from "@/lib/midi/writer";
import { useProgress } from "@/store/progress";
import { useSettings } from "@/store/settings";
import { VirtualPiano, KeyMark } from "@/components/piano/VirtualPiano";
import { Button } from "@/components/ui/button";
import { NativeSelect } from "@/components/ui/select";
import { cn } from "@/lib/utils";

const INV_NAMES = ["Root position", "1st inversion", "2nd inversion", "3rd inversion", "4th inversion"];

export function ChordExplorer() {
  const [root, setRoot] = useState("A");
  const [type, setType] = useState<ChordType>("min7");
  const [inv, setInv] = useState(0);
  const [detectMode, setDetectMode] = useState(false);
  const [free, setFree] = useState<number[]>([]);
  const explore = useProgress((s) => s.explore);
  const unlock = useProgress((s) => s.unlock);
  const preferFlats = useSettings((s) => s.preferFlats);
  useEffect(() => explore(`chord:${root}:${type}`), [root, type, explore]);

  const notes = chordNotes(root, type);
  const labels = chordIntervalLabels(type);
  const n = notes.length;
  const voicing = chordMidi(root, type, inv % n, 52);
  const marks: Record<number, KeyMark> = {};
  if (detectMode) free.forEach((m) => (marks[m] = "selected"));
  else voicing.forEach((m, i) => (marks[m] = i === 0 ? "root" : "selected"));
  const detected = detectChord(free, preferFlats ? "flat" : "sharp");

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex rounded-2xl bg-secondary p-1 text-sm font-bold">
          <button className={cn("rounded-xl px-3 py-1.5", !detectMode && "bg-primary text-white")} onClick={() => setDetectMode(false)}>
            Build
          </button>
          <button className={cn("rounded-xl px-3 py-1.5", detectMode && "bg-primary text-white")} onClick={() => setDetectMode(true)}>
            What chord is this?
          </button>
        </div>
        {!detectMode && (
          <>
            <NativeSelect aria-label="Root" value={root} onChange={(e) => setRoot(e.target.value)}>
              {COMMON_TONICS.map((x) => (
                <option key={x}>{x}</option>
              ))}
            </NativeSelect>
            <NativeSelect
              aria-label="Chord type"
              value={type}
              onChange={(e) => {
                setType(e.target.value as ChordType);
                setInv(0);
              }}
            >
              {CHORD_TYPE_IDS.map((t) => (
                <option key={t} value={t}>
                  {CHORD_TYPES[t].name} ({chordSymbol("C", t)})
                </option>
              ))}
            </NativeSelect>
            <Button variant="pink" onClick={() => audio.playChord(voicing)}>
              <Play /> Chord
            </Button>
            <Button variant="secondary" onClick={() => audio.playMelody(voicing, 0.4, 120)}>
              <Music2 /> Arpeggio
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                downloadMidi({ bpm: 120, name: chordSymbol(root, type), tracks: [{ name: chordSymbol(root, type), notes: voicing.map((m) => ({ midi: m, start: 0, duration: 4 })) }] }, `${chordSymbol(root, type)}.mid`);
                unlock("midnight-export");
              }}
            >
              <Download /> MIDI
            </Button>
          </>
        )}
        {detectMode && (
          <Button variant="secondary" onClick={() => setFree([])}>
            <Trash2 /> Clear
          </Button>
        )}
      </div>

      <VirtualPiano
        startMidi={48}
        octaves={2}
        marks={marks}
        keyboardInput
        onPress={(m) => {
          if (detectMode) setFree((f) => (f.includes(m) ? f.filter((x) => x !== m) : [...f, m]));
        }}
      />

      {detectMode ? (
        <div className="rounded-2xl bg-secondary/50 p-4">
          <p className="text-sm text-muted-foreground">Click keys to stack notes. Enharmonic spellings are handled for you.</p>
          <p className="mt-2 text-3xl font-black">
            {detected ? (
              <>
                {detected.symbol}
                {detected.inversion > 0 && <span className="text-lg text-muted-foreground"> / {INV_NAMES[detected.inversion]}</span>}
                <span className="ml-2 text-base font-bold text-muted-foreground">{CHORD_TYPES[detected.type].name}</span>
              </>
            ) : free.length < 3 ? (
              <span className="text-muted-foreground">Add at least 3 notes…</span>
            ) : (
              <span className="text-muted-foreground">No common chord name — that&apos;s a cluster or extended voicing.</span>
            )}
          </p>
          {free.length > 0 && <p className="mt-1 text-sm">{[...free].sort((a, b) => a - b).map((m) => pcName(m, preferFlats ? "flat" : "sharp")).join(" ")}</p>}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl bg-secondary/50 p-4">
            <p className="text-2xl font-black">{chordSymbol(root, type)}</p>
            <p className="text-sm text-muted-foreground">{CHORD_TYPES[type].vibe}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {notes.map((x, i) => (
                <div key={i} className="flex flex-col items-center rounded-xl bg-background px-3 py-2">
                  <span className="text-lg font-black" style={{ color: noteColor(pitchClass(x)) }}>
                    {x}
                  </span>
                  <span className="text-[10px] font-bold text-muted-foreground">{labels[i]}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-2xl bg-secondary/50 p-4">
            <p className="mb-2 text-sm font-bold">Inversions</p>
            <div className="flex flex-col gap-2">
              {Array.from({ length: Math.min(n, 4) }, (_, i) => {
                const v = chordMidi(root, type, i, 52);
                return (
                  <button
                    key={i}
                    onClick={() => {
                      setInv(i);
                      void audio.playChord(v);
                    }}
                    className={cn("flex items-center justify-between rounded-xl bg-background px-3 py-2 text-left text-sm hover:ring-2 hover:ring-primary", inv === i && "ring-2 ring-lime")}
                  >
                    <span className="font-bold">{INV_NAMES[i]}</span>
                    <span className="text-muted-foreground">{v.map((m) => pcName(m, root.includes("b") ? "flat" : "sharp")).join(" – ")}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
