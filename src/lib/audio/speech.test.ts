import { describe, expect, it } from "vitest";
import { toSpeech } from "./speech";
import { INTROS } from "@/content/intros";

describe("voiceover text cleanup", () => {
  it("reads accidentals and notes", () => {
    expect(toSpeech("F# is the black key just right of F.")).toBe("F sharp is the black key just right of F.");
    expect(toSpeech("C# and Db are enharmonic")).toBe("C sharp and D flat are enharmonic");
    expect(toSpeech("Dorian = minor with a raised 6th (♮6).")).toContain("natural 6");
    expect(toSpeech("a '1 – ♭3 – 5' riff")).toContain("flat 3");
    expect(toSpeech("Middle C is C4, which is MIDI note 60.")).toContain("C 4");
  });
  it("reads step recipes and Roman numerals", () => {
    expect(toSpeech("Its recipe: W W H W W W H — whole")).toContain("whole, whole, half, whole, whole, whole, half");
    expect(toSpeech("In major: I ii iii IV V vi vii°.")).toContain("one major, two minor, three minor, four major, five major, six minor, seven diminished");
    expect(toSpeech("Tonic chords feel like home (I, vi).")).toContain("one major, six minor");
    expect(toSpeech("I think this works")).toBe("I think this works"); // pronoun untouched
  });
  it("reads note ranges", () => {
    expect(toSpeech("E–F and B–C are semitones")).toBe("E to F and B to C are semitones");
    expect(toSpeech("try A → Bb → A")).toBe("try A to B flat to A");
  });
  it("keeps normal words intact", () => {
    expect(toSpeech("Bb is the black key just left of B.")).toBe("B flat is the black key just left of B.");
    expect(toSpeech("A flat (♭) lowers a note")).toContain("lowers a note");
    expect(toSpeech("Basslines bounce")).toBe("Basslines bounce");
  });
  it("produces clean text for every intro caption", () => {
    for (const scenes of Object.values(INTROS))
      for (const s of scenes) {
        const out = toSpeech(s.text);
        expect(out.length).toBeGreaterThan(5);
        expect(out).not.toMatch(/[♯♭♮°#]/);
      }
  });
});
