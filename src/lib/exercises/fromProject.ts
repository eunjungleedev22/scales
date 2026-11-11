import { chordPitchClasses, commonTones, chordNotes, CHORD_TYPES } from "@/lib/theory/chords";
import { mod12, pcName, prefersFlats } from "@/lib/theory/notes";
import { scaleNotes, scalePitchClasses, SCALES, ScaleId } from "@/lib/theory/scales";
import type { ResolvedChord } from "@/lib/music/progression";
import type { ConcreteExercise } from "./types";
import { Rng, shuffle } from "./instantiate";

const ALT_SCALES: ScaleId[] = ["major", "minor", "dorian", "phrygian", "lydian", "mixolydian", "harmonic-minor", "minor-pentatonic", "major-pentatonic"];
const TONICS = ["C", "Db", "D", "Eb", "E", "F", "F#", "G", "Ab", "A", "Bb", "B"];

/** Generate exercises about the user's own Composition Lab project. */
export function exercisesFromProject(tonic: string, scale: ScaleId, chords: ResolvedChord[], rng: Rng = Math.random): ConcreteExercise[] {
  const out: ConcreteExercise[] = [];
  if (!chords.length) return out;
  const flats = prefersFlats(tonic, SCALES[scale].quality);
  const name = (pc: number) => pcName(pc, flats ? "flat" : "sharp");
  const unique = chords.filter((c, i) => chords.findIndex((d) => d.symbol === c.symbol) === i);
  const progText = chords.slice(0, 8).map((c) => c.symbol).join(" – ");

  // 1. Chord tones of the first chord
  const c0 = chords[0];
  out.push({
    id: "lab-chord-tones",
    kind: "build-chord",
    root: c0.root,
    chord: c0.type,
    prompt: { en: `Your progression starts on ${c0.symbol}. Play its chord tones.`, ko: `진행이 ${c0.symbol}로 시작해요. 코드 톤을 누르세요.` },
    production: "These are the safest notes for bass and melody over bar 1.",
  });

  // 2. Compatible scales
  const allPcs = [...new Set(chords.flatMap((c) => chordPitchClasses(c.root, c.type)))];
  const fits = (t: string, s: ScaleId) => allPcs.every((pc) => scalePitchClasses(t, s).includes(pc));
  const wrong: string[] = [];
  for (const s of shuffle(ALT_SCALES, rng)) {
    for (const t of shuffle(TONICS, rng)) {
      if (wrong.length >= 3) break;
      const label = `${t} ${SCALES[s].name}`;
      if (!fits(t, s) && !wrong.includes(label)) wrong.push(label);
    }
  }
  const right = `${tonic} ${SCALES[scale].name}`;
  if (fits(tonic, scale) && wrong.length === 3) {
    const opts = shuffle([right, ...wrong], rng);
    out.push({
      id: "lab-compatible-scale",
      kind: "choice",
      prompt: { en: `Which scale contains every chord tone of ${progText}?`, ko: `${progText}의 모든 코드 톤을 포함하는 스케일은?` },
      options: opts,
      answer: opts.indexOf(right),
      explanation: `${right} = ${scaleNotes(tonic, scale).join(" ")}. All chord tones (${allPcs.map(name).join(" ")}) fit inside it.`,
    });
  }

  // 3. Bass note choice for bar 2 (or bar 1)
  const cb = chords[1] ?? chords[0];
  const cbPcs = chordPitchClasses(cb.root, cb.type);
  const nonChord = scalePitchClasses(tonic, scale).filter((pc) => !cbPcs.includes(pc));
  if (nonChord.length >= 2) {
    const correct = name(cbPcs[0]);
    const opts = shuffle([correct, ...shuffle(nonChord, rng).slice(0, 3).map(name)], rng);
    out.push({
      id: "lab-bass-note",
      kind: "choice",
      prompt: { en: `Bar ${chords[1] ? 2 : 1} is ${cb.symbol}. Which bass note on the downbeat anchors it best?`, ko: `${chords[1] ? 2 : 1}마디는 ${cb.symbol}. 다운비트에 가장 잘 맞는 베이스 음은?` },
      options: opts,
      answer: opts.indexOf(correct),
      explanation: `${correct} is the root of ${cb.symbol}. Other chord tones (${chordNotes(cb.root, cb.type).slice(1).join(", ")}) also work and create inversions; non-chord tones are better as passing notes.`,
    });
  }

  // 4. Voice leading: common tones between first two different chords
  if (unique.length >= 2) {
    const [a, b] = unique;
    const ct = commonTones(chordPitchClasses(a.root, a.type), chordPitchClasses(b.root, b.type));
    const n = ct.length;
    const opts = shuffle([...new Set([n, 0, 1, 2, 3].filter((x) => x <= Math.min(CHORD_TYPES[a.type].intervals.length, 4)))].slice(0, 4), rng);
    if (!opts.includes(n)) opts[0] = n;
    out.push({
      id: "lab-voice-leading",
      kind: "choice",
      prompt: { en: `How many notes do ${a.symbol} and ${b.symbol} share (common tones)?`, ko: `${a.symbol}와 ${b.symbol}의 공통음은 몇 개?` },
      options: opts.map(String),
      answer: opts.indexOf(n),
      explanation: n ? `Shared: ${ct.map(name).join(", ")}. Hold these in your pad while the other voices move by step.` : "No shared notes — move each voice to the nearest note of the next chord.",
    });
  }

  // 5. Tension and resolution: function of a chord
  const withFn = chords.find((c) => c.fn === "dominant") ?? chords.find((c) => c.fn === "predominant");
  if (withFn) {
    const opts = ["tonic (home)", "predominant (moving away)", "dominant (tension → home)"];
    const ans = withFn.fn === "dominant" ? 2 : 1;
    out.push({
      id: "lab-function",
      kind: "choice",
      prompt: { en: `In ${tonic} ${SCALES[scale].name}, what is the function of ${withFn.symbol} (${withFn.roman})?`, ko: `${withFn.symbol} (${withFn.roman})의 기능은?` },
      options: opts,
      answer: ans,
      explanation: withFn.fn === "dominant" ? `${withFn.roman} creates tension that resolves to the tonic.` : `${withFn.roman} moves away from home and prepares the dominant or the return.`,
    });
  }

  // 6. Build the project's scale
  out.push({
    id: "lab-build-scale",
    kind: "build-scale",
    tonic,
    scale,
    prompt: { en: `Build your project's scale: ${tonic} ${SCALES[scale].name}`, ko: `프로젝트 스케일 만들기: ${tonic} ${SCALES[scale].name}` },
  });

  void mod12;
  return out;
}
