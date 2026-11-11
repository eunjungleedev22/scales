import { describe, expect, it } from "vitest";
import {
  analyzeRoman,
  chordMidi,
  chordNotes,
  chordPitchClasses,
  chordIntervalLabels,
  chordToneRole,
  commonTones,
  detectChord,
  diatonicChords,
  intervalBySemitones,
  isChordTone,
  isEnharmonic,
  isInScale,
  midiToNote,
  noteToMidi,
  pcName,
  pitchClass,
  progressionFromDegrees,
  relativeKey,
  scaleDegree,
  scaleNotes,
  scalePitchClasses,
  semitonesBetween,
  spelledInterval,
  transpose,
  voiceLead,
  movementCost,
} from "./index";

describe("pitch classes & enharmonics", () => {
  it("maps note names to pitch classes", () => {
    expect(pitchClass("C")).toBe(0);
    expect(pitchClass("C#")).toBe(1);
    expect(pitchClass("Db")).toBe(1);
    expect(pitchClass("B#")).toBe(0);
    expect(pitchClass("Fb")).toBe(4);
    expect(pitchClass(61)).toBe(1);
    expect(Number.isNaN(pitchClass("H"))).toBe(true);
  });
  it("treats C# and Db as enharmonic", () => {
    expect(isEnharmonic("C#", "Db")).toBe(true);
    expect(isEnharmonic("E#", "F")).toBe(true);
    expect(isEnharmonic("C", "Db")).toBe(false);
  });
  it("names pitch classes with sharps or flats", () => {
    expect(pcName(1)).toBe("C#");
    expect(pcName(1, "flat")).toBe("Db");
    expect(pcName(13)).toBe("C#");
  });
});

describe("MIDI conversion", () => {
  it("converts both ways", () => {
    expect(noteToMidi("C4")).toBe(60);
    expect(noteToMidi("A4")).toBe(69);
    expect(noteToMidi("Db4")).toBe(61);
    expect(midiToNote(60)).toBe("C4");
    expect(midiToNote(61, "flat")).toBe("Db4");
    expect(midiToNote(47)).toBe("B2");
  });
});

describe("intervals", () => {
  it("counts semitones", () => {
    expect(semitonesBetween("C", "E")).toBe(4);
    expect(semitonesBetween("A", "C")).toBe(3);
    expect(semitonesBetween("B", "F")).toBe(6);
    expect(intervalBySemitones(7).short).toBe("P5");
    expect(intervalBySemitones(12).short).toBe("P8");
  });
  it("spells intervals and transposes correctly", () => {
    expect(spelledInterval("C", "Eb")).toBe("3m");
    expect(transpose("E", "3M")).toBe("G#");
    expect(transpose("Db", "5P")).toBe("Ab");
  });
});

describe("scales", () => {
  it("spells D Dorian", () => {
    expect(scaleNotes("D", "dorian")).toEqual(["D", "E", "F", "G", "A", "B", "C"]);
  });
  it("spells flat keys with flats", () => {
    expect(scaleNotes("Eb", "major")).toEqual(["Eb", "F", "G", "Ab", "Bb", "C", "D"]);
    expect(scaleNotes("F", "major")).toContain("Bb");
  });
  it("builds minor, pentatonic and modes", () => {
    expect(scaleNotes("A", "minor")).toEqual(["A", "B", "C", "D", "E", "F", "G"]);
    expect(scaleNotes("A", "minor-pentatonic")).toEqual(["A", "C", "D", "E", "G"]);
    expect(scaleNotes("C", "major-pentatonic")).toEqual(["C", "D", "E", "G", "A"]);
    expect(scaleNotes("E", "phrygian")).toEqual(["E", "F", "G", "A", "B", "C", "D"]);
    expect(scaleNotes("F", "lydian")).toEqual(["F", "G", "A", "B", "C", "D", "E"]);
    expect(scaleNotes("G", "mixolydian")).toEqual(["G", "A", "B", "C", "D", "E", "F"]);
  });
  it("uses pitch classes for membership (enharmonic-safe)", () => {
    expect(isInScale("Gb", "D", "major")).toBe(true); // F# == Gb
    expect(isInScale("F", "D", "major")).toBe(false);
    expect(scalePitchClasses("C#", "major")).toEqual(scalePitchClasses("Db", "major"));
    expect(scaleDegree("E", "C", "major")).toBe(3);
    expect(scaleDegree("Eb", "C", "major")).toBeNull();
  });
  it("finds relative keys", () => {
    expect(relativeKey("C", "major")).toBe("A");
    expect(relativeKey("A", "minor")).toBe("C");
    expect(relativeKey("F#", "minor")).toBe("A");
  });
});

describe("chords", () => {
  it("spells chords", () => {
    expect(chordNotes("A", "min7")).toEqual(["A", "C", "E", "G"]);
    expect(chordNotes("B", "dim")).toEqual(["B", "D", "F"]);
    expect(chordNotes("C", "aug")).toEqual(["C", "E", "G#"]);
    expect(chordNotes("B", "m7b5")).toEqual(["B", "D", "F", "A"]);
    expect(chordNotes("Eb", "maj7")).toEqual(["Eb", "G", "Bb", "D"]);
    expect(chordNotes("G", "dom7")).toEqual(["G", "B", "D", "F"]);
  });
  it("labels chord intervals", () => {
    expect(chordIntervalLabels("min7")).toEqual(["R", "m3", "P5", "m7"]);
    expect(chordIntervalLabels("dim")).toEqual(["R", "m3", "d5"]);
  });
  it("builds inversions", () => {
    expect(chordMidi("C", "maj", 0, 60)).toEqual([60, 64, 67]);
    expect(chordMidi("C", "maj", 1, 60)).toEqual([64, 67, 72]);
    expect(chordMidi("C", "maj", 2, 60)).toEqual([67, 72, 76]);
    expect(chordMidi("A", "min7", 3, 60)).toEqual([67, 69, 72, 76]);
  });
  it("detects chords regardless of spelling and inversion", () => {
    expect(detectChord([57, 60, 64, 67])?.symbol).toBe("Am7");
    const inv = detectChord([64, 67, 72]);
    expect(inv?.symbol).toBe("C");
    expect(inv?.inversion).toBe(1);
    expect(detectChord(["Db", "F", "Ab"], "flat")?.symbol).toBe("Db");
    expect(detectChord(["C#", "E#", "G#"])?.symbol).toBe("C#");
    expect(detectChord([60, 62])).toBeNull();
  });
  it("detects chord tones and roles", () => {
    expect(isChordTone("G", "C", "maj")).toBe(true);
    expect(isChordTone("F", "C", "maj")).toBe(false);
    expect(chordToneRole("Bb", "C", "dom7")).toBe("7th");
    expect(chordToneRole("Eb", "C", "min")).toBe("3rd");
    expect(chordToneRole("D#", "C", "min")).toBe("3rd");
    expect(chordPitchClasses("C#", "maj")).toEqual(chordPitchClasses("Db", "maj"));
  });
  it("voice-leads smoothly", () => {
    const c = chordMidi("C", "maj", 0, 60);
    const f = voiceLead(c, "F", "maj", 55, 76);
    expect(movementCost(c, f)).toBeLessThanOrEqual(3); // C E G -> C F A
    expect(commonTones(chordPitchClasses("C", "maj"), chordPitchClasses("A", "min"))).toEqual([0, 4]);
  });
});

describe("diatonic harmony & roman numerals", () => {
  it("builds diatonic triads in major", () => {
    const romans = diatonicChords("C", "major").map((c) => c.roman);
    expect(romans).toEqual(["I", "ii", "iii", "IV", "V", "vi", "vii°"]);
  });
  it("builds diatonic triads in minor", () => {
    const ch = diatonicChords("A", "minor");
    expect(ch.map((c) => c.roman)).toEqual(["i", "ii°", "III", "iv", "v", "VI", "VII"]);
    expect(ch.map((c) => c.symbol)).toEqual(["Am", "Bdim", "C", "Dm", "Em", "F", "G"]);
  });
  it("builds diatonic sevenths", () => {
    const ch = diatonicChords("C", "major", true);
    expect(ch.map((c) => c.symbol)).toEqual(["Cmaj7", "Dm7", "Em7", "Fmaj7", "G7", "Am7", "Bm7b5"]);
    expect(ch.map((c) => c.roman)).toEqual(["Imaj7", "ii7", "iii7", "IVmaj7", "V7", "vi7", "viiø7"]);
  });
  it("assigns functions", () => {
    const ch = diatonicChords("C", "major");
    expect(ch[0].fn).toBe("tonic");
    expect(ch[3].fn).toBe("predominant");
    expect(ch[4].fn).toBe("dominant");
  });
  it("analyses chords in a key including borrowed chords", () => {
    expect(analyzeRoman("C", "major", "G", "dom7")).toEqual({ roman: "V7", diatonic: true });
    expect(analyzeRoman("C", "major", "Bb", "maj")).toEqual({ roman: "bVII", diatonic: false });
    expect(analyzeRoman("A", "minor", "E", "maj")).toEqual({ roman: "V", diatonic: false });
    expect(analyzeRoman("A", "minor", "F", "maj").roman).toBe("VI");
  });
  it("builds progressions from degrees", () => {
    expect(progressionFromDegrees("A", "minor", [1, 6, 3, 7]).map((c) => c.symbol)).toEqual(["Am", "F", "C", "G"]);
    expect(progressionFromDegrees("D", "dorian", [1, 4]).map((c) => c.symbol)).toEqual(["Dm", "G"]);
  });
});
