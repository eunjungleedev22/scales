import {
  chordIntervalLabels,
  chordNotes,
  chordPitchClasses,
  chordSymbol,
  chordToneRole,
  ChordType,
} from "@/lib/theory/chords";
import { diatonicChords, functionOf } from "@/lib/theory/harmony";
import { intervalByShort } from "@/lib/theory/intervals";
import { mod12, noteToMidi, pcName, pitchClass, pitchClassSet, prefersFlats } from "@/lib/theory/notes";
import { scaleNotes, scalePitchClasses, SCALES } from "@/lib/theory/scales";
import type { StepNote } from "@/lib/music/events";
import type {
  Answer,
  BasslineExercise,
  BuildChordExercise,
  BuildIntervalExercise,
  BuildScaleExercise,
  CallResponseExercise,
  ConcreteExercise,
  Evaluation,
  FixMelodyExercise,
  IdentifyNoteExercise,
  Localized,
  ProgressionExercise,
} from "./types";

const OK: Localized = { en: "Correct!", ko: "정답!" };
const NOPE: Localized = { en: "Not quite.", ko: "아쉬워요." };

function setDiff(selected: number[], target: number[]) {
  const s = new Set(selected.map(mod12));
  const t = new Set(target.map(mod12));
  return {
    right: [...s].filter((x) => t.has(x)),
    wrong: [...s].filter((x) => !t.has(x)),
    missing: [...t].filter((x) => !s.has(x)),
  };
}

export function evaluateIdentifyNote(ex: IdentifyNoteExercise, midis: number[]): Evaluation {
  const target = pitchClass(ex.note);
  const last = midis[midis.length - 1];
  if (last === undefined) return { status: "incorrect", correct: false, message: NOPE, details: ["Select a key."] };
  const ok = mod12(last) === target;
  const clicked = pcName(last, ex.note.includes("b") ? "flat" : "sharp");
  return {
    status: ok ? "correct" : "incorrect",
    correct: ok,
    message: ok ? OK : NOPE,
    details: ok
      ? [`${ex.note} is pitch class ${target}${ex.note.length > 1 ? ` — also spelled ${pcName(target, ex.note.includes("b") ? "sharp" : "flat")}` : ""}.`]
      : [`You played ${clicked}. ${ex.note} is ${describeKeyPosition(target)}.`],
    pcs: ok ? { right: [target], wrong: [], missing: [] } : { right: [], wrong: [mod12(last)], missing: [target] },
  };
}

export function describeKeyPosition(pc: number): string {
  const map: Record<number, string> = {
    0: "the white key just left of the group of two black keys",
    1: "the left black key of the group of two",
    2: "the white key between the two black keys",
    3: "the right black key of the group of two",
    4: "the white key just right of the group of two black keys",
    5: "the white key just left of the group of three black keys",
    6: "the first black key of the group of three",
    7: "the white key between the first and second of the three black keys",
    8: "the middle black key of the group of three",
    9: "the white key between the second and third of the three black keys",
    10: "the last black key of the group of three",
    11: "the white key just right of the group of three black keys",
  };
  return map[mod12(pc)];
}

export function evaluateBuildInterval(ex: BuildIntervalExercise, midis: number[]): Evaluation {
  const info = intervalByShort(ex.interval);
  const fromMidi = noteToMidi(ex.from);
  if (!info || Number.isNaN(fromMidi)) throw new Error(`Bad interval exercise ${ex.id}`);
  const targetMidi = fromMidi + info.semitones;
  const candidates = midis.filter((m) => m !== fromMidi);
  const pick = candidates[candidates.length - 1];
  if (pick === undefined) return { status: "incorrect", correct: false, message: NOPE, details: ["Select the second note."] };
  const ok = info.semitones === 12 ? pick === targetMidi : mod12(pick) === mod12(targetMidi) && pick > fromMidi;
  const prefer = prefersFlats(ex.from) ? "flat" : "sharp";
  return {
    status: ok ? "correct" : "incorrect",
    correct: ok,
    message: ok ? OK : NOPE,
    details: [
      `A ${info.name} is ${info.semitones} semitone${info.semitones === 1 ? "" : "s"} up: ${ex.from.replace(/\d/, "")} → ${pcName(targetMidi, prefer)}.`,
      ...(ok ? [info.vibe] : [`You picked ${pcName(pick, prefer)}, which is ${pick - fromMidi} semitone(s) from ${ex.from.replace(/\d/, "")}.`]),
    ],
    pcs: ok ? { right: [mod12(fromMidi), mod12(targetMidi)], wrong: [], missing: [] } : { right: [mod12(fromMidi)], wrong: [mod12(pick)], missing: [mod12(targetMidi)] },
  };
}

export function evaluateBuildScale(ex: BuildScaleExercise, midis: number[]): Evaluation {
  const target = scalePitchClasses(ex.tonic, ex.scale);
  const diff = setDiff(pitchClassSet(midis), target);
  const ok = diff.wrong.length === 0 && diff.missing.length === 0;
  const spelled = scaleNotes(ex.tonic, ex.scale).join(" ");
  const formula = formulaWH(SCALES[ex.scale].steps);
  const prefer = prefersFlats(ex.tonic, SCALES[ex.scale].quality) ? "flat" : "sharp";
  const details: Localized[] = [`${ex.tonic} ${SCALES[ex.scale].name}: ${spelled}`, `Step pattern: ${formula}`];
  if (!ok) {
    if (diff.missing.length) details.push(`Missing: ${diff.missing.map((p) => pcName(p, prefer)).join(", ")}`);
    if (diff.wrong.length) details.push(`Not in the scale: ${diff.wrong.map((p) => pcName(p, prefer)).join(", ")}`);
  }
  return { status: ok ? "correct" : "incorrect", correct: ok, message: ok ? OK : NOPE, details, pcs: diff };
}

export function formulaWH(steps: number[]): string {
  const full = [...steps, 12];
  const out: string[] = [];
  for (let i = 1; i < full.length; i++) {
    const d = full[i] - full[i - 1];
    out.push(d === 1 ? "H" : d === 2 ? "W" : d === 3 ? "W+H" : `${d}`);
  }
  return out.join(" ");
}

export function evaluateBuildChord(ex: BuildChordExercise, midis: number[]): Evaluation {
  const target = chordPitchClasses(ex.root, ex.chord);
  const diff = setDiff(pitchClassSet(midis), target);
  let ok = diff.wrong.length === 0 && diff.missing.length === 0;
  const spelled = chordNotes(ex.root, ex.chord);
  const labels = chordIntervalLabels(ex.chord);
  const details: Localized[] = [
    `${chordSymbol(ex.root, ex.chord)} = ${spelled.join(" ")}`,
    `Intervals from the root: ${spelled.map((n, i) => `${n} (${labels[i]})`).join(" · ")}`,
  ];
  if (ok && ex.inversion !== undefined && midis.length) {
    const bass = mod12(Math.min(...midis));
    if (bass !== target[ex.inversion]) {
      ok = false;
      details.push(`Right notes, but the lowest note should be ${spelled[ex.inversion]} for this inversion.`);
    }
  }
  if (!ok) {
    const prefer = ex.root.includes("b") ? "flat" : "sharp";
    if (diff.missing.length) details.push(`Missing: ${diff.missing.map((p) => pcName(p, prefer)).join(", ")}`);
    if (diff.wrong.length) details.push(`Not in this chord: ${diff.wrong.map((p) => pcName(p, prefer)).join(", ")}`);
  }
  return { status: ok ? "correct" : "incorrect", correct: ok, message: ok ? OK : NOPE, details, pcs: diff };
}

export function evaluateProgression(ex: ProgressionExercise, index: number): Evaluation {
  const chosen = ex.options[index];
  const answer = ex.degrees[ex.missing];
  const chords = diatonicChords(ex.tonic, ex.scale, ex.sevenths);
  const c = chords[chosen - 1];
  const target = chords[answer - 1];
  const quality = SCALES[ex.scale].quality;
  if (chosen === answer) {
    return {
      status: "correct",
      correct: true,
      message: OK,
      details: [`${target.roman} (${target.symbol}) has a ${functionOf(answer, quality, ex.scale)} function here.`, ...(ex.explanation ? [ex.explanation] : [])],
    };
  }
  const alt = ex.alsoWorks?.find((a) => a.degree === chosen);
  if (alt) {
    return {
      status: "creative",
      correct: true,
      message: { en: "That works too — a different colour.", ko: "그것도 가능해요 — 다른 색깔이에요." },
      details: [alt.why, `The target answer was ${target.roman} (${target.symbol}).`],
    };
  }
  return {
    status: "incorrect",
    correct: false,
    message: NOPE,
    details: [`${c.roman} (${c.symbol}) is a ${functionOf(chosen, quality, ex.scale)} chord; this slot wants ${target.roman} (${target.symbol}).`, ...(ex.explanation ? [ex.explanation] : [])],
  };
}

export function evaluateFixMelody(ex: FixMelodyExercise, notes: number[]): Evaluation {
  const { root, type } = ex.chord;
  const roles = notes.map((n) => chordToneRole(n, root, type));
  const scalePcs = scalePitchClasses(ex.tonic, ex.scale);
  const failing = ex.mustBeChordTone.filter((i) => roles[i] === null);
  const details: Localized[] = [];
  notes.forEach((n, i) => {
    const r = roles[i];
    const inScale = scalePcs.includes(mod12(n));
    const name = pcName(n, prefersFlats(ex.tonic) ? "flat" : "sharp");
    if (!r) {
      const prev = notes[i - 1];
      const next = notes[i + 1];
      const stepwise = prev !== undefined && next !== undefined && Math.abs(n - prev) <= 2 && Math.abs(next - n) <= 2;
      const kind = stepwise && prev !== next ? "passing tone" : stepwise && prev === next ? "neighbour tone" : inScale ? "non-chord tone (tension)" : "chromatic tension";
      if (ex.editable.includes(i) || ex.mustBeChordTone.includes(i)) details.push(`Note ${i + 1} (${name}) is a ${kind} — it adds colour and wants to move.`);
    }
  });
  const chordName = chordSymbol(root, type);
  if (failing.length === 0) {
    return {
      status: "correct",
      correct: true,
      message: { en: "Resolved!", ko: "해결됐어요!" },
      details: [
        `The required note${ex.mustBeChordTone.length > 1 ? "s land" : " lands"} on ${ex.mustBeChordTone.map((i) => `the ${roles[i]}`).join(", ")} of ${chordName}, so the phrase sounds settled.`,
        ...details.slice(0, 2),
        "Non-chord tones elsewhere are a creative choice, not a mistake.",
      ],
    };
  }
  return {
    status: "incorrect",
    correct: false,
    message: { en: "Still unresolved.", ko: "아직 해결되지 않았어요." },
    details: [
      `${chordName} = ${chordNotes(root, type).join(" ")}. The goal: land note${failing.length > 1 ? "s" : ""} ${failing.map((i) => i + 1).join(", ")} on one of these chord tones.`,
      ...details.slice(0, 3),
    ],
  };
}

/** Split 16 steps into equal chord regions. */
export function chordAtStep(chords: Array<{ root: string; type: ChordType }>, step: number, totalSteps = 16) {
  const per = totalSteps / chords.length;
  return { chord: chords[Math.min(chords.length - 1, Math.floor(step / per))], regionStart: Math.floor(step / per) * per, per };
}

export function evaluateBassline(ex: BasslineExercise, notes: StepNote[]): Evaluation {
  const sorted = [...notes].sort((a, b) => a.step - b.step);
  const details: Localized[] = [];
  if (sorted.length < 3) {
    return { status: "incorrect", correct: false, message: { en: "Add a few more notes.", ko: "노트를 조금 더 추가하세요." }, details: ["Place at least 3 notes so the bassline outlines the harmony."] };
  }
  const per = 16 / ex.chords.length;
  const anchorsOk: boolean[] = [];
  ex.chords.forEach((c, i) => {
    const start = i * per;
    const first = sorted.find((n) => n.step >= start && n.step < start + per);
    const ok = !!first && chordPitchClasses(c.root, c.type).includes(mod12(first.midi));
    anchorsOk.push(ok);
    const sym = chordSymbol(c.root, c.type);
    if (!first) details.push(`No note under ${sym} — the harmony loses its foundation there.`);
    else if (ok) details.push(`Under ${sym}, you start on the ${chordToneRole(first.midi, c.root, c.type)} — strong anchor.`);
    else details.push(`Under ${sym}, your first note ${pcName(first.midi)} isn't a chord tone. Try ${chordNotes(c.root, c.type).slice(0, 3).join(", ")}.`);
  });
  const scalePcs = scalePitchClasses(ex.tonic, ex.scale);
  const outside = sorted.filter((n) => !scalePcs.includes(mod12(n.midi)));
  if (outside.length) details.push(`${outside.length} chromatic note(s) — fine as passing tones, risky on downbeats.`);
  const offbeats = sorted.filter((n) => n.step % 4 !== 0).length;
  details.push(
    offbeats === 0
      ? "Every note is on the beat — try an off-beat (step 3, 7, 11, 15) for house bounce."
      : `${offbeats} off-beat note(s) — that's where the groove lives.`,
  );
  const pitches = new Set(sorted.map((n) => n.midi));
  if (pitches.size === 1) details.push("Only one pitch — a pedal bass works in minimal; an octave jump adds movement.");
  const ok = anchorsOk.every(Boolean);
  return {
    status: ok ? "correct" : "incorrect",
    correct: ok,
    message: ok ? { en: "Solid bassline!", ko: "탄탄한 베이스라인!" } : { en: "Anchor each chord with a chord tone.", ko: "각 코드의 시작을 코드 톤으로 고정하세요." },
    details,
  };
}

export function evaluateCallResponse(ex: CallResponseExercise, notes: StepNote[]): Evaluation {
  const sorted = [...notes].sort((a, b) => a.step - b.step);
  if (sorted.length < 3) {
    return { status: "incorrect", correct: false, message: { en: "Write a response of at least 3 notes.", ko: "최소 3개의 노트로 응답을 만드세요." }, details: [] };
  }
  const details: Localized[] = [];
  const scalePcs = scalePitchClasses(ex.tonic, ex.scale);
  const outside = sorted.filter((n) => !scalePcs.includes(mod12(n.midi)));
  const last = sorted[sorted.length - 1];
  const tonicPc = pitchClass(ex.tonic);
  const role = chordToneRole(last.midi, ex.chord.root, ex.chord.type);
  if (mod12(last.midi) === tonicPc) details.push("You end on the tonic — the response sounds like a full stop (a closed 'answer').");
  else if (role) details.push(`You end on the ${role} of ${chordSymbol(ex.chord.root, ex.chord.type)} — stable but not final. Good for looping.`);
  else details.push("You end on a non-chord tone — open and unresolved; it pulls the loop back to the call.");

  const callLast = [...ex.call].sort((a, b) => a.step - b.step).pop();
  const callContour = ex.call.length > 1 ? Math.sign(ex.call[ex.call.length - 1].midi - ex.call[0].midi) : 0;
  const respContour = Math.sign(last.midi - sorted[0].midi);
  if (callContour !== 0 && respContour === -callContour) details.push("Your contour moves opposite to the call — classic complementary answer.");
  else if (respContour === callContour && callContour !== 0) details.push("Your contour follows the call's direction — it sounds like a continuation or echo.");

  const callRhythm = new Set(ex.call.map((n) => n.step % 16));
  const respRhythm = new Set(sorted.map((n) => n.step % 16));
  const shared = [...respRhythm].filter((s) => callRhythm.has(s)).length;
  if (shared >= Math.min(callRhythm.size, respRhythm.size) * 0.7) details.push("You reuse the call's rhythm — strong motivic connection. Changing pitches only is a classic variation.");
  else details.push("New rhythm — more contrast. Try reusing one rhythmic cell to tie them together.");

  if (outside.length) details.push(`${outside.length} note(s) outside ${ex.tonic} ${SCALES[ex.scale].name} — a chromatic spice. Keep it if you like it.`);
  void callLast;
  return {
    status: "creative",
    correct: true,
    message: { en: "Nice response! Here's what the theory says:", ko: "좋은 응답이에요! 이론적으로 보면:" },
    details: [...details, "There's no single right answer — trust your ears and compare with the call."],
  };
}

/** Evaluate any concrete exercise. All correctness logic lives here, not in UI components. */
export function evaluate(ex: ConcreteExercise, answer: Answer): Evaluation {
  switch (ex.kind) {
    case "identify-note":
      return evaluateIdentifyNote(ex, answer.kind === "keys" ? answer.midis : []);
    case "build-interval":
      return evaluateBuildInterval(ex, answer.kind === "keys" ? answer.midis : []);
    case "build-scale":
      return evaluateBuildScale(ex, answer.kind === "keys" ? answer.midis : []);
    case "build-chord":
      return evaluateBuildChord(ex, answer.kind === "keys" ? answer.midis : []);
    case "choice": {
      const idx = answer.kind === "choice" ? answer.index : -1;
      const ok = idx === ex.answer;
      return {
        status: ok ? "correct" : "incorrect",
        correct: ok,
        message: ok ? OK : NOPE,
        details: ex.explanation ? [ex.explanation] : [],
      };
    }
    case "complete-progression":
      return evaluateProgression(ex, answer.kind === "choice" ? answer.index : -1);
    case "fix-melody":
      return evaluateFixMelody(ex, answer.kind === "melody" ? answer.notes : ex.melody);
    case "bassline":
      return evaluateBassline(ex, answer.kind === "steps" ? answer.notes : []);
    case "call-response":
      return evaluateCallResponse(ex, answer.kind === "steps" ? answer.notes : []);
  }
}
