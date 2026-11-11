import { describe, expect, it } from "vitest";
import { PPQ, readMidi, vlq, writeMidi } from "./writer";
import { drumLoop, eventsToMidiSong, stepsToEvents } from "@/lib/music/events";

describe("variable-length quantities", () => {
  it("encodes per the SMF spec", () => {
    expect(vlq(0)).toEqual([0x00]);
    expect(vlq(0x40)).toEqual([0x40]);
    expect(vlq(0x7f)).toEqual([0x7f]);
    expect(vlq(0x80)).toEqual([0x81, 0x00]);
    expect(vlq(0x2000)).toEqual([0xc0, 0x00]);
    expect(vlq(0x3fff)).toEqual([0xff, 0x7f]);
    expect(vlq(0x200000)).toEqual([0x81, 0x80, 0x80, 0x00]);
  });
});

describe("MIDI writer", () => {
  it("writes a valid type-1 file with tempo, pitches, onsets and durations", () => {
    const bytes = writeMidi({
      bpm: 124,
      tracks: [{ name: "Chords", notes: [{ midi: 57, start: 0, duration: 4 }, { midi: 60, start: 0, duration: 4 }, { midi: 64, start: 4, duration: 2, velocity: 90 }] }],
    });
    expect(String.fromCharCode(...bytes.slice(0, 4))).toBe("MThd");
    const parsed = readMidi(bytes);
    expect(parsed.format).toBe(1);
    expect(parsed.ntracks).toBe(2); // conductor + 1
    expect(parsed.ppq).toBe(PPQ);
    expect(parsed.tempoMpqn).toBe(Math.round(60_000_000 / 124));
    const notes = parsed.notes.sort((a, b) => a.startTick - b.startTick || a.midi - b.midi);
    expect(notes.map((n) => [n.midi, n.startTick, n.endTick])).toEqual([
      [57, 0, 4 * PPQ],
      [60, 0, 4 * PPQ],
      [64, 4 * PPQ, 6 * PPQ],
    ]);
    expect(notes[2].velocity).toBe(90);
  });

  it("orders note-off before note-on at the same tick (repeated notes stay separate)", () => {
    const bytes = writeMidi({ bpm: 120, tracks: [{ name: "Bass", channel: 1, notes: [{ midi: 45, start: 0, duration: 1 }, { midi: 45, start: 1, duration: 1 }] }] });
    const parsed = readMidi(bytes);
    const track = parsed.order[1].filter(([, s]) => s !== 0xff);
    expect(track).toEqual([
      [0, 0x91],
      [PPQ, 0x81],
      [PPQ, 0x91],
      [2 * PPQ, 0x81],
    ]);
    expect(parsed.notes).toHaveLength(2);
    expect(parsed.notes.every((n) => n.endTick - n.startTick === PPQ)).toBe(true);
  });

  it("delta times are non-negative and events sorted even if input is unsorted", () => {
    const bytes = writeMidi({ bpm: 128, tracks: [{ name: "Lead", notes: [{ midi: 72, start: 3, duration: 0.5 }, { midi: 70, start: 0.25, duration: 0.25 }] }] });
    const parsed = readMidi(bytes);
    const ticks = parsed.order[1].map(([t]) => t);
    expect([...ticks].sort((a, b) => a - b)).toEqual(ticks);
    expect(parsed.notes.find((n) => n.midi === 70)?.startTick).toBe(PPQ / 4);
  });

  it("exports a full project: bass, drums on channel 10", () => {
    const events = [
      ...stepsToEvents([{ step: 0, midi: 45, len: 2 }, { step: 6, midi: 52, len: 1 }], "bass"),
      ...drumLoop(1),
    ];
    const song = eventsToMidiSong(events, 125);
    const parsed = readMidi(writeMidi(song));
    const drums = parsed.notes.filter((n) => n.channel === 9);
    expect(drums.filter((n) => n.midi === 36)).toHaveLength(4);
    const bass = parsed.notes.filter((n) => n.channel === 1);
    expect(bass.map((n) => [n.midi, n.startTick, n.endTick - n.startTick])).toEqual([
      [45, 0, PPQ / 2],
      [52, (6 * PPQ) / 4, PPQ / 4],
    ]);
  });
});

import { projectEvents } from "@/lib/music/project";
import { DEFAULT_PROJECT } from "@/store/lab";

describe("Composition Lab export", () => {
  it("exports the default project with chords, bass and drums, preserving tempo", () => {
    const evs = projectEvents(DEFAULT_PROJECT);
    const parsed = readMidi(writeMidi(eventsToMidiSong(evs.filter((e) => e.instrument !== "click"), DEFAULT_PROJECT.bpm)));
    expect(parsed.tempoMpqn).toBe(Math.round(60_000_000 / DEFAULT_PROJECT.bpm));
    expect(parsed.notes.filter((n) => n.channel === 1)).toHaveLength(DEFAULT_PROJECT.bass.length);
    expect(parsed.notes.filter((n) => n.channel === 9 && n.midi === 36)).toHaveLength(16); // 4 bars of 4 kicks
    expect(parsed.notes.every((n) => n.endTick > n.startTick)).toBe(true);
    // chord onsets land on bar lines
    const chordStarts = [...new Set(parsed.notes.filter((n) => n.channel === 0).map((n) => n.startTick))];
    expect(chordStarts).toEqual([0, 4 * PPQ, 8 * PPQ, 12 * PPQ]);
  });
});
