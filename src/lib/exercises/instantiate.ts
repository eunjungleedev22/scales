import { chordMidi, chordNotes, chordIntervalLabels, chordSymbol, CHORD_TYPES, ChordType } from "@/lib/theory/chords";
import { intervalByShort, INTERVALS } from "@/lib/theory/intervals";
import { describeKeyPosition, formulaWH } from "./evaluate";
import { noteToMidi, pitchClass, COMMON_TONICS } from "@/lib/theory/notes";
import { scaleNotes, SCALES, ScaleId } from "@/lib/theory/scales";
import type { ConcreteExercise, ExerciseDef, Localized } from "./types";

export type Rng = () => number;

/** Deterministic PRNG (mulberry32) — handy for tests and reproducible drills. */
export function seeded(seed: number): Rng {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const pick = <T,>(arr: readonly T[], rng: Rng): T => arr[Math.floor(rng() * arr.length)];

export function shuffle<T>(arr: T[], rng: Rng): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Turn a definition into something renderable. Ear-training definitions become randomised choice questions. */
export function instantiate(def: ExerciseDef, rng: Rng = Math.random): ConcreteExercise {
  if (def.kind === "ear-interval") {
    const short = pick(def.pool, rng);
    const info = intervalByShort(short)!;
    const root = 55 + Math.floor(rng() * 10); // G3..E4
    const options = def.pool.map((s) => intervalByShort(s)?.name ?? s);
    return {
      id: def.id,
      kind: "choice",
      ear: true,
      prompt: def.prompt,
      hint: def.hint ?? { en: `Listen for the "vibe": ${def.pool.map((s) => `${intervalByShort(s)?.name}: ${intervalByShort(s)?.vibe}`).join(" / ")}` },
      explanation: def.explanation ?? `That was a ${info.name} (${info.semitones} semitones). ${info.vibe}`,
      production: def.production,
      options,
      answer: def.pool.indexOf(short),
      audio: { type: "notes", midis: [root, root + info.semitones], mode: def.mode === "melodic" ? "melody" : "both" },
    };
  }
  if (def.kind === "ear-chord") {
    const type = pick(def.pool, rng);
    const root = pick(["C", "D", "E", "F", "G", "A", "Bb"], rng);
    return {
      id: def.id,
      kind: "choice",
      ear: true,
      prompt: def.prompt,
      hint: def.hint ?? { en: def.pool.map((t) => `${CHORD_TYPES[t].name}: ${CHORD_TYPES[t].vibe}`).join(" / ") },
      explanation: def.explanation ?? `That was ${chordSymbol(root, type)} (${CHORD_TYPES[type].name}). ${CHORD_TYPES[type].vibe}`,
      production: def.production,
      options: def.pool.map((t) => CHORD_TYPES[t].name),
      answer: def.pool.indexOf(type),
      audio: { type: "notes", midis: chordMidi(root, type, 0, 52), mode: "both" },
    };
  }
  return def;
}

/** Auto-generated hint for keyboard exercises (used if the definition has none). */
export function autoHint(ex: ConcreteExercise): Localized | undefined {
  if (ex.hint) return ex.hint;
  switch (ex.kind) {
    case "identify-note":
      return { en: `${ex.note} is ${describeKeyPosition(pitchClass(ex.note))}.` };
    case "build-interval": {
      const i = intervalByShort(ex.interval);
      return { en: `Count ${i?.semitones} semitones (keys, black and white) up from ${ex.from.replace(/\d/, "")}.` };
    }
    case "build-scale":
      return { en: `Start on ${ex.tonic} and follow ${formulaWH(SCALES[ex.scale].steps)} (W = 2 semitones, H = 1).` };
    case "build-chord":
      return { en: `${chordSymbol(ex.root, ex.chord)}: root + ${chordIntervalLabels(ex.chord).slice(1).join(" + ")} above it. First note: ${ex.root}.` };
    default:
      return undefined;
  }
}

/* ---------------- Random drill generators (Quick Practice / Deep Dive) ---------------- */

const NOTE_POOL = ["C", "C#", "Db", "D", "D#", "Eb", "E", "F", "F#", "Gb", "G", "G#", "Ab", "A", "A#", "Bb", "B"];

export type DrillKind = "note" | "interval" | "scale" | "chord" | "ear-interval" | "ear-chord" | "degree";

export function generateDrill(kind: DrillKind, rng: Rng = Math.random): ConcreteExercise {
  const id = `drill-${kind}`;
  switch (kind) {
    case "note": {
      const note = pick(NOTE_POOL, rng);
      return { id, kind: "identify-note", note, prompt: { en: `Find ${note}`, ko: `${note}를 찾으세요` } };
    }
    case "interval": {
      const iv = pick(INTERVALS.filter((i) => i.semitones > 0 && i.semitones < 12), rng);
      const from = pick(["C4", "D4", "E4", "F4", "G4", "A3", "Bb3"], rng);
      return { id, kind: "build-interval", from, interval: iv.short, prompt: { en: `Play a ${iv.name} above ${from.replace(/\d/, "")}`, ko: `${from.replace(/\d/, "")} 위의 ${iv.name}을 누르세요` } };
    }
    case "scale": {
      const scale = pick<ScaleId>(["major", "minor", "dorian", "mixolydian", "minor-pentatonic", "major-pentatonic", "phrygian", "lydian"], rng);
      const tonic = pick(COMMON_TONICS, rng);
      return { id, kind: "build-scale", tonic, scale, prompt: { en: `Build ${tonic} ${SCALES[scale].name}`, ko: `${tonic} ${SCALES[scale].name} 스케일을 만드세요` } };
    }
    case "chord": {
      const chord = pick<ChordType>(["maj", "min", "dim", "aug", "maj7", "min7", "dom7", "m7b5"], rng);
      const root = pick(COMMON_TONICS, rng);
      return { id, kind: "build-chord", root, chord, prompt: { en: `Build ${chordSymbol(root, chord)}`, ko: `${chordSymbol(root, chord)} 코드를 만드세요` } };
    }
    case "ear-interval":
      return instantiate({ id, kind: "ear-interval", mode: rng() > 0.5 ? "melodic" : "harmonic", pool: shuffle(["m3", "M3", "P4", "P5", "m7", "P8", "M2", "TT"], rng).slice(0, 4), prompt: { en: "Which interval do you hear?", ko: "어떤 음정이 들리나요?" } }, rng);
    case "ear-chord":
      return instantiate({ id, kind: "ear-chord", pool: rng() > 0.5 ? ["maj", "min", "dim", "aug"] : ["maj7", "min7", "dom7", "m7b5"], prompt: { en: "Which chord quality?", ko: "어떤 코드 성질인가요?" } }, rng);
    case "degree": {
      const tonic = pick(["C", "G", "D", "F", "A", "Bb", "E"], rng);
      const notes = scaleNotes(tonic, "major");
      const d = Math.floor(rng() * 7);
      const opts = shuffle([...new Set([notes[d], notes[(d + 1) % 7], notes[(d + 3) % 7], notes[(d + 5) % 7]])], rng);
      return {
        id,
        kind: "choice",
        prompt: { en: `What is scale degree ${d + 1} of ${tonic} major?`, ko: `${tonic} 메이저의 ${d + 1}도는?` },
        options: opts,
        answer: opts.indexOf(notes[d]),
        explanation: `${tonic} major: ${notes.map((n, i) => `${i + 1}=${n}`).join(" ")}`,
        show: [noteToMidi(`${tonic}4`)],
      };
    }
  }
}

export function describeChordForUI(root: string, type: ChordType) {
  const notes = chordNotes(root, type);
  const labels = chordIntervalLabels(type);
  return notes.map((n, i) => ({ note: n, label: labels[i] }));
}
