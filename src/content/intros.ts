/**
 * Short animated intro "videos" for each lesson: captioned scenes with piano highlights and sound.
 * Original content (no third-party media). Lessons without a hand-written script get one generated
 * from their concept bullets and demo.
 */
import type { AudioCue } from "@/lib/exercises/types";
import { chordMidi } from "@/lib/theory/chords";
import { scaleMidi } from "@/lib/theory/scales";
import type { Lesson } from "./curriculum";

export interface IntroScene {
  /** English caption (Korean terms are annotated automatically) */
  text: string;
  /** Keys to highlight on the piano (C3–C5 view) */
  keys?: number[];
  /** Small labels drawn on keys, e.g. W / H, R / 3 / 5 */
  badges?: Record<number, string>;
  /** How to sound `keys` when the scene starts */
  play?: "chord" | "melody" | "none";
  /** Custom audio instead of `keys` */
  cue?: AudioCue;
  /** Scene length in ms (default derives from caption length) */
  ms?: number;
}

const range = (from: number, n: number) => Array.from({ length: n }, (_, i) => from + i);
const label = (keys: number[], labels: string[]) => Object.fromEntries(keys.map((k, i) => [k, labels[i]]));
const steps = (keys: number[]) => {
  const out: Record<number, string> = {};
  keys.forEach((k, i) => {
    if (i === 0) return;
    const d = k - keys[i - 1];
    out[k] = d === 1 ? "H" : d === 2 ? "W" : d === 3 ? "W+H" : String(d);
  });
  return out;
};
const whites = [60, 62, 64, 65, 67, 69, 71];
const major = scaleMidi(60, "major");
const aMinor = scaleMidi(57, "minor");

export const INTROS: Record<string, IntroScene[]> = {
  "w1-keyboard": [
    { text: "The piano is just 12 notes repeating over and over. Learn one group of 12 and you know the whole keyboard.", keys: range(60, 12), play: "melody", ms: 6500 },
    { text: "Look at the black keys: they come in groups of 2 and groups of 3. That pattern is your map.", keys: [61, 63, 66, 68, 70], badges: label([61, 63, 66, 68, 70], ["2", "2", "3", "3", "3"]), play: "none" },
    { text: "C always sits just left of the group of 2 black keys. Find C and everything else follows.", keys: [48, 60, 72], badges: label([48, 60, 72], ["C", "C", "C"]), play: "melody" },
    { text: "The white keys spell C D E F G A B — then the pattern starts again on the next C.", keys: [...whites, 72], badges: label([...whites, 72], ["C", "D", "E", "F", "G", "A", "B", "C"]), play: "melody", ms: 6500 },
    { text: "Your turn: you'll be asked to find notes. Any octave counts.", ms: 3500 },
  ],
  "w1-steps": [
    { text: "A semitone is the smallest step: from any key to the very next key, black or white.", keys: [64, 65], badges: label([64, 65], ["E", "F"]), play: "melody" },
    { text: "E to F and B to C are semitones too — there's no black key between them.", keys: [71, 72], badges: label([71, 72], ["B", "C"]), play: "melody" },
    { text: "A whole tone is two semitones: skip one key. C to D skips C#.", keys: [60, 62], badges: { 60: "C", 61: "skip", 62: "D" }, play: "melody" },
    { text: "Hear the difference: semitone (tense, close) versus whole tone (open).", cue: { type: "notes", midis: [64, 65, 64, 66], mode: "melody", beats: 0.6 }, keys: [64, 65, 66], ms: 5000 },
    { text: "Acid basslines live on semitone slides — like A to Bb and back.", cue: { type: "steps", instrument: "bass", bpm: 128, notes: [{ step: 0, midi: 33, len: 2 }, { step: 2, midi: 34, len: 2 }, { step: 4, midi: 33, len: 4 }] }, ms: 4500 },
  ],
  "w1-accidentals": [
    { text: "A sharp (♯) raises a note by one semitone. F# is the black key just right of F.", keys: [65, 66], badges: label([65, 66], ["F", "F#"]), play: "melody" },
    { text: "A flat (♭) lowers a note by one semitone. Bb is the black key just left of B.", keys: [71, 70], badges: label([70, 71], ["Bb", "B"]), play: "melody" },
    { text: "So one black key has two names: C# and Db are enharmonic — same key, same sound.", keys: [61], badges: { 61: "C#/Db" }, play: "melody" },
    { text: "Which name you use depends on the key you're in. The sound never changes.", ms: 3800 },
  ],
  "w1-octaves": [
    { text: "An octave is 12 semitones: the same note name, just higher or lower.", keys: [48, 60], badges: label([48, 60], ["C3", "C4"]), play: "chord" },
    { text: "Octaves blend so well they almost sound like one note.", keys: [57, 69], badges: label([57, 69], ["A3", "A4"]), play: "melody" },
    { text: "Octave numbers change at C. Middle C is C4, which is MIDI note 60.", keys: [60], badges: { 60: "C4 = 60" }, play: "melody" },
    { text: "Disco and house basslines bounce between octaves — the harmony stays put, the energy goes up.", cue: { type: "steps", instrument: "bass", bpm: 124, drums: true, notes: [0, 2, 4, 6, 8, 10, 12, 14].map((s, i) => ({ step: s, midi: i % 2 ? 45 : 33, len: 1 })) }, ms: 6000 },
  ],
  "w1-intervals": [
    { text: "An interval is the distance between two notes, counted in semitones.", keys: [60, 64], badges: label([60, 64], ["C", "E"]), play: "melody" },
    { text: "Minor 3rd = 3 semitones: moody. Major 3rd = 4 semitones: bright.", cue: { type: "notes", midis: [60, 63, 60, 64], mode: "melody", beats: 0.6 }, keys: [60, 63, 64], badges: { 63: "m3", 64: "M3" }, ms: 6000 },
    { text: "Perfect 5th = 7 semitones: strong and stable — the backbone of basslines.", keys: [60, 67], badges: label([60, 67], ["R", "P5"]), play: "chord" },
    { text: "Minor 7th = 10 semitones: funky. The tritone (6) is the most unstable of all.", keys: [60, 66, 70], badges: label([60, 66, 70], ["R", "TT", "m7"]), play: "melody" },
    { text: "Tip: count every key up from the starting note, black and white.", ms: 3500 },
  ],
  "w1-ear-intervals": [
    { text: "Don't count when listening — feel the character of each interval.", ms: 3500 },
    { text: "Perfect 5th: open and powerful.", keys: [55, 62], play: "chord" },
    { text: "Octave: the same note, doubled.", keys: [55, 67], play: "chord" },
    { text: "Major 3rd: happy. Minor 3rd: sad.", cue: { type: "notes", midis: [60, 64, 60, 63], mode: "melody", beats: 0.7 }, ms: 5000 },
    { text: "Replay as often as you like. There's no penalty.", ms: 3000 },
  ],
  "w2-major": [
    { text: "A scale is a set of notes that sound good together. The major scale is the brightest home base.", keys: major, play: "melody", ms: 6500 },
    { text: "Its recipe: W W H W W W H — whole, whole, half, whole, whole, whole, half.", keys: major, badges: steps(major), play: "none", ms: 6500 },
    { text: "Starting on C, that recipe lands only on white keys.", keys: major, badges: label(major, ["C", "D", "E", "F", "G", "A", "B", "C"]), play: "none" },
    { text: "Start on G and you need an F# to keep the recipe. That's why keys have sharps and flats.", keys: scaleMidi(55, "major"), badges: { 66: "F#" }, play: "melody", ms: 6500 },
  ],
  "w2-minor": [
    { text: "The natural minor scale is darker. Its recipe: W H W W H W W.", keys: aMinor, badges: steps(aMinor), play: "melody", ms: 6500 },
    { text: "A minor uses the same white keys as C major — they're relative keys.", keys: aMinor, badges: label(aMinor, ["A", "B", "C", "D", "E", "F", "G", "A"]), play: "none", ms: 5500 },
    { text: "What changes is the home note. Here A feels like home.", cue: { type: "progression", chords: [{ root: "A", type: "min" }, { root: "E", type: "min" }, { root: "A", type: "min" }], bpm: 100 }, ms: 7000 },
    { text: "Most techno and deep house lives in minor. When in doubt, start here.", ms: 3500 },
  ],
  "w2-pentatonic": [
    { text: "Pentatonic scales have just 5 notes. A minor pentatonic: A C D E G.", keys: scaleMidi(57, "minor-pentatonic"), play: "melody", ms: 5500 },
    { text: "Compared to natural minor, it drops B and F — the two notes that create semitone clashes.", keys: aMinor, badges: { 59: "✕", 65: "✕" }, play: "none", ms: 6000 },
    { text: "No clashes means almost any order sounds good. Perfect for riffs and vocal chops.", cue: { type: "notes", midis: [57, 60, 62, 64, 67, 69, 67, 64, 62, 60, 57], mode: "melody", beats: 0.35 }, ms: 6000 },
  ],
  "w2-modes": [
    { text: "Modes are scales that change one note of major or minor to get a new colour.", ms: 4000 },
    { text: "Dorian = minor with a raised 6th. Soulful, the sound of deep house.", keys: scaleMidi(62, "dorian"), badges: { 71: "♮6" }, play: "melody", ms: 6000 },
    { text: "Phrygian = minor with a flat 2nd. Dark and menacing.", keys: scaleMidi(52, "phrygian").filter((m) => m >= 48), badges: { 53: "♭2" }, play: "melody", ms: 6000 },
    { text: "Lydian = major with a raised 4th: dreamy. Mixolydian = major with a flat 7th: funky.", keys: scaleMidi(53, "lydian"), badges: { 59: "♯4" }, play: "melody", ms: 6500 },
    { text: "One changed note, a whole new mood. Listen for that colour note.", ms: 3500 },
  ],
  "w2-degrees": [
    { text: "Number each scale note from 1 to 7. These are scale degrees.", keys: major.slice(0, 7), badges: label(major.slice(0, 7), ["1", "2", "3", "4", "5", "6", "7"]), play: "melody", ms: 6000 },
    { text: "1 is the tonic (home). 5 is the dominant. 7 is the leading tone pulling back to 1.", keys: [60, 67, 71, 72], badges: label([60, 67, 71, 72], ["1", "5", "7", "1"]), play: "melody", ms: 6500 },
    { text: "Degrees work in any key: a '1 – ♭3 – 5' riff is the same shape everywhere.", ms: 4000 },
  ],
  "w2-in-scale": [
    { text: "Before writing a riff, know which notes belong. Everything else is chromatic spice.", keys: scaleMidi(62, "major"), play: "melody", ms: 5500 },
    { text: "D major has F# and C#. F natural would be outside the scale.", keys: [65, 66], badges: { 65: "out", 66: "in" }, play: "melody" },
  ],
  "w2-tonal-center": [
    { text: "The same notes can feel like different keys. What decides it is the tonal centre — the note that feels like home.", ms: 5500 },
    { text: "Bass notes, repetition and phrase endings all point to home.", cue: { type: "steps", instrument: "lead", bpm: 112, notes: [{ step: 0, midi: 69, len: 2 }, { step: 2, midi: 72, len: 2 }, { step: 4, midi: 71, len: 2 }, { step: 6, midi: 67, len: 2 }, { step: 8, midi: 69, len: 4 }, { step: 12, midi: 64, len: 2 }, { step: 14, midi: 69, len: 2 }] }, ms: 6000 },
  ],
  "w3-triads": [
    { text: "A chord is three or more notes played together. The basic chord is a triad: root, 3rd and 5th.", keys: [60, 64, 67], badges: label([60, 64, 67], ["R", "3", "5"]), play: "chord", ms: 6000 },
    { text: "Major triad: a major 3rd (4 semitones) then a minor 3rd (3). Bright.", keys: [60, 64, 67], badges: label([60, 64, 67], ["C", "+4 E", "+3 G"]), play: "chord", ms: 5500 },
    { text: "Minor triad: a minor 3rd (3) then a major 3rd (4). Dark.", keys: [60, 63, 67], badges: label([60, 63, 67], ["C", "+3 Eb", "+4 G"]), play: "chord", ms: 5500 },
    { text: "Only the middle note changed — and the whole mood flipped.", cue: { type: "progression", chords: [{ root: "C", type: "maj" }, { root: "C", type: "min" }], bpm: 90, withBass: false }, ms: 6000 },
  ],
  "w3-dim-aug": [
    { text: "Stack two minor 3rds and you get a diminished triad: tense and unstable.", keys: [59, 62, 65], badges: label([59, 62, 65], ["B", "+3", "+3"]), play: "chord", ms: 5500 },
    { text: "Stack two major 3rds and you get an augmented triad: eerie and floating.", keys: [60, 64, 68], badges: label([60, 64, 68], ["C", "+4", "+4"]), play: "chord", ms: 5500 },
    { text: "Both want to move somewhere else — great for building tension before a drop.", ms: 3800 },
  ],
  "w3-sevenths": [
    { text: "Add one more 3rd on top of a triad and you get a seventh chord.", keys: chordMidi("A", "min7", 0, 57), badges: label(chordMidi("A", "min7", 0, 57), ["R", "m3", "5", "m7"]), play: "chord", ms: 5500 },
    { text: "maj7 = major + major 7th: lush. m7 = minor + minor 7th: smooth. 7 = major + minor 7th: tension.", cue: { type: "progression", chords: [{ root: "C", type: "maj7" }, { root: "A", type: "min7" }, { root: "G", type: "dom7" }], bpm: 110, withBass: false }, ms: 8000 },
    { text: "Am7 to Dm7 — the most deep house move there is.", cue: { type: "progression", chords: [{ root: "A", type: "min7" }, { root: "D", type: "min7" }], bpm: 118 }, ms: 6000 },
  ],
  "w3-inversions": [
    { text: "Same chord, different bottom note. That's an inversion.", keys: [60, 64, 67], badges: label([60, 64, 67], ["C", "E", "G"]), play: "chord" },
    { text: "Root position: the root is lowest.", keys: chordMidi("C", "maj", 0, 60), badges: { 60: "bass" }, play: "chord" },
    { text: "1st inversion: the 3rd is lowest.", keys: chordMidi("C", "maj", 1, 60), badges: { 64: "bass" }, play: "chord" },
    { text: "2nd inversion: the 5th is lowest. Inversions let chords move smoothly.", keys: chordMidi("C", "maj", 2, 55), badges: { 55: "bass" }, play: "chord", ms: 5000 },
  ],
  "w3-voicings": [
    { text: "Voicing is how you arrange a chord's notes: close together, spread out, doubled, or with extra colour notes.", keys: [57, 60, 64, 67, 71], badges: label([57, 60, 64, 67, 71], ["A", "C", "E", "G", "B"]), play: "chord", ms: 6500 },
    { text: "The classic house stab: a minor 9th in a narrow range, with the root left to the bass.", cue: { type: "progression", chords: [{ root: "A", type: "min9" }, { root: "D", type: "min9" }], bpm: 122 }, ms: 7000 },
  ],
  "w3-construction": [
    { text: "Every chord is a root plus a formula. Learn the formula and you can build it on any note.", keys: chordMidi("Eb", "min7", 0, 51), badges: label(chordMidi("Eb", "min7", 0, 51), ["R", "m3", "5", "m7"]), play: "chord", ms: 6000 },
  ],
  "w3-ear-chords": [
    { text: "Major sounds bright. Minor sounds dark.", cue: { type: "progression", chords: [{ root: "C", type: "maj" }, { root: "C", type: "min" }], bpm: 90, withBass: false }, ms: 6000 },
    { text: "Diminished sounds tense. Augmented sounds eerie.", cue: { type: "progression", chords: [{ root: "C", type: "dim" }, { root: "C", type: "aug" }], bpm: 90, withBass: false }, ms: 6000 },
  ],
  "w4-diatonic": [
    { text: "Build a triad on every note of a scale, using only scale notes. You get 7 diatonic chords.", cue: { type: "progression", chords: [{ root: "C", type: "maj" }, { root: "D", type: "min" }, { root: "E", type: "min" }, { root: "F", type: "maj" }, { root: "G", type: "maj" }, { root: "A", type: "min" }, { root: "B", type: "dim" }], bpm: 150, withBass: false }, ms: 9000 },
    { text: "In major: I ii iii IV V vi vii°. Upper case = major, lower case = minor.", ms: 5000 },
  ],
  "w4-functions": [
    { text: "Chords have jobs. Tonic chords feel like home (I, vi).", keys: [60, 64, 67], play: "chord" },
    { text: "Predominant chords move away (ii, IV).", keys: [62, 65, 69], play: "chord" },
    { text: "Dominant chords create tension that wants to resolve home (V, vii°).", cue: { type: "progression", chords: [{ root: "G", type: "dom7" }, { root: "C", type: "maj" }], bpm: 90 }, ms: 6000 },
  ],
  "w4-voice-leading": [
    { text: "Voice leading: move each note of a chord the shortest distance to the next chord.", keys: [60, 64, 67], play: "chord" },
    { text: "C to F: keep C, move E up to F and G up to A. Tiny moves, smooth sound.", keys: [60, 65, 69], badges: { 60: "stay", 65: "+1", 69: "+2" }, play: "chord", ms: 6000 },
    { text: "Smooth voicings make pads glide instead of jump.", cue: { type: "progression", chords: [{ root: "C", type: "maj" }, { root: "F", type: "maj" }, { root: "G", type: "maj" }, { root: "C", type: "maj" }], bpm: 100 }, ms: 9000 },
  ],
  "w5-chord-tones": [
    { text: "Melody notes that belong to the current chord are chord tones. They sound stable.", keys: [57, 60, 64], badges: label([57, 60, 64], ["A", "C", "E"]), play: "chord", ms: 5000 },
    { text: "Other notes add tension. Land on a chord tone at the end of a phrase and it feels resolved.", cue: { type: "notes", midis: [69, 72, 76, 74, 72, 71, 69], mode: "melody", beats: 0.45 }, ms: 6000 },
  ],
  "w5-non-chord": [
    { text: "A passing tone walks between two chord tones by step: C – D – E over a C chord.", keys: [60, 62, 64], badges: { 62: "pass" }, play: "melody" },
    { text: "A neighbour tone steps away and comes back: E – F – E.", keys: [64, 65], badges: { 65: "nbr" }, cue: { type: "notes", midis: [64, 65, 64], mode: "melody", beats: 0.5 } },
    { text: "These are colour, not mistakes.", ms: 3000 },
  ],
  "w5-bassline": [
    { text: "Anchor each chord: play its root on the downbeat.", cue: { type: "steps", instrument: "bass", bpm: 122, drums: true, notes: [{ step: 0, midi: 33, len: 4 }, { step: 8, midi: 41, len: 4 }] }, ms: 5000 },
    { text: "Then add movement: octaves, 5ths and off-beat notes.", cue: { type: "steps", instrument: "bass", bpm: 122, drums: true, notes: [{ step: 0, midi: 33, len: 3 }, { step: 3, midi: 45, len: 1 }, { step: 6, midi: 40, len: 2 }, { step: 8, midi: 41, len: 3 }, { step: 11, midi: 53, len: 1 }, { step: 14, midi: 48, len: 2 }] }, ms: 6000 },
  ],
  "w6-acid": [
    { text: "Acid lines mix the root, octave, ♭3 and ♭7 — plus a sneaky ♭2 for that squelchy, evil tension.", cue: { type: "steps", instrument: "bass", bpm: 130, drums: true, notes: [{ step: 0, midi: 33, len: 1 }, { step: 2, midi: 45, len: 1 }, { step: 3, midi: 34, len: 1 }, { step: 5, midi: 33, len: 1 }, { step: 6, midi: 43, len: 1 }, { step: 8, midi: 36, len: 2 }, { step: 11, midi: 45, len: 1 }, { step: 13, midi: 34, len: 1 }, { step: 14, midi: 33, len: 2 }] }, ms: 7000 },
  ],
  "w6-pedal": [
    { text: "A pedal tone: the bass holds one note while the chords above change.", cue: { type: "progression", chords: [{ root: "A", type: "min" }, { root: "F", type: "maj" }, { root: "G", type: "maj" }, { root: "A", type: "min" }], bpm: 120, withBass: false }, ms: 9000 },
    { text: "Tension builds without the groove ever moving. Perfect for long breakdowns.", ms: 3800 },
  ],
};

/** Intro scenes for a lesson: hand-written if available, otherwise generated from its concept and demo. */
export function introFor(lesson: Lesson, en: (l: Lesson["concept"][number]) => string): IntroScene[] {
  const custom = INTROS[lesson.id];
  if (custom) return custom;
  const scenes: IntroScene[] = lesson.concept.map((c, i) => ({ text: en(c), cue: i === 0 ? lesson.demo?.cue : undefined }));
  if (lesson.demo && lesson.concept.length === 0) scenes.push({ text: en(lesson.demo.label), cue: lesson.demo.cue });
  if (lesson.demo && lesson.concept.length > 0 && !scenes[0].cue) scenes[0].cue = lesson.demo.cue;
  if (lesson.production) scenes.push({ text: en(lesson.production) });
  return scenes;
}

export function youtubeSearchUrl(query: string): string {
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
}

