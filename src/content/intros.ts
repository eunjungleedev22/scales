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
  /** Big on-screen key idea (e.g. "Semitone = 1 key") */
  head?: string;
  /** English caption, also spoken by the voiceover (Korean terms are annotated automatically) */
  text: string;
  /** Final recap scene */
  recap?: boolean;
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

const bass = (notes: Array<[number, number, number]>, bpm = 124, drums = true): AudioCue => ({ type: "steps", instrument: "bass", bpm, drums, notes: notes.map(([step, midi, len]) => ({ step, midi, len })) });
const prog = (chords: Array<[string, string]>, bpm = 110, withBass = true): AudioCue =>
  ({ type: "progression", chords: chords.map(([root, type]) => ({ root, type })), bpm, withBass }) as AudioCue;
const mel = (midis: number[], beats = 0.5): AudioCue => ({ type: "notes", midis, mode: "melody", beats });
/** Off-beat chord stabs (keys) on a 16-step bar */
const stabs = (chord: number[], bpm = 122): AudioCue => ({ type: "steps", instrument: "keys", bpm, drums: true, notes: [2, 6, 10, 14].flatMap((step) => chord.map((midi) => ({ step, midi, len: 1 }))) });
const remember = (text: string): IntroScene => ({ head: "Remember", text, recap: true });

export const INTROS: Record<string, IntroScene[]> = {
  /* ------------------------------ World 1 ------------------------------ */
  "w1-keyboard": [
    { head: "Only 12 notes", text: "Every piano, every synth and every piano roll is built from just 12 notes that repeat. Learn one set of 12 and you know the whole keyboard.", keys: range(60, 12), play: "melody", ms: 7000 },
    { head: "2 black, then 3", text: "Look at the black keys. They come in a group of two, then a group of three, over and over. That pattern is your map.", keys: [61, 63, 66, 68, 70], badges: label([61, 63, 66, 68, 70], ["2", "2", "3", "3", "3"]), play: "none" },
    { head: "C = left of the two", text: "C is always the white key just to the left of the group of two black keys. Find that, and you've found C everywhere.", keys: [48, 60, 72], badges: label([48, 60, 72], ["C", "C", "C"]), play: "melody" },
    { head: "C D E F G A B", text: "From C, the white keys spell C, D, E, F, G, A, B. Then the next C starts the pattern again.", keys: [...whites, 72], badges: label([...whites, 72], ["C", "D", "E", "F", "G", "A", "B", "C"]), play: "melody", ms: 7000 },
    { head: "Pitch vs pitch class", text: "Every C, in any octave, belongs to the same pitch class. One specific C, like middle C, is a pitch. Musicians switch between the two all the time.", keys: [48, 60, 72], badges: { 48: "C3", 60: "C4", 72: "C5" }, play: "chord" },
    remember("Two black keys, then three. C sits left of the two. The white keys go C to B, then repeat."),
  ],
  "w1-steps": [
    { head: "Semitone = 1 key", text: "A semitone is the smallest step in music: from any key to the very next key, black or white, with nothing in between.", keys: [64, 65], badges: label([64, 65], ["E", "F"]), play: "melody" },
    { head: "Hidden semitones", text: "Most white keys have a black key between them. But E and F, and B and C, don't. So those white keys are already a semitone apart.", keys: [64, 65, 71, 72], badges: label([64, 65, 71, 72], ["E", "F", "B", "C"]), play: "none" },
    { head: "Whole tone = 2 keys", text: "A whole tone is two semitones, so you skip one key. C to D is a whole tone, because C sharp sits in between.", keys: [60, 62], badges: { 60: "C", 61: "skip", 62: "D" }, play: "melody" },
    { head: "Hear the difference", text: "First a semitone, which sounds tight and tense. Then a whole tone, which sounds more open.", keys: [64, 65, 66], cue: mel([64, 65, 64, 66], 0.6) },
    { head: "Why it matters", text: "Every scale is a recipe of semitones and whole tones. And acid basslines love semitone slides, like A to B flat and back.", cue: bass([[0, 33, 2], [2, 34, 2], [4, 33, 4], [8, 33, 2], [10, 34, 2], [12, 33, 4]], 128) },
    remember("Semitone: the very next key. Whole tone: skip one key. E to F and B to C are the sneaky white-key semitones."),
  ],
  "w1-accidentals": [
    { head: "Sharp = up one", text: "A sharp raises a note by one semitone. F sharp is the key just to the right of F, which here is a black key.", keys: [65, 66], badges: label([65, 66], ["F", "F#"]), play: "melody" },
    { head: "Flat = down one", text: "A flat lowers a note by one semitone. B flat is the key just to the left of B.", keys: [71, 70], badges: label([70, 71], ["Bb", "B"]), play: "melody" },
    { head: "Two names, one key", text: "So every black key has two names. The key between C and D is both C sharp and D flat. Same key, same sound. We call these enharmonic notes.", keys: [61], badges: { 61: "C#=Db" }, play: "melody", ms: 7000 },
    { head: "One letter each", text: "Inside a scale, every letter name appears exactly once. That's why F major uses B flat, never A sharp. Like words that sound alike but are spelled differently, context decides the name." },
    remember("Sharp: one key up. Flat: one key down. Each letter appears once per scale, so the key decides the spelling."),
  ],
  "w1-octaves": [
    { head: "Same note, higher", text: "An octave is twelve semitones. Jump from one C to the next C up and you land on the same note name, just higher.", keys: [48, 60], badges: label([48, 60], ["C3", "C4"]), play: "melody" },
    { head: "Why they blend", text: "The higher note vibrates exactly twice as fast, so the two notes blend almost into one. That's why octaves sound so stable.", keys: [57, 69], play: "chord" },
    { head: "Octave numbers", text: "Octaves are numbered, and the number changes at every C. Middle C is C4, which is MIDI note 60. Ableton calls the same note C3.", keys: [60], badges: { 60: "C4 = 60" }, play: "melody", ms: 7000 },
    { head: "Octave bass", text: "Disco and house basslines bounce between a note and its octave. The harmony stays put, but the groove gets energy.", cue: bass([0, 2, 4, 6, 8, 10, 12, 14].map((st, i) => [st, i % 2 ? 45 : 33, 1] as [number, number, number])) },
    remember("Octave: twelve semitones, same note name. Middle C is C4, MIDI note 60."),
  ],
  "w1-intervals": [
    { head: "Interval = distance", text: "An interval is the distance between two notes. Every interval has two parts: a number and a quality.", keys: [60, 64], badges: label([60, 64], ["C", "E"]), play: "melody" },
    { head: "The number: count letters", text: "For the number, count letter names, including both ends. C up to E is C, D, E: three letters, so it's a third.", keys: [60, 62, 64], badges: label([60, 62, 64], ["1", "2", "3"]), play: "melody" },
    { head: "The quality: use the major scale", text: "For the quality, treat the bottom note as home. If the top note is in that major scale, the interval is major. Unisons, fourths, fifths and octaves are called perfect instead.", keys: [60, 64, 65, 67], badges: { 64: "M3", 65: "P4", 67: "P5" }, play: "melody", ms: 8500 },
    { head: "One semitone smaller = minor", text: "Shrink a major interval by one semitone and it becomes minor. C to E is a major third, bright. C to E flat is a minor third, moody.", keys: [60, 63, 64], badges: { 63: "m3", 64: "M3" }, cue: mel([60, 64, 60, 63], 0.7), ms: 8000 },
    { head: "Quick check: semitones", text: "As a shortcut, count semitones: three is a minor third, four a major third, five a perfect fourth, seven a perfect fifth, and ten a minor seventh.", keys: [60, 63, 64, 65, 67, 70], badges: { 63: "3", 64: "4", 65: "5", 67: "7", 70: "10" }, play: "none", ms: 8000 },
    { head: "Flip it over", text: "Turn an interval upside down and the two numbers add up to nine: a third becomes a sixth, a fifth becomes a fourth. Major flips to minor, and perfect stays perfect.", keys: [60, 64, 72], badges: { 60: "C", 64: "E", 72: "C" }, play: "melody", ms: 8500 },
    remember("Number: count the letters. Quality: compare with the bottom note's major scale. A major interval shrunk by a semitone becomes minor."),
  ],
  "w1-ear-intervals": [
    { head: "Feel, don't count", text: "When you listen, don't try to count. Intervals fall into three families of sound. Learn the families first." },
    { head: "Perfect consonances", text: "Unisons, fifths and octaves are perfect consonances: open, hollow and completely stable.", keys: [55, 62, 67], play: "chord" },
    { head: "Imperfect consonances", text: "Thirds and sixths are imperfect consonances: still pleasant, but warmer and full of mood. Major sounds bright, minor sounds darker.", cue: mel([60, 64, 60, 63], 0.8) },
    { head: "Dissonances", text: "Seconds, sevenths and the tritone are dissonances. They're not wrong: they create tension that wants to move to a consonance. Hear this tritone open out and settle.", cue: { type: "steps", instrument: "keys", bpm: 100, notes: [{ step: 0, midi: 65, len: 6 }, { step: 0, midi: 71, len: 6 }, { step: 8, midi: 64, len: 8 }, { step: 8, midi: 72, len: 8 }] }, ms: 9000 },
    remember("Perfect: unisons, fifths, octaves. Imperfect: thirds and sixths. Dissonant: seconds, sevenths and the tritone, which push to resolve."),
  ],

  /* ------------------------------ World 2 ------------------------------ */
  "w2-major": [
    { head: "Scale = note palette", text: "A scale is a set of notes that work together, like a colour palette for a track. The major scale is the bright, happy palette.", keys: major, play: "melody", ms: 7000 },
    { head: "The recipe", text: "Every major scale follows the same recipe of steps: whole, whole, half, whole, whole, whole, half.", keys: major, badges: steps(major), play: "none", ms: 7000 },
    { head: "Start on C", text: "Start on C and follow the recipe, and you only land on white keys. That's why C major has no sharps or flats.", keys: major, badges: label(major, ["C", "D", "E", "F", "G", "A", "B", "C"]), play: "none" },
    { head: "Start anywhere", text: "Start on G instead, and the recipe forces one black key, F sharp. That's why different keys need different sharps and flats.", keys: scaleMidi(55, "major"), badges: { 66: "F#" }, play: "melody", ms: 7500 },
    remember("Major scale: whole, whole, half, whole, whole, whole, half. The same recipe works from any starting note."),
  ],
  "w2-minor": [
    { head: "The darker palette", text: "The natural minor scale is the darker sibling of major. Its recipe is whole, half, whole, whole, half, whole, whole.", keys: aMinor, badges: steps(aMinor), play: "melody", ms: 7500 },
    { head: "Major with three notes lowered", text: "Another way to see it: take a major scale and lower the third, sixth and seventh notes. C major becomes C minor, with E flat, A flat and B flat.", keys: scaleMidi(60, "minor"), badges: { 63: "♭3", 68: "♭6", 70: "♭7" }, play: "melody", ms: 8500 },
    { head: "Same notes as C major", text: "A minor uses exactly the same white keys as C major. We call them relative keys. What changes is which note feels like home.", keys: aMinor, badges: label(aMinor, ["A", "B", "C", "D", "E", "F", "G", "A"]), play: "none", ms: 7000 },
    { head: "No leading tone", text: "In natural minor, the seventh note sits a whole step below home, so it doesn't pull upward much. Raise it by a semitone and you get harmonic minor, with a strong pull back home.", keys: [67, 68, 69], badges: { 67: "G", 68: "G#", 69: "A" }, cue: mel([67, 69, 68, 69], 0.6), ms: 9000 },
    { head: "Home decides the mood", text: "When A feels like home, these notes sound moody. That's why most techno and deep house lives in minor.", cue: prog([["A", "min"], ["E", "min"], ["A", "min"]], 100), ms: 7000 },
    remember("Minor is major with a lowered third, sixth and seventh. Raise the seventh for a stronger pull home."),
  ],
  "w2-pentatonic": [
    { head: "Five safe notes", text: "A pentatonic scale has just five notes. A minor pentatonic is A, C, D, E and G.", keys: scaleMidi(57, "minor-pentatonic"), play: "melody" },
    { head: "Two notes removed", text: "It's the natural minor scale with two notes taken out, B and F. Those are exactly the notes that cause harsh semitone clashes.", keys: aMinor, badges: { 59: "✕", 65: "✕" }, play: "none", ms: 7000 },
    { head: "Nothing clashes", text: "With the clashes gone, almost any order of these notes sounds good. Listen.", cue: mel([57, 60, 62, 64, 67, 69, 67, 64, 62, 60, 57], 0.35) },
    { head: "Use it for", text: "That's why producers reach for it for riffs, vocal chops and acid lines." },
    remember("Minor pentatonic: one, flat three, four, five, flat seven. Five notes, no clashes."),
  ],
  "w2-modes": [
    { head: "One note changes the mood", text: "A mode is a scale where one note is changed from major or minor. That single note changes the whole mood." },
    { head: "Dorian: minor + raised 6th", text: "Dorian is natural minor with a raised sixth. That one brighter note makes it soulful: the classic deep house sound.", keys: scaleMidi(62, "dorian"), badges: { 71: "♮6" }, play: "melody", ms: 7500 },
    { head: "Phrygian: minor + flat 2nd", text: "Phrygian is natural minor with a lowered second. That note sits one semitone above home, which sounds dark and menacing. Think warehouse techno.", keys: scaleMidi(52, "phrygian"), badges: { 53: "♭2" }, play: "melody", ms: 8000 },
    { head: "Lydian: major + raised 4th", text: "Lydian is the major scale with a raised fourth. It sounds dreamy and floating.", keys: scaleMidi(53, "lydian"), badges: { 59: "♯4" }, play: "melody", ms: 7000 },
    { head: "Mixolydian: major + flat 7th", text: "Mixolydian is the major scale with a lowered seventh. It sounds funky and bluesy, like disco house.", keys: scaleMidi(55, "mixolydian"), badges: { 65: "♭7" }, play: "melody", ms: 7000 },
    remember("Listen for the colour note: Dorian's raised sixth, Phrygian's flat second, Lydian's sharp fourth, Mixolydian's flat seventh."),
  ],
  "w2-degrees": [
    { head: "Number the notes", text: "Number each note of a scale from one to seven. These numbers are called scale degrees.", keys: major.slice(0, 7), badges: label(major.slice(0, 7), ["1", "2", "3", "4", "5", "6", "7"]), play: "melody", ms: 7000 },
    { head: "Every degree has a name", text: "Each degree also has a name: tonic, supertonic, mediant, subdominant, dominant, submediant, and leading tone.", keys: major.slice(0, 7), badges: label(major.slice(0, 7), ["T", "ST", "M", "SD", "D", "SM", "LT"]), play: "none", ms: 7500 },
    { head: "Notes have gravity", text: "Scale degrees pull towards home, a bit like gravity. The leading tone pulls hardest: seven rises to one. Four tends to fall to three, and six tends to fall to five.", keys: [64, 65, 67, 69, 71, 72], badges: { 71: "7↑", 72: "1", 65: "4↓", 64: "3", 69: "6↓", 67: "5" }, cue: mel([71, 72, 65, 64, 69, 67], 0.6), ms: 10000 },
    { head: "The stable three", text: "The strongest resting points are one, three and five. Together they form the tonic chord, which is why ending on them feels settled.", keys: [60, 64, 67], badges: label([60, 64, 67], ["1", "3", "5"]), play: "chord" },
    remember("One is home. Seven pulls up to it, four falls to three, six falls to five. One, three and five are the safe landing spots."),
  ],
  "w2-in-scale": [
    { head: "Know your palette", text: "Before writing a riff, know which notes belong to your key. Everything else is chromatic spice, to use on purpose.", keys: scaleMidi(62, "major"), play: "melody", ms: 6500 },
    { head: "The key signature", text: "A key signature is the list of sharps or flats a key always uses. D major always has F sharp and C sharp, so a plain F would sound out of place.", keys: [65, 66, 73], badges: { 65: "out", 66: "F#", 73: "C#" }, play: "melody", ms: 8000 },
    remember("Check the key's sharps or flats first. Outside notes aren't mistakes, but use them deliberately."),
  ],
  "w2-tonal-center": [
    { head: "Where is home?", text: "The same notes can feel like different keys. What decides it is the tonal centre: the note that feels like home." },
    { head: "Hear it", text: "This phrase keeps circling back to A and ends there. So A feels like home.", cue: { type: "steps", instrument: "lead", bpm: 112, notes: [{ step: 0, midi: 69, len: 2 }, { step: 2, midi: 72, len: 2 }, { step: 4, midi: 71, len: 2 }, { step: 6, midi: 67, len: 2 }, { step: 8, midi: 69, len: 4 }, { step: 12, midi: 64, len: 2 }, { step: 14, midi: 69, len: 2 }] } },
    { head: "How producers set home", text: "In a track, you create home with the bass note on the downbeat, with repetition, and with where your phrases end." },
    remember("Home comes from the bass, from repetition and from phrase endings, not just from which notes you use."),
  ],

  /* ------------------------------ World 3 ------------------------------ */
  "w3-triads": [
    { head: "Chord = notes together", text: "A chord is three or more notes played at the same time. The basic chord is a triad: a root, a third and a fifth.", keys: [60, 64, 67], badges: label([60, 64, 67], ["R", "3", "5"]), play: "chord" },
    { head: "Stack every other key", text: "Build it by stacking thirds: start on a white key, skip one, take the next, skip one, take the next. C, E, G.", keys: [60, 64, 67], badges: { 60: "C", 62: "skip", 64: "E", 65: "skip", 67: "G" }, play: "melody", ms: 7000 },
    { head: "Major = 4 + 3", text: "A major triad stacks a major third, four semitones, then a minor third, three semitones. It sounds bright.", keys: [60, 64, 67], badges: label([60, 64, 67], ["C", "+4", "+3"]), play: "chord", ms: 6500 },
    { head: "Minor = 3 + 4", text: "A minor triad flips it: a minor third first, then a major third. It sounds dark.", keys: [60, 63, 67], badges: label([60, 63, 67], ["C", "+3", "+4"]), play: "chord" },
    { head: "Four qualities", text: "Stacking two thirds gives four possible triads: major, minor, diminished and augmented. Major is by far the most common, and augmented is rare.", cue: prog([["C", "maj"], ["C", "min"], ["C", "dim"], ["C", "aug"]], 110, false), ms: 11000 },
    remember("Major is four plus three. Minor is three plus four. The third decides the mood."),
  ],
  "w3-dim-aug": [
    { head: "Diminished = 3 + 3", text: "Stack two minor thirds and you get a diminished triad. It sounds tense and unstable.", keys: [59, 62, 65], badges: label([59, 62, 65], ["B", "+3", "+3"]), play: "chord" },
    { head: "Augmented = 4 + 4", text: "Stack two major thirds and you get an augmented triad. It sounds eerie, like it's floating.", keys: [60, 64, 68], badges: label([60, 64, 68], ["C", "+4", "+4"]), play: "chord" },
    { head: "Built for tension", text: "Both want to move somewhere else. Hear B diminished pull towards C major.", cue: prog([["B", "dim"], ["C", "maj"]], 90, false), ms: 6500 },
    remember("Diminished is three plus three. Augmented is four plus four. Both create tension."),
  ],
  "w3-sevenths": [
    { head: "Add one more third", text: "Stack one more third on top of a triad and you get a seventh chord. It adds richness and colour.", keys: chordMidi("A", "min7", 0, 57), badges: label(chordMidi("A", "min7", 0, 57), ["R", "3", "5", "7"]), play: "chord" },
    { head: "The main flavours", text: "Major seventh sounds lush. Minor seventh sounds smooth. Dominant seventh, a major triad with a minor seventh, sounds tense and funky. Half-diminished sounds dark and unstable.", cue: prog([["C", "maj7"], ["A", "min7"], ["G", "dom7"], ["B", "m7b5"]], 100, false), ms: 13000 },
    { head: "Name vs job", text: "A chord symbol like D minor seven tells you which notes to play. A Roman numeral like two seven tells you its job in the key, and where it's likely to go next." },
    { head: "The deep house move", text: "A minor seven to D minor seven. Two smooth chords that share notes: a classic deep house sound.", cue: prog([["A", "min7"], ["D", "min7"], ["A", "min7"], ["D", "min7"]], 118), ms: 9000 },
    remember("A seventh chord is a triad plus a third. The dominant seventh pulls home; minor sevenths are the deep house workhorse."),
  ],
  "w3-inversions": [
    { head: "Same notes, new order", text: "An inversion uses the same chord notes but changes which one is at the bottom.", keys: [60, 64, 67], badges: label([60, 64, 67], ["C", "E", "G"]), play: "chord" },
    { head: "Root position", text: "In root position, the root is the lowest note: C, E, G.", keys: chordMidi("C", "maj", 0, 60), badges: { 60: "bottom" }, play: "chord" },
    { head: "First inversion", text: "Move C up an octave, and E becomes the lowest note. That's the first inversion. It's still a C chord.", keys: chordMidi("C", "maj", 1, 60), badges: { 64: "bottom" }, play: "chord", ms: 6500 },
    { head: "Second inversion", text: "Move E up as well, and G is at the bottom. That's the second inversion.", keys: chordMidi("C", "maj", 2, 55), badges: { 55: "bottom" }, play: "chord" },
    { head: "Shorthand: six and six-four", text: "Classical musicians name inversions by the intervals above the bass note: first inversion is a six chord, second inversion a six-four chord." },
    { head: "Why bother?", text: "Inversions let chords connect smoothly, and they make the bass line melodic instead of jumping between roots." },
    remember("The lowest note names the inversion: the root for root position, the third for first inversion, the fifth for second."),
  ],
  "w3-voicings": [
    { head: "Voicing = arrangement", text: "A voicing is how you arrange a chord's notes: close together, spread out, doubled, or with extra colour notes added.", keys: [57, 60, 64, 67, 71], badges: label([57, 60, 64, 67, 71], ["A", "C", "E", "G", "B"]), play: "chord", ms: 6500 },
    { head: "Close vs open", text: "This is an open voicing of C major: C, G and E spread wide. It sounds bigger and clearer than C, E, G packed together.", keys: [48, 55, 64], badges: label([48, 55, 64], ["C", "G", "E"]), play: "chord", ms: 7000 },
    { head: "The house stab", text: "The classic house stab is a minor ninth chord in a narrow range, with the root left out because the bassline already plays it.", cue: prog([["A", "min9"], ["D", "min9"]], 122), ms: 8000 },
    remember("Same chord, many voicings. Leave the root to the bass and keep stabs compact."),
  ],
  "w3-construction": [
    { head: "Root + formula", text: "Every chord is just a root note plus a formula. Learn the formula once, and you can build the chord on any note." },
    { head: "Example: minor seventh", text: "A minor seventh is root, minor third, fifth and minor seventh. Built on E flat, that's E flat, G flat, B flat and D flat.", keys: chordMidi("Eb", "min7", 0, 51), badges: label(chordMidi("Eb", "min7", 0, 51), ["R", "m3", "5", "m7"]), play: "chord", ms: 8000 },
    remember("Don't memorise shapes, memorise formulas. Count semitones up from the root."),
  ],
  "w3-ear-chords": [
    { head: "Major: bright", text: "A major chord sounds bright and settled.", keys: [60, 64, 67], play: "chord" },
    { head: "Minor: dark", text: "A minor chord sounds darker and more emotional.", keys: [60, 63, 67], play: "chord" },
    { head: "Diminished: tense", text: "A diminished chord sounds tense, like it needs to go somewhere.", keys: [60, 63, 66], play: "chord" },
    { head: "Augmented: eerie", text: "An augmented chord sounds eerie and unresolved.", keys: [60, 64, 68], play: "chord" },
    remember("Bright, dark, tense, eerie. Listen for the mood first, then name it."),
  ],

  /* ------------------------------ World 4 ------------------------------ */
  "w4-diatonic": [
    { head: "Chords from a scale", text: "Take a scale and build a triad on every note, using only notes from that scale. You get seven chords that belong together. These are the diatonic chords.", cue: prog([["C", "maj"], ["D", "min"], ["E", "min"], ["F", "maj"], ["G", "maj"], ["A", "min"], ["B", "dim"]], 150, false), ms: 10000 },
    { head: "The major-key pattern", text: "In every major key, the chords follow the same pattern: I ii iii IV V vi vii°. Capitals are major, lower case is minor, and the small circle means diminished.", ms: 9000 },
    { head: "The minor-key pattern", text: "In a minor key the pattern is i ii° III iv v VI VII. Classical music usually raises the seventh note to make the five chord major, so it pulls home. Pop and electronic music often keep the minor five.", ms: 11000 },
    { head: "Same names as the notes", text: "Each chord takes its root's name: the tonic chord, the subdominant chord, the dominant chord, and so on." },
    remember("Seven notes give seven chords. In major they go: I ii iii IV V vi vii°."),
  ],
  "w4-roman": [
    { head: "Numbers, not names", text: "Roman numerals name a chord by its position in the key, not by its letter. That way a progression works in any key." },
    { head: "Example", text: "A minor, F, C, G in A minor is i VI III VII. Move it to E minor and it's the same numbers with new letters.", cue: prog([["A", "min"], ["F", "maj"], ["C", "maj"], ["G", "maj"]]), ms: 10000 },
    remember("Capital numerals are major, lower case are minor, and a small circle means diminished."),
  ],
  "w4-functions": [
    { head: "Chords have jobs", text: "Every chord in a key has a job. Some feel like home, some move away, and some build tension." },
    { head: "Tonic = home", text: "Tonic chords, the one and the six, feel like home. You can rest on them.", keys: [60, 64, 67], play: "chord" },
    { head: "Predominant = leaving", text: "Predominant chords, the two and the four, move away from home and get things going.", keys: [62, 65, 69], play: "chord" },
    { head: "Dominant = tension", text: "Dominant chords, the five and the seven, build tension that wants to fall back home. Hear G seven resolve to C.", cue: prog([["G", "dom7"], ["C", "maj"]], 90), ms: 7500 },
    { head: "Cadences = punctuation", text: "A cadence is how a phrase ends, like punctuation. Five to one is an authentic cadence: a full stop.", cue: prog([["G", "maj"], ["C", "maj"]], 90), ms: 7000 },
    { head: "Comma, surprise, amen", text: "Ending on the five chord is a half cadence, like a comma. Five to six is a deceptive cadence, a surprise. Four to one is a plagal cadence, the soft amen ending.", cue: prog([["C", "maj"], ["G", "maj"], ["G", "maj"], ["A", "min"], ["F", "maj"], ["C", "maj"]], 110), ms: 16000 },
    remember("Home, away, tension, home. Cadences are the punctuation: full stop, comma, surprise and amen."),
  ],
  "w4-common": [
    { head: "A few loops rule", text: "Thousands of tracks use the same few progressions. Learn them as numbers and you can play them in any key." },
    { head: "The epic minor loop", text: "i VI III VII. In A minor that's A minor, F, C, G. Big and emotional.", cue: prog([["A", "min"], ["F", "maj"], ["C", "maj"], ["G", "maj"]], 118), ms: 10000 },
    { head: "The pop loop", text: "I V vi IV. In C that's C, G, A minor, F.", cue: prog([["C", "maj"], ["G", "maj"], ["A", "min"], ["F", "maj"]], 118), ms: 10000 },
    remember("Learn progressions as numbers, then drop them into any key."),
  ],
  "w4-voice-leading": [
    { head: "Take the shortest path", text: "Voice leading means moving each note of a chord the shortest distance to the next chord.", keys: [60, 64, 67], play: "chord" },
    { head: "Keep what's shared", text: "Rule one: if two chords share a note, keep it in the same voice. From C to F, keep the C, move E up to F, and move G up to A.", keys: [60, 65, 69], badges: { 60: "stay", 65: "+1", 69: "+2" }, play: "chord", ms: 8000 },
    { head: "Avoid parallel fifths", text: "Rule two: two voices shouldn't move together in parallel fifths or octaves. It makes separate parts blur into one, so move them in different directions instead." },
    { head: "Hear it glide", text: "Here's C, F, G and back to C, voice-led. Notice how the chords glide instead of jump.", cue: prog([["C", "maj"], ["F", "maj"], ["G", "maj"], ["C", "maj"]], 100), ms: 11000 },
    remember("Keep shared notes still, move the rest to the nearest note, and avoid parallel fifths and octaves."),
  ],
  "w4-tension": [
    { head: "The tension engine", text: "A dominant seventh chord contains a tritone, the most unstable interval. In G seven, it's B and F.", keys: [55, 59, 62, 65], badges: { 59: "B", 65: "F" }, play: "chord", ms: 7000 },
    { head: "Up and down", text: "Two rules make it resolve: the leading tone, B, rises to C, and the chord's seventh, F, falls to E. Leading tones go up, sevenths go down.", cue: prog([["G", "dom7"], ["C", "maj"]], 80), ms: 9000 },
    { head: "In minor keys", text: "Natural minor has no leading tone, so its five chord is weak. Raise the seventh and the five chord becomes major, with real pull: E seven to A minor.", cue: prog([["E", "dom7"], ["A", "min"]], 80), ms: 9000 },
    remember("Leading tones resolve up, sevenths resolve down. In minor, raise the seventh for a strong dominant."),
  ],
  "w4-modal": [
    { head: "Stay home, add colour", text: "Modal tracks don't rely on the pull from five back to one. They sit on the home chord and feature the mode's colour note instead." },
    { head: "A Dorian vamp", text: "D minor seven to G seven. The G seven contains B natural, the raised sixth of D Dorian. That's the colour you hear.", cue: prog([["D", "min7"], ["G", "dom7"], ["D", "min7"], ["G", "dom7"]], 120), ms: 11000 },
    remember("Modal harmony is about colour, not tension and release."),
  ],
  "w4-minimal": [
    { head: "Small moves, big feel", text: "In minimal music, chords often change by just one or two notes, so the hypnotic feel never breaks." },
    { head: "Example", text: "A minor to F major seven: A, C and E stay exactly where they are, and only an F is added underneath.", cue: prog([["A", "min"], ["F", "maj7"], ["A", "min"], ["F", "maj7"]], 120), ms: 10000 },
    remember("Choose chords that share notes. Change a little, but change something."),
  ],

  /* ------------------------------ World 5 ------------------------------ */
  "w5-chord-tones": [
    { head: "Chord tones = safe notes", text: "The notes inside the current chord are called chord tones. In a melody they sound stable and safe.", keys: [57, 60, 64], badges: label([57, 60, 64], ["A", "C", "E"]), play: "chord" },
    { head: "Dissonance wants to move", text: "Notes outside the chord add a little dissonance, and dissonance wants to move to a nearby chord tone. That push and release keeps a melody alive." },
    { head: "Land on them", text: "Land on a chord tone at the end of a phrase, and it feels finished.", cue: mel([69, 72, 76, 74, 72, 71, 69], 0.45) },
    remember("Strong beats and phrase endings love chord tones."),
  ],
  "w5-non-chord": [
    { head: "Passing tone", text: "A passing tone walks by step between two chord tones in the same direction, usually on a weak beat: C, D, E over a C chord.", keys: [60, 62, 64], badges: { 62: "pass" }, play: "melody" },
    { head: "Neighbour tone", text: "A neighbour tone steps away and comes straight back, either above or below: E, F, E.", keys: [64, 65], badges: { 65: "nbr" }, cue: mel([64, 65, 64]) },
    { head: "Hear behind the decoration", text: "Strip away the passing and neighbour tones and you'll often find a simple step-by-step line underneath. That hidden line is the melody's skeleton." },
    remember("Notes outside the chord aren't mistakes. Passing and neighbour tones decorate a simpler line underneath."),
  ],
  "w5-call-response": [
    { head: "Question and answer", text: "Call and response is a musical conversation. One phrase asks a question, and the next one answers it." },
    { head: "The call", text: "A call often ends on an open note, or a half cadence, so it feels unfinished.", cue: { type: "steps", instrument: "lead", bpm: 120, notes: [{ step: 0, midi: 69, len: 2 }, { step: 3, midi: 72, len: 1 }, { step: 4, midi: 76, len: 3 }, { step: 8, midi: 74, len: 2 }, { step: 12, midi: 72, len: 2 }, { step: 16, midi: 74, len: 6 }] } },
    { head: "The answer", text: "The response often reuses the rhythm, then ends on the home note with a stronger cadence. A matched question and answer like this is called a period." },
    remember("Ask with an open ending. Answer by coming home."),
  ],
  "w5-motif": [
    { head: "A motif is a seed", text: "A motif is a short idea, just a few notes, that can grow into a whole track.", cue: mel([69, 72, 76], 0.5) },
    { head: "Ways to vary it", text: "Move it up or down, flip it upside down, play it backwards, or shift it by a sixteenth. It stays recognisable but feels new.", cue: mel([69, 72, 76, 72, 76, 79, 76, 72, 69], 0.4), ms: 8000 },
    remember("Repeat it, vary it, return to it."),
  ],
  "w5-bassline": [
    { head: "Anchor first", text: "Start simple: play each chord's root on the downbeat. That tells the ear where the harmony is.", cue: bass([[0, 33, 4], [8, 41, 4]], 122) },
    { head: "Then add movement", text: "Now add octaves, fifths and off-beat notes for groove.", cue: bass([[0, 33, 3], [3, 45, 1], [6, 40, 2], [8, 41, 3], [11, 53, 1], [14, 48, 2]], 122) },
    remember("Roots on the downbeat, movement in between."),
  ],
  "w5-rhythm": [
    { head: "Where matters", text: "Where a note lands matters as much as which note it is." },
    { head: "On the beat", text: "Notes on the beat feel solid and grounded.", cue: bass([[0, 33, 2], [4, 33, 2], [8, 33, 2], [12, 33, 2]], 124) },
    { head: "Off the beat", text: "Notes between the beats bounce and push the groove forward.", cue: bass([[2, 33, 1], [6, 45, 1], [10, 33, 1], [14, 45, 1]], 124) },
    remember("Anchor on the downbeat. Groove on the off-beat."),
  ],

  /* ------------------------------ World 6 ------------------------------ */
  "w6-house": [
    { head: "Warm loops", text: "House progressions usually loop two to four chords, often minor sevenths and ninths, with a soulful Dorian colour." },
    { head: "Hear it", text: "A minor nine to D minor nine, the warm, classic house sound.", cue: prog([["A", "min9"], ["D", "min9"], ["A", "min9"], ["D", "min9"]], 122), ms: 9500 },
    remember("Seventh and ninth chords, few changes, lots of groove."),
  ],
  "w6-minor-grooves": [
    { head: "One chord, endless groove", text: "A single minor chord can carry a whole techno track. The bassline and rhythm do the moving.", cue: bass([[0, 29, 2], [3, 41, 1], [6, 36, 1], [8, 29, 2], [11, 39, 1], [14, 41, 2]], 128) },
    remember("Keep the harmony still and let the groove move."),
  ],
  "w6-acid": [
    { head: "Acid note choice", text: "Acid lines mix the root, the octave, the flat third and the flat seventh, plus a sneaky flat second for that squelchy, evil tension.", cue: bass([[0, 33, 1], [2, 45, 1], [3, 34, 1], [5, 33, 1], [6, 43, 1], [8, 36, 2], [11, 45, 1], [13, 34, 1], [14, 33, 2]], 130), ms: 9000 },
    remember("Root and octave for weight, the flat second for menace."),
  ],
  "w6-pedal": [
    { head: "Hold the bass", text: "A pedal tone is one bass note that stays the same while the chords above it change.", cue: prog([["A", "min"], ["F", "maj"], ["G", "maj"], ["A", "min"]], 120, false), ms: 10000 },
    { head: "Built-in tension", text: "When a chord no longer contains the bass note, tension builds without the groove ever moving. Perfect for long breakdowns." },
    remember("Keep the bass still, move the chords, and tension builds."),
  ],
  "w6-stabs": [
    { head: "Short and off-beat", text: "A stab is a short chord hit, usually on the off-beat, in between the kicks.", cue: stabs(chordMidi("A", "min7", 0, 57)) },
    { head: "Keep them compact", text: "Keep stabs in a narrow middle range and leave the root to the bass, so the mix stays clean." },
    remember("Short chords, off the beat, root left to the bass."),
  ],
  "w6-static-tension": [
    { head: "Tension without changes", text: "You can build tension without changing the chord. Move the melody from chord tones to tension notes like the ninth or the flat second, then back." },
    remember("Same chord, new melody notes: tension on a budget."),
  ],
  "w6-long-form": [
    { head: "Changes are events", text: "In a six to eight minute club track, a chord change is a big event. Save it for phrase boundaries, every sixteen or thirty-two bars." },
    remember("Change the harmony where DJs and dancers expect it: on the phrase."),
  ],

  /* ------------------------------ World 7 ------------------------------ */
  "w7-progression": [
    { head: "Your own loop", text: "Pick a key, choose four chords from it, and start or end on the home chord. That's a complete four-bar loop.", cue: prog([["E", "min"], ["C", "maj"], ["D", "maj"], ["E", "min"]], 120), ms: 10000 },
    remember("Four diatonic chords plus a clear home equals a loop."),
  ],
  "w7-bass": [
    { head: "Bass under your chords", text: "Put each chord's root on the first beat of its bar, then add movement with octaves, fifths and off-beats." },
    remember("Anchor first, then groove."),
  ],
  "w7-melody": [
    { head: "Ask and answer", text: "Write two bars that ask a question, then two bars that answer. Reuse the rhythm, and change the ending." },
    remember("Same rhythm, different ending."),
  ],
  "w7-variation": [
    { head: "Repeat, then twist", text: "When the loop repeats, change one thing: a chord, its quality, or its voicing. It keeps the listener hooked." },
    remember("Change one thing at a time."),
  ],
  "w7-expand": [
    { head: "A A' B A", text: "To grow four bars into sixteen: play it, play it again with a small change, go somewhere new, then come back." },
    remember("Repeat, vary, contrast, return."),
  ],
  "w7-export": [
    { head: "Into Ableton", text: "Export MIDI from the Lab and drag the file into Ableton. Chords, bass, melody and drums each land on their own track, at your tempo." },
    remember("Export, drag, produce."),
  ],
};

/** Intro scenes for a lesson: hand-written if available, otherwise generated from its concept and demo. */
export function introFor(lesson: Lesson, en: (l: Lesson["concept"][number]) => string): IntroScene[] {
  const custom = INTROS[lesson.id];
  if (custom) return custom;
  if (lesson.boss)
    return [
      { head: "Boss time", text: "This challenge mixes everything from the world you just finished. No pressure: hints are free, and wrong answers just show you what to review." },
      { head: "Tip", text: "Boss answers earn double experience points. Take your time, and replay any sound as often as you like." },
    ];
  const scenes: IntroScene[] = lesson.concept.map((c, i) => ({ text: en(c), cue: i === 0 ? lesson.demo?.cue : undefined }));
  if (lesson.demo && lesson.concept.length === 0) scenes.push({ text: en(lesson.demo.label), cue: lesson.demo.cue });
  if (lesson.demo && lesson.concept.length > 0 && !scenes[0].cue) scenes[0].cue = lesson.demo.cue;
  if (lesson.production) scenes.push({ text: en(lesson.production) });
  return scenes;
}

export function youtubeSearchUrl(query: string): string {
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
}

