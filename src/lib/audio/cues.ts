"use client";
import type { AudioCue } from "@/lib/exercises/types";
import { chordEvents, drumLoop, NoteEvent, stepsToEvents, voiceProgression } from "@/lib/music/events";
import { chordPitchClasses } from "@/lib/theory/chords";
import { placeAbove } from "@/lib/theory/notes";
import { audio } from "./engine";

export function cueToEvents(cue: AudioCue): { events: NoteEvent[]; bpm: number } {
  switch (cue.type) {
    case "notes": {
      const evs: NoteEvent[] = [];
      if (cue.mode === "chord" || cue.mode === "both") cue.midis.forEach((m) => evs.push({ midi: m, start: 0, duration: 1.8, instrument: "keys" }));
      if (cue.mode === "melody" || cue.mode === "both") {
        const off = cue.mode === "both" ? 2 : 0;
        cue.midis.forEach((m, i) => evs.push({ midi: m, start: off + i * (cue.beats ?? 0.5), duration: (cue.beats ?? 0.5) * 0.9, instrument: "keys" }));
      }
      return { events: evs, bpm: 110 };
    }
    case "progression": {
      const voicings = voiceProgression(cue.chords, "smooth", 60);
      const evs = chordEvents(voicings, 4, "keys");
      if (cue.withBass !== false) cue.chords.forEach((c, i) => evs.push({ midi: placeAbove(chordPitchClasses(c.root, c.type)[0], 36), start: i * 4, duration: 3.8, instrument: "bass", velocity: 0.8 }));
      return { events: evs, bpm: cue.bpm ?? 110 };
    }
    case "steps": {
      const evs = stepsToEvents(cue.notes, cue.instrument);
      const bars = Math.max(1, Math.ceil(Math.max(...cue.notes.map((n) => n.step + n.len), 16) / 16));
      if (cue.drums) evs.push(...drumLoop(bars, "house"));
      return { events: evs, bpm: cue.bpm ?? 120 };
    }
  }
}

export function playCue(cue: AudioCue, opts: { onEnd?: () => void } = {}) {
  const { events, bpm } = cueToEvents(cue);
  return audio.playEvents(events, bpm, { onEnd: opts.onEnd });
}
