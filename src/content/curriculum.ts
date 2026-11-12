import type { AudioCue, ExerciseDef, Localized } from "@/lib/exercises/types";
import { chordMidi } from "@/lib/theory/chords";
import { scaleMidi } from "@/lib/theory/scales";

type DistributiveOmit<T, K extends keyof T> = T extends unknown ? Omit<T, K> : never;
type Draft = DistributiveOmit<ExerciseDef, "id">;

export interface Lesson {
  id: string;
  worldId: number;
  title: Localized;
  /** 1–3 short concept bullets */
  concept: Localized[];
  demo?: { label: Localized; cue: AudioCue };
  exercises: ExerciseDef[];
  production?: Localized;
  boss?: boolean;
  /** For composition-lab lessons: a task to try in the Lab */
  labTask?: Localized;
}

export interface World {
  id: number;
  slug: string;
  title: Localized;
  tagline: Localized;
  color: string;
  lessons: Lesson[];
}

interface LessonDraft extends Omit<Lesson, "exercises" | "worldId"> {
  exercises: Draft[];
}

function world(id: number, slug: string, title: Localized, tagline: Localized, color: string, lessons: LessonDraft[]): World {
  return {
    id,
    slug,
    title,
    tagline,
    color,
    lessons: lessons.map((l) => ({
      ...l,
      worldId: id,
      exercises: l.exercises.map((e, i) => ({ ...e, id: `${l.id}-${i + 1}` }) as ExerciseDef),
    })),
  };
}

/* ---------- tiny authoring helpers ---------- */
const find = (note: string, extra: Partial<Draft> = {}): Draft => ({ kind: "identify-note", note, prompt: { en: `Find ${note}`, ko: `${note}를 찾으세요` }, ...extra }) as Draft;
const ivl = (from: string, interval: string, name: string, extra: Partial<Draft> = {}): Draft =>
  ({ kind: "build-interval", from, interval, prompt: { en: `Play a ${name} above ${from.replace(/\d/, "")}`, ko: `${from.replace(/\d/, "")} 위로 ${name}을 누르세요` }, ...extra }) as Draft;
const scale = (tonic: string, s: string, name: string, extra: Partial<Draft> = {}): Draft =>
  ({ kind: "build-scale", tonic, scale: s, prompt: { en: `Build ${tonic} ${name}`, ko: `${tonic} ${name} 스케일을 만드세요` }, ...extra }) as Draft;
const chord = (root: string, c: string, symbol: string, extra: Partial<Draft> = {}): Draft =>
  ({ kind: "build-chord", root, chord: c, prompt: { en: `Build ${symbol}`, ko: `${symbol} 코드를 만드세요` }, ...extra }) as Draft;
const choice = (prompt: Localized, options: Localized[], answer: number, explanation: Localized, extra: Partial<Draft> = {}): Draft =>
  ({ kind: "choice", prompt, options, answer, explanation, ...extra }) as Draft;
const earI = (pool: string[], mode: "melodic" | "harmonic", extra: Partial<Draft> = {}): Draft =>
  ({ kind: "ear-interval", pool, mode, prompt: { en: `Which interval? (${mode})`, ko: `어떤 음정인가요? (${mode === "melodic" ? "선율적" : "화성적"})` }, ...extra }) as Draft;
const earC = (pool: string[], extra: Partial<Draft> = {}): Draft => ({ kind: "ear-chord", pool, prompt: { en: "Which chord quality do you hear?", ko: "어떤 코드 성질이 들리나요?" }, ...extra }) as Draft;

const notesCue = (midis: number[], mode: "chord" | "melody" | "both" = "melody"): AudioCue => ({ type: "notes", midis, mode });
const progCue = (chords: Array<[string, string]>, bpm = 110, withBass = true): AudioCue =>
  ({ type: "progression", chords: chords.map(([root, type]) => ({ root, type })), bpm, withBass }) as AudioCue;

/* ====================================================================== */

export const WORLDS: World[] = [
  world(1, "notes-intervals", { en: "Notes & Intervals", ko: "음과 음정" }, { en: "Find your way around the keys", ko: "건반과 친해지기" }, "#f5c542", [
    {
      id: "w1-keyboard",
      title: { en: "Keyboard orientation", ko: "건반 익히기" },
      concept: [
        { en: "12 notes repeat across the keyboard. White keys: C D E F G A B.", ko: "12개의 음이 반복됩니다. 흰 건반: C D E F G A B." },
        { en: "Black keys come in groups of 2 and 3. C sits just left of the group of 2.", ko: "검은 건반은 2개, 3개씩 묶여 있어요. C는 2개 묶음 바로 왼쪽." },
      ],
      demo: { label: { en: "Hear C D E F G A B C", ko: "C D E F G A B C 듣기" }, cue: notesCue([60, 62, 64, 65, 67, 69, 71, 72]) },
      exercises: [find("C"), find("E"), find("F"), find("A"), find("B"), find("G")],
      production: { en: "In Ableton's piano roll, C rows are labelled (C3 = MIDI 60 in Live's naming). Use them as landmarks.", ko: "에이블턴 피아노롤에서 C 줄에 라벨이 있어요 (Live에서는 C3 = MIDI 60)." },
    },
    {
      id: "w1-steps",
      title: { en: "Semitones & whole tones", ko: "반음과 온음" },
      concept: [
        { en: "A semitone (half step) = the very next key, black or white.", ko: "반음 = 바로 옆 건반 (검은/흰 건반 상관없이)." },
        { en: "A whole tone = 2 semitones. E–F and B–C are semitones with no black key between.", ko: "온음 = 반음 2개. E–F, B–C는 사이에 검은 건반이 없는 반음." },
      ],
      demo: { label: { en: "Semitone, then whole tone", ko: "반음, 그다음 온음" }, cue: notesCue([64, 65, 64, 66]) },
      exercises: [
        ivl("E4", "m2", "semitone"),
        ivl("C4", "M2", "whole tone"),
        ivl("B3", "m2", "semitone"),
        choice({ en: "E to F is a…", ko: "E에서 F는…" }, [{ en: "semitone", ko: "반음" }, { en: "whole tone", ko: "온음" }], 0, { en: "No black key between E and F, so they're 1 semitone apart.", ko: "E와 F 사이에는 검은 건반이 없어서 반음입니다." }, { show: [64, 65] }),
        choice({ en: "How many semitones in a whole tone?", ko: "온음은 반음 몇 개?" }, ["1", "2", "3", "4"], 1, "Whole tone = 2 semitones."),
        ivl("F4", "M2", "whole tone"),
      ],
      production: { en: "Acid lines love semitone slides: try A → Bb → A in a 303-style pattern.", ko: "애시드 라인은 반음 슬라이드를 좋아해요: A → Bb → A." },
    },
    {
      id: "w1-accidentals",
      title: { en: "Sharps & flats", ko: "샵과 플랫" },
      concept: [
        { en: "♯ raises a note by a semitone, ♭ lowers it.", ko: "♯은 반음 올리고, ♭은 반음 내립니다." },
        { en: "C♯ and D♭ are the same key — enharmonic equivalents. The spelling depends on the key you're in.", ko: "C♯과 D♭은 같은 건반 — 이명동음. 표기는 조성에 따라 달라요." },
      ],
      exercises: [
        find("F#"),
        find("Bb"),
        find("C#"),
        find("Eb"),
        find("Ab"),
        choice({ en: "Which note is the same key as D♭?", ko: "D♭과 같은 건반은?" }, ["C#", "D#", "C", "Eb"], 0, "Db and C# are enharmonic: same key, different name."),
        choice({ en: "E♯ is played on which key?", ko: "E♯은 어느 건반?" }, ["F", "E", "F#", "Eb"], 0, "E raised by a semitone lands on F — a white key. E# is rare but appears in F# major."),
      ],
    },
    {
      id: "w1-octaves",
      title: { en: "Octaves", ko: "옥타브" },
      concept: [
        { en: "An octave = 12 semitones: same note name, double the frequency.", ko: "옥타브 = 반음 12개: 같은 음 이름, 주파수 2배." },
        { en: "Octave numbers count up from C: C4 is middle C (MIDI 60).", ko: "옥타브 번호는 C에서 바뀌어요: C4 = 가운데 도 (MIDI 60)." },
      ],
      demo: { label: { en: "Octave bass bounce", ko: "옥타브 베이스" }, cue: { type: "steps", instrument: "bass", bpm: 124, drums: true, notes: [0, 2, 4, 6, 8, 10, 12, 14].map((s, i) => ({ step: s, midi: i % 2 ? 45 : 33, len: 1 })) } },
      exercises: [
        ivl("C4", "P8", "octave"),
        ivl("A3", "P8", "octave"),
        choice({ en: "MIDI 60 is C4. What is MIDI 72?", ko: "MIDI 60은 C4. MIDI 72는?" }, ["C5", "C3", "B4", "D5"], 0, "72 − 60 = 12 semitones = one octave up → C5."),
        earI(["P5", "P8"], "melodic"),
        choice({ en: "A disco/house octave bass alternates between…", ko: "디스코/하우스 옥타브 베이스는…" }, [{ en: "the same note in two octaves", ko: "두 옥타브의 같은 음" }, { en: "two neighbouring notes", ko: "이웃한 두 음" }, { en: "root and fifth", ko: "근음과 5도" }], 0, "Same pitch class, 12 semitones apart: stable harmony, lots of movement."),
      ],
      production: { en: "Octave basslines keep harmony locked while adding energy — perfect over long, static chords.", ko: "옥타브 베이스는 화성을 유지하면서 에너지를 더해요." },
    },
    {
      id: "w1-intervals",
      title: { en: "Intervals", ko: "음정" },
      concept: [
        { en: "An interval is the distance between two notes, counted in semitones.", ko: "음정은 두 음 사이의 거리 (반음 단위)." },
        { en: "Minor 3rd = 3, Major 3rd = 4, Perfect 4th = 5, Perfect 5th = 7, minor 7th = 10.", ko: "단3도=3, 장3도=4, 완전4도=5, 완전5도=7, 단7도=10." },
      ],
      demo: { label: { en: "m3 vs M3", ko: "단3도 vs 장3도" }, cue: notesCue([60, 63, 60, 64]) },
      exercises: [
        ivl("C4", "M3", "major 3rd"),
        ivl("A3", "m3", "minor 3rd"),
        ivl("D4", "P5", "perfect 5th"),
        ivl("G3", "P4", "perfect 4th"),
        ivl("C4", "m7", "minor 7th"),
        ivl("F4", "TT", "tritone"),
        choice({ en: "How many semitones in a perfect 5th?", ko: "완전5도는 반음 몇 개?" }, ["5", "6", "7", "8"], 2, "P5 = 7 semitones (e.g. C→G)."),
      ],
      production: { en: "A bass root + fifth (7 semitones) is the strongest, least ambiguous foundation.", ko: "근음 + 5도는 가장 단단한 베이스 토대예요." },
    },
    {
      id: "w1-ear-intervals",
      title: { en: "Intervals by ear", ko: "귀로 음정 듣기" },
      concept: [
        { en: "Each interval has a character. Listen for the vibe, not the math.", ko: "음정마다 고유한 느낌이 있어요. 계산보다 느낌으로." },
        { en: "Replay as often as you want — there's no penalty.", ko: "원하는 만큼 다시 들으세요 — 페널티 없어요." },
      ],
      exercises: [
        earI(["P5", "P8"], "harmonic"),
        earI(["m3", "M3"], "harmonic"),
        earI(["P4", "P5"], "melodic"),
        earI(["m2", "M2"], "melodic"),
        earI(["m3", "M3", "P5", "P8"], "melodic"),
        earI(["M3", "TT", "P5", "m7"], "harmonic"),
      ],
    },
    {
      id: "w1-boss",
      boss: true,
      title: { en: "Boss: Alley Cat Showdown", ko: "보스: 골목 고양이 대결" },
      concept: [{ en: "Mixed challenge across World 1. Show what you know!", ko: "월드 1 종합 도전!" }],
      exercises: [
        find("D#"),
        find("Gb"),
        ivl("F4", "M3", "major 3rd"),
        ivl("G3", "P5", "perfect 5th"),
        ivl("E4", "m3", "minor 3rd"),
        earI(["m3", "M3", "P4", "P5"], "harmonic"),
        choice({ en: "How many semitones in a minor 3rd?", ko: "단3도는 반음 몇 개?" }, ["2", "3", "4", "5"], 1, "m3 = 3 semitones (A→C)."),
        choice({ en: "Which pair is a semitone apart with no black key between?", ko: "검은 건반 없이 반음인 쌍은?" }, ["B–C", "C–D", "F–G", "A–B"], 0, "B–C and E–F are the two 'natural' semitones."),
      ],
    },
  ]),

  world(2, "scales-keys", { en: "Scales & Keys", ko: "스케일과 조성" }, { en: "The note palettes behind every track", ko: "모든 트랙의 음 팔레트" }, "#ff5c1a", [
    {
      id: "w2-major",
      title: { en: "Major scale", ko: "메이저 스케일" },
      concept: [
        { en: "Major scale pattern: W W H W W W H (W = whole tone, H = semitone).", ko: "메이저 스케일 패턴: 온 온 반 온 온 온 반." },
        { en: "C major uses only white keys. Other keys need sharps or flats to keep the pattern.", ko: "C 메이저는 흰 건반만 사용. 다른 키는 패턴을 지키려고 샵/플랫이 필요." },
      ],
      demo: { label: { en: "C major up & down", ko: "C 메이저 상행/하행" }, cue: notesCue([...scaleMidi(60, "major"), ...scaleMidi(60, "major").reverse().slice(1)]) },
      exercises: [
        scale("C", "major", "major"),
        scale("G", "major", "major"),
        scale("F", "major", "major"),
        scale("D", "major", "major"),
        choice({ en: "Which note is in G major but not in C major?", ko: "G 메이저에는 있고 C 메이저에는 없는 음은?" }, ["F#", "Bb", "C#", "G"], 0, "G major = G A B C D E F#. F# keeps the final H step to G."),
      ],
    },
    {
      id: "w2-minor",
      title: { en: "Natural minor", ko: "내추럴 마이너" },
      concept: [
        { en: "Natural minor pattern: W H W W H W W.", ko: "내추럴 마이너 패턴: 온 반 온 온 반 온 온." },
        { en: "A minor shares its notes with C major — they're relative keys.", ko: "A 마이너는 C 메이저와 같은 음을 써요 — 나란한조." },
      ],
      demo: { label: { en: "A minor", ko: "A 마이너" }, cue: notesCue(scaleMidi(57, "minor")) },
      exercises: [
        scale("A", "minor", "natural minor"),
        scale("E", "minor", "natural minor"),
        scale("D", "minor", "natural minor"),
        scale("C", "minor", "natural minor"),
        choice({ en: "What is the relative minor of C major?", ko: "C 메이저의 나란한조 마이너는?" }, ["A minor", "C minor", "E minor", "D minor"], 0, "Count down a minor 3rd from C → A. Same notes, different home."),
      ],
      production: { en: "Most techno and deep house sits in natural minor or Dorian. Start here when in doubt.", ko: "테크노와 딥하우스는 대부분 마이너나 도리안이에요." },
    },
    {
      id: "w2-pentatonic",
      title: { en: "Pentatonic scales", ko: "펜타토닉 스케일" },
      concept: [
        { en: "Pentatonic = 5 notes. Minor pentatonic: 1 ♭3 4 5 ♭7. Major pentatonic: 1 2 3 5 6.", ko: "펜타토닉 = 5음. 마이너: 1 ♭3 4 5 ♭7. 메이저: 1 2 3 5 6." },
        { en: "No semitone clashes — almost any order sounds good.", ko: "반음 충돌이 없어 어떤 순서로 쳐도 잘 어울려요." },
      ],
      demo: { label: { en: "A minor pentatonic riff", ko: "A 마이너 펜타토닉 리프" }, cue: notesCue([57, 60, 62, 64, 67, 69, 67, 64]) },
      exercises: [
        scale("A", "minor-pentatonic", "minor pentatonic"),
        scale("C", "major-pentatonic", "major pentatonic"),
        scale("E", "minor-pentatonic", "minor pentatonic"),
        scale("F", "minor-pentatonic", "minor pentatonic"),
        choice({ en: "Which two notes of A natural minor are removed to make A minor pentatonic?", ko: "A 내추럴 마이너에서 어떤 두 음을 빼면 펜타토닉?" }, ["B and F", "C and G", "D and E", "F and G"], 0, "Dropping the 2nd (B) and ♭6th (F) removes both semitone steps."),
      ],
      production: { en: "Minor pentatonic is the safest palette for vocal chops, acid riffs and basslines.", ko: "마이너 펜타토닉은 보컬 찹, 애시드, 베이스에 가장 안전한 팔레트." },
    },
    {
      id: "w2-modes",
      title: { en: "Modes", ko: "모드" },
      concept: [
        { en: "Modes are scales that change one or two notes of major/minor for a new colour.", ko: "모드는 메이저/마이너에서 한두 음을 바꿔 색을 바꾼 스케일." },
        { en: "Dorian = minor + ♮6. Phrygian = minor + ♭2. Lydian = major + ♯4. Mixolydian = major + ♭7.", ko: "도리안=마이너+♮6, 프리지안=마이너+♭2, 리디안=메이저+♯4, 믹소리디안=메이저+♭7." },
      ],
      demo: { label: { en: "D Dorian", ko: "D 도리안" }, cue: notesCue(scaleMidi(62, "dorian")) },
      exercises: [
        scale("D", "dorian", "Dorian"),
        scale("E", "phrygian", "Phrygian"),
        scale("F", "lydian", "Lydian"),
        scale("G", "mixolydian", "Mixolydian"),
        scale("A", "dorian", "Dorian"),
        scale("C", "dorian", "Dorian"),
        choice({ en: "Dorian differs from natural minor by…", ko: "도리안은 내추럴 마이너와 무엇이 다른가요?" }, [{ en: "a raised 6th", ko: "6음이 반음 높음" }, { en: "a lowered 2nd", ko: "2음이 반음 낮음" }, { en: "a raised 7th", ko: "7음이 반음 높음" }], 0, "A Dorian = A B C D E F# G. The F# (major 6th) brightens the minor sound."),
        choice({ en: "Which mode is major with a ♭7?", ko: "메이저에 ♭7이 있는 모드는?" }, ["Mixolydian", "Lydian", "Dorian", "Phrygian"], 0, "Mixolydian: funky, bluesy — think disco-house vamps."),
      ],
      production: { en: "Phrygian's ♭2 is pure dark-techno menace; Dorian's ♮6 is classic deep house soul.", ko: "프리지안의 ♭2는 다크 테크노, 도리안의 ♮6은 딥하우스 소울." },
    },
    {
      id: "w2-degrees",
      title: { en: "Scale degrees", ko: "음계 도수" },
      concept: [
        { en: "Number each scale note 1–7. Degree 1 is the tonic (home), 5 is the dominant.", ko: "스케일 음에 1–7 번호. 1도는 으뜸음, 5도는 딸림음." },
        { en: "Degrees let you think in any key: '1–♭3–5' works everywhere.", ko: "도수로 생각하면 어떤 키든 적용 가능." },
      ],
      exercises: [
        choice({ en: "What is degree 5 of C major?", ko: "C 메이저의 5도는?" }, ["G", "F", "A", "E"], 0, "C D E F G — the 5th note is G."),
        choice({ en: "In A minor, which degree is F?", ko: "A 마이너에서 F는 몇 도?" }, ["6", "5", "4", "7"], 0, "A B C D E F G → F is the 6th (♭6)."),
        choice({ en: "What is degree 4 of F major?", ko: "F 메이저의 4도는?" }, ["Bb", "B", "A", "C"], 0, "F G A Bb — spelled Bb, not A#, because each letter appears once."),
        choice({ en: "Degree 3 of E minor?", ko: "E 마이너의 3도는?" }, ["G", "G#", "F#", "A"], 0, "E F# G — minor 3rd = G."),
        choice({ en: "Degree 7 of D major?", ko: "D 메이저의 7도는?" }, ["C#", "C", "B", "Db"], 0, "D E F# G A B C# — the leading tone C# pulls up to D."),
      ],
    },
    {
      id: "w2-in-scale",
      title: { en: "Notes in a scale", ko: "스케일에 속한 음" },
      concept: [{ en: "Before writing a riff, know which 7 (or 5) notes belong. Everything else is chromatic spice.", ko: "리프를 쓰기 전에 어떤 음이 속하는지 알아두세요. 나머지는 크로매틱 양념." }],
      exercises: [
        choice({ en: "Which note is NOT in D major?", ko: "D 메이저에 없는 음은?" }, ["F", "F#", "C#", "B"], 0, "D major has F#, so F natural is outside."),
        choice({ en: "Which note IS in B♭ major?", ko: "B♭ 메이저에 있는 음은?" }, ["Eb", "E", "F#", "B"], 0, "Bb C D Eb F G A."),
        choice({ en: "Which note is NOT in E minor pentatonic?", ko: "E 마이너 펜타토닉에 없는 음은?" }, ["F#", "G", "A", "D"], 0, "E G A B D. F# is in E natural minor but not the pentatonic."),
        choice({ en: "G♭ in D major: in or out?", ko: "D 메이저에서 G♭은?" }, [{ en: "In (it's the same key as F#)", ko: "포함 (F#과 같은 건반)" }, { en: "Out", ko: "불포함" }], 0, "Pitch-wise Gb = F#, which is in D major. Correctly spelled, though, it's F#."),
      ],
    },
    {
      id: "w2-tonal-center",
      title: { en: "Tonal centre", ko: "조성의 중심" },
      concept: [
        { en: "C major and A minor share notes. The key is decided by which note feels like home.", ko: "C 메이저와 A 마이너는 같은 음. 어느 음이 '집'처럼 느껴지는지가 키를 결정." },
        { en: "Bass notes, repetition and phrase endings create the centre.", ko: "베이스, 반복, 프레이즈 끝음이 중심을 만듭니다." },
      ],
      exercises: [
        choice({ en: "Listen. Which note feels like home?", ko: "들어보세요. 어느 음이 '집' 같나요?" }, ["A", "C", "E", "G"], 0, "The phrase circles and lands on A over an A bass — A minor, even though all notes are white keys.", {
          ear: true,
          audio: { type: "steps", instrument: "lead", bpm: 112, notes: [{ step: 0, midi: 69, len: 2 }, { step: 2, midi: 72, len: 2 }, { step: 4, midi: 71, len: 2 }, { step: 6, midi: 67, len: 2 }, { step: 8, midi: 69, len: 4 }, { step: 12, midi: 64, len: 2 }, { step: 14, midi: 69, len: 2 }] },
        }),
        choice({ en: "A track uses only white keys and the bass sits on D. Which mode is it most likely?", ko: "흰 건반만 쓰고 베이스가 D에 머문다면?" }, ["D Dorian", "C major", "A minor", "D major"], 0, "White keys with D as home = D Dorian (D E F G A B C)."),
        choice({ en: "What most strongly defines the tonal centre in a club track?", ko: "클럽 트랙에서 조성 중심을 가장 강하게 정하는 것은?" }, [{ en: "The bass note on the downbeat", ko: "다운비트의 베이스 음" }, { en: "The hi-hat pattern", ko: "하이햇 패턴" }, { en: "The highest synth note", ko: "가장 높은 신스 음" }], 0, "Low, repeated bass notes on strong beats anchor the ear's sense of home."),
      ],
    },
    {
      id: "w2-boss",
      boss: true,
      title: { en: "Boss: The Scale Sphinx", ko: "보스: 스케일 스핑크스" },
      concept: [{ en: "Mixed challenge across World 2.", ko: "월드 2 종합 도전." }],
      exercises: [
        scale("Eb", "major", "major"),
        scale("B", "minor", "natural minor"),
        scale("A", "phrygian", "Phrygian"),
        scale("F#", "minor-pentatonic", "minor pentatonic"),
        choice({ en: "Which mode is major with a ♯4?", ko: "메이저에 ♯4가 있는 모드는?" }, ["Lydian", "Mixolydian", "Dorian", "Locrian"], 0, "Lydian — dreamy and floating."),
        choice({ en: "Relative major of E minor?", ko: "E 마이너의 나란한조 메이저는?" }, ["G major", "E major", "C major", "D major"], 0, "Up a minor 3rd from E → G."),
      ],
    },
  ]),

  world(3, "chords", { en: "Chords", ko: "코드" }, { en: "Stack notes, build moods", ko: "음을 쌓아 분위기 만들기" }, "#46b7a5", [
    {
      id: "w3-triads",
      title: { en: "Major & minor triads", ko: "장3화음과 단3화음" },
      concept: [
        { en: "Triad = root + 3rd + 5th. Major: M3 + m3 (4 + 3 semitones). Minor: m3 + M3 (3 + 4).", ko: "3화음 = 근음+3음+5음. 장: 4+3 반음. 단: 3+4 반음." },
      ],
      demo: { label: { en: "C major vs C minor", ko: "C 장 vs C 단" }, cue: { type: "progression", chords: [{ root: "C", type: "maj" }, { root: "C", type: "min" }], bpm: 80, withBass: false } },
      exercises: [chord("C", "maj", "C major"), chord("A", "min", "A minor"), chord("F", "maj", "F major"), chord("E", "min", "E minor"), chord("D", "maj", "D major"), chord("G", "min", "G minor")],
    },
    {
      id: "w3-dim-aug",
      title: { en: "Diminished & augmented", ko: "감3화음과 증3화음" },
      concept: [
        { en: "Diminished = two minor 3rds (3 + 3). Augmented = two major 3rds (4 + 4).", ko: "감3화음 = 단3도 두 개. 증3화음 = 장3도 두 개." },
        { en: "Both are unstable — great for tension before a drop.", ko: "둘 다 불안정 — 드롭 전 긴장감에 좋아요." },
      ],
      exercises: [
        chord("B", "dim", "B diminished"),
        chord("C", "aug", "C augmented"),
        chord("F#", "dim", "F# diminished"),
        chord("Eb", "aug", "Eb augmented"),
        choice({ en: "Which triad is built from two minor 3rds?", ko: "단3도 두 개로 된 3화음은?" }, ["diminished", "augmented", "minor", "major"], 0, "3 + 3 semitones = diminished (e.g. B D F)."),
      ],
    },
    {
      id: "w3-sevenths",
      title: { en: "Seventh chords", ko: "7화음" },
      concept: [
        { en: "Add a 7th to a triad. maj7 = major + M7. m7 = minor + m7. 7 (dominant) = major + m7.", ko: "3화음에 7음 추가. maj7, m7, 7(속7)." },
        { en: "Seventh chords are the sound of deep house.", ko: "7화음은 딥하우스의 소리." },
      ],
      demo: { label: { en: "Am7 → Dm7 (deep house)", ko: "Am7 → Dm7" }, cue: progCue([["A", "min7"], ["D", "min7"]], 118) },
      exercises: [chord("A", "min7", "A minor 7"), chord("C", "maj7", "Cmaj7"), chord("G", "dom7", "G7"), chord("D", "min7", "Dm7"), chord("B", "m7b5", "Bm7♭5"), chord("F", "maj7", "Fmaj7")],
      production: { en: "Am7 and Dm7 share C and A — swapping between them is the smoothest deep house move.", ko: "Am7과 Dm7은 공통음이 있어 매끄러운 딥하우스 움직임을 만들어요." },
    },
    {
      id: "w3-inversions",
      title: { en: "Inversions", ko: "자리바꿈" },
      concept: [
        { en: "Inversion = which chord tone is lowest. Root position: root in bass. 1st: 3rd in bass. 2nd: 5th in bass.", ko: "자리바꿈 = 가장 낮은 음이 무엇인지. 기본형, 1전위(3음), 2전위(5음)." },
      ],
      demo: { label: { en: "C: root, 1st, 2nd inversion", ko: "C 기본형, 1전위, 2전위" }, cue: notesCue([...chordMidi("C", "maj", 0, 60), ...chordMidi("C", "maj", 1, 60), ...chordMidi("C", "maj", 2, 60)]) },
      exercises: [
        chord("C", "maj", "C major, 1st inversion (E in bass)", { inversion: 1 }),
        chord("A", "min", "A minor, 1st inversion", { inversion: 1 }),
        chord("F", "maj", "F major, 2nd inversion (C in bass)", { inversion: 2 }),
        chord("G", "maj", "G major, 2nd inversion", { inversion: 2 }),
        choice({ en: "G – C – E (G lowest) is which inversion of C major?", ko: "G–C–E (G가 가장 낮음)는 C 메이저의 몇 전위?" }, [{ en: "2nd inversion", ko: "2전위" }, { en: "1st inversion", ko: "1전위" }, { en: "Root position", ko: "기본형" }], 0, "The 5th (G) is in the bass → 2nd inversion.", { show: [67, 72, 76] }),
      ],
    },
    {
      id: "w3-voicings",
      title: { en: "Voicings", ko: "보이싱" },
      concept: [
        { en: "A voicing is how you arrange chord tones: close (packed) or open (spread), doubled, or with extensions like the 9th.", ko: "보이싱 = 코드 음의 배치: 밀집/개방, 중복, 9음 같은 확장음." },
        { en: "Classic house stabs are minor 9ths or minor 7ths voiced in a narrow range.", ko: "클래식 하우스 스탭은 좁은 범위의 m9, m7." },
      ],
      exercises: [
        chord("A", "min9", "Am9 (A C E G B)"),
        chord("D", "min9", "Dm9"),
        choice({ en: "Spreading C–E–G into C–G–E (E an octave up) makes it…", ko: "C–E–G를 C–G–E(E를 한 옥타브 위로)로 바꾸면?" }, [{ en: "an open voicing", ko: "개방 보이싱" }, { en: "a different chord", ko: "다른 코드" }, { en: "an inversion", ko: "자리바꿈" }], 0, "Same notes, same bass — just spread out. Open voicings sound wider and clearer."),
        choice({ en: "Why do producers often drop the root from chord stabs?", ko: "프로듀서가 코드 스탭에서 근음을 빼는 이유는?" }, [{ en: "The bassline already plays it", ko: "베이스라인이 이미 연주해서" }, { en: "Roots are dissonant", ko: "근음이 불협화음이라서" }, { en: "Ableton can't play it", ko: "에이블턴이 못 연주해서" }], 0, "Leaving the root to the bass keeps the mid-range clean and the chord colourful."),
      ],
    },
    {
      id: "w3-construction",
      title: { en: "Chord construction", ko: "코드 구성" },
      concept: [{ en: "Any chord = a root + a formula. Learn formulas, not shapes.", ko: "모든 코드 = 근음 + 공식. 모양이 아닌 공식을 익히세요." }],
      exercises: [
        chord("Eb", "min7", "Ebm7"),
        chord("Ab", "maj", "A♭ major"),
        chord("E", "dom7", "E7"),
        choice({ en: "C minor 7 = C + …", ko: "Cm7 = C + …" }, ["Eb G Bb", "E G Bb", "Eb G B", "E G B"], 0, "m3 (Eb) + P5 (G) + m7 (Bb)."),
        choice({ en: "Which interval separates a maj7 chord from a dominant 7 chord?", ko: "maj7과 속7화음의 차이는?" }, [{ en: "The 7th (M7 vs m7)", ko: "7음 (장7 vs 단7)" }, { en: "The 3rd", ko: "3음" }, { en: "The 5th", ko: "5음" }], 0, "Both are major triads; maj7 has a major 7th, dom7 a minor 7th."),
      ],
    },
    {
      id: "w3-ear-chords",
      title: { en: "Chords by ear", ko: "귀로 코드 듣기" },
      concept: [{ en: "Major sounds bright, minor dark, diminished tense, augmented eerie.", ko: "장=밝음, 단=어두움, 감=긴장, 증=기묘함." }],
      exercises: [earC(["maj", "min"]), earC(["maj", "min", "dim", "aug"]), earC(["maj7", "min7", "dom7"]), earC(["min7", "dom7"]), earC(["min", "min7", "min9"])],
    },
    {
      id: "w3-boss",
      boss: true,
      title: { en: "Boss: The Chord Panther", ko: "보스: 코드 표범" },
      concept: [{ en: "Mixed challenge across World 3.", ko: "월드 3 종합 도전." }],
      exercises: [
        chord("Bb", "maj7", "B♭maj7"),
        chord("F#", "min7", "F#m7"),
        chord("D", "dom7", "D7"),
        chord("E", "min", "E minor, 1st inversion", { inversion: 1 }),
        earC(["maj", "min", "dim", "aug"]),
        earC(["maj7", "min7", "dom7"]),
      ],
    },
  ]),

  world(4, "progressions", { en: "Harmonic Progressions", ko: "화성 진행" }, { en: "How chords move and why", ko: "코드는 어떻게, 왜 움직이나" }, "#8fa8c8", [
    {
      id: "w4-diatonic",
      title: { en: "Diatonic harmony", ko: "다이아토닉 화성" },
      concept: [
        { en: "Build a triad on every note of a scale using only scale notes → 7 diatonic chords.", ko: "스케일 음만으로 각 음 위에 3화음 → 7개의 다이아토닉 코드." },
        { en: "Major key: I ii iii IV V vi vii°. Minor key: i ii° III iv v VI VII.", ko: "메이저: I ii iii IV V vi vii°. 마이너: i ii° III iv v VI VII." },
      ],
      demo: { label: { en: "All 7 chords of C major", ko: "C 메이저의 7개 코드" }, cue: progCue([["C", "maj"], ["D", "min"], ["E", "min"], ["F", "maj"], ["G", "maj"], ["A", "min"], ["B", "dim"]], 130, false) },
      exercises: [
        choice({ en: "In C major, which chord is built on degree 2?", ko: "C 메이저 2도 위의 코드는?" }, ["Dm", "D", "Ddim", "Dm7b5"], 0, "D F A — all white keys, minor quality → ii."),
        chord("C", "maj", "the IV chord of G major"),
        choice({ en: "In A natural minor, the chord on degree 5 is…", ko: "A 내추럴 마이너의 5도 코드는?" }, ["Em", "E", "E7", "Edim"], 0, "E G B → v (minor). Raising G to G# (harmonic minor) gives a major V."),
        choice({ en: "Which chord is diminished in a major key?", ko: "메이저 키에서 감화음인 것은?" }, ["vii°", "ii", "iii", "V"], 0, "Built on the leading tone: B D F in C major."),
      ],
    },
    {
      id: "w4-roman",
      title: { en: "Roman numeral analysis", ko: "로마 숫자 분석" },
      concept: [{ en: "Roman numerals name chords by scale degree: UPPER = major, lower = minor, ° = diminished.", ko: "로마 숫자는 도수로 코드를 표기: 대문자=장, 소문자=단, °=감." }],
      demo: { label: { en: "Am – F – C – G", ko: "Am – F – C – G" }, cue: progCue([["A", "min"], ["F", "maj"], ["C", "maj"], ["G", "maj"]]) },
      exercises: [
        choice({ en: "Am – F – C – G in A minor is…", ko: "A 마이너에서 Am – F – C – G는?" }, ["i – VI – III – VII", "vi – IV – I – V", "i – iv – v – i", "I – VI – III – VII"], 0, "Relative to A: F is ♭6 (VI), C is ♭3 (III), G is ♭7 (VII). In C major the same chords would be vi–IV–I–V."),
        choice({ en: "Dm7 – G7 – Cmaj7 in C major is…", ko: "C 메이저에서 Dm7 – G7 – Cmaj7은?" }, ["ii7 – V7 – Imaj7", "IV – V – I", "ii – IV – I", "vi7 – V7 – Imaj7"], 0, "The famous ii–V–I."),
        choice({ en: "In a minor key, the chord on ♭7 is written…", ko: "마이너 키에서 7도 코드는?" }, ["VII", "vii°", "vii", "V7"], 0, "Natural minor's 7th degree carries a major triad (G in A minor) → VII."),
      ],
    },
    {
      id: "w4-functions",
      title: { en: "Tonic, predominant, dominant", ko: "토닉, 프리도미넌트, 도미넌트" },
      concept: [
        { en: "Tonic (I, vi, iii) = home. Predominant (ii, IV) = moving away. Dominant (V, vii°) = tension that wants home.", ko: "토닉=집, 프리도미넌트=떠남, 도미넌트=돌아가고 싶은 긴장." },
      ],
      exercises: [
        { kind: "complete-progression", tonic: "C", scale: "major", degrees: [2, 5, 1], missing: 1, options: [5, 4, 6], prompt: { en: "Complete the ii – ? – I cadence", ko: "ii – ? – I 종지를 완성하세요" }, alsoWorks: [{ degree: 4, why: "ii–IV–I is a softer, 'plagal' route home — less pull than V." }], explanation: "V contains the leading tone (B) which pulls up to C." },
        choice({ en: "Which function does V have?", ko: "V의 기능은?" }, [{ en: "dominant", ko: "도미넌트" }, { en: "tonic", ko: "토닉" }, { en: "predominant", ko: "프리도미넌트" }], 0, "V creates tension resolving to I."),
        choice({ en: "Which chord can substitute for I as a tonic chord?", ko: "I 대신 토닉으로 쓸 수 있는 코드는?" }, ["vi", "V", "IV", "vii°"], 0, "vi shares two notes with I (C–E in Am vs C) — a 'deceptive' home."),
      ],
    },
    {
      id: "w4-common",
      title: { en: "Common progressions", ko: "자주 쓰는 진행" },
      concept: [{ en: "A few progressions power thousands of tracks. Learn them as degree patterns.", ko: "몇 가지 진행이 수천 곡을 움직여요. 도수 패턴으로 익히세요." }],
      exercises: [
        { kind: "complete-progression", tonic: "A", scale: "minor", degrees: [1, 6, 3, 7], missing: 2, options: [3, 5, 2], prompt: { en: "i – VI – ? – VII (A minor)", ko: "i – VI – ? – VII (A 마이너)" }, alsoWorks: [{ degree: 5, why: "Em (v) also works — darker, with less lift." }], explanation: "i–VI–III–VII is an epic minor loop used across trance and progressive house." },
        { kind: "complete-progression", tonic: "C", scale: "major", degrees: [1, 5, 6, 4], missing: 3, options: [4, 7, 3], prompt: { en: "I – V – vi – ? (C major)", ko: "I – V – vi – ? (C 메이저)" }, alsoWorks: [{ degree: 3, why: "iii instead of IV keeps it moody; less resolution back to I." }], explanation: "IV (F) is predominant — it sets up the return to I." },
        { kind: "complete-progression", tonic: "A", scale: "minor", degrees: [1, 4, 5, 1], missing: 1, options: [4, 3, 7], prompt: { en: "i – ? – v – i (A minor)", ko: "i – ? – v – i (A 마이너)" }, alsoWorks: [{ degree: 7, why: "VII–v is unusual but modal-sounding." }], explanation: "iv (Dm) is the minor predominant." },
      ],
    },
    {
      id: "w4-voice-leading",
      title: { en: "Voice leading", ko: "성부 진행" },
      concept: [
        { en: "Move each chord voice the shortest distance to the next chord. Keep common tones still.", ko: "각 성부를 다음 코드로 가장 짧게 이동. 공통음은 유지." },
        { en: "Smooth voicings = pads that glide instead of jump.", ko: "매끄러운 보이싱 = 점프하지 않고 미끄러지는 패드." },
      ],
      demo: { label: { en: "C → F → G → C, voice-led", ko: "C → F → G → C (성부 진행)" }, cue: progCue([["C", "maj"], ["F", "maj"], ["G", "maj"], ["C", "maj"]], 100) },
      exercises: [
        choice({ en: "C major → A minor: which notes stay the same?", ko: "C → Am: 그대로 유지되는 음은?" }, ["C and E", "G and A", "E and G", "None"], 0, "C E G → A C E: only G moves (up to A)."),
        chord("F", "maj", "F major closest to C4–E4–G4 (C in bass)", { inversion: 2, hint: { en: "Keep C, move E up to F and G up to A.", ko: "C 유지, E→F, G→A." } }),
        choice({ en: "Am7 → Dm7: how many common tones?", ko: "Am7 → Dm7 공통음은 몇 개?" }, ["2", "0", "1", "3"], 0, "A C E G vs D F A C → A and C are shared."),
      ],
    },
    {
      id: "w4-tension",
      title: { en: "Tension & resolution", ko: "긴장과 해결" },
      concept: [{ en: "The tritone inside a dominant 7 (B–F in G7) is unstable; resolving it inward (B→C, F→E) feels like release.", ko: "속7화음 안의 트라이톤(G7의 B–F)이 안쪽으로 해결될 때 해소감." }],
      exercises: [
        choice({ en: "Listen: which chord creates the tension?", ko: "들어보세요: 긴장을 만드는 코드는?" }, ["the second (G7)", "the first (C)", "the last (C)"], 0, "G7 contains the tritone B–F, which resolves to C–E.", { ear: true, audio: progCue([["C", "maj"], ["G", "dom7"], ["C", "maj"]], 90) }),
        choice({ en: "Which interval is the 'engine' of a dominant 7th?", ko: "속7화음의 '엔진'인 음정은?" }, ["tritone", "perfect 5th", "major 3rd", "octave"], 0, "The 3rd and 7th of a dom7 form a tritone."),
        { kind: "complete-progression", tonic: "A", scale: "harmonic-minor", degrees: [1, 4, 5, 1], missing: 2, options: [5, 3, 6], prompt: { en: "Am – Dm – ? – Am (harmonic minor)", ko: "Am – Dm – ? – Am (화성 단음계)" }, explanation: "Harmonic minor raises G to G#, making V = E major, a strong pull home." },
      ],
    },
    {
      id: "w4-modal",
      title: { en: "Modal harmony", ko: "모달 화성" },
      concept: [{ en: "Modal tracks stay on the tonic chord and add the mode's 'colour note' — e.g. Dorian's ♮6 — instead of using V–I.", ko: "모달 트랙은 토닉 위에 머물며 모드의 '색깔 음'을 강조해요." }],
      demo: { label: { en: "Dm7 – G7 Dorian vamp", ko: "Dm7 – G7 도리안 뱀프" }, cue: progCue([["D", "min7"], ["G", "dom7"], ["D", "min7"], ["G", "dom7"]], 120) },
      exercises: [
        choice({ en: "In the D Dorian vamp Dm7 – G7, which note gives the Dorian colour?", ko: "D 도리안 뱀프 Dm7 – G7에서 도리안 색을 주는 음은?" }, ["B (the ♮6)", "F (the ♭3)", "C (the ♭7)", "A (the 5th)"], 0, "B is the major 6th of D — in natural minor it would be Bb. G7 contains that B."),
        choice({ en: "A Phrygian vamp often moves i → ♭II. In E Phrygian that's…", ko: "E 프리지안의 i → ♭II는?" }, ["Em → F", "Em → F#m", "Em → D", "Em → Am"], 0, "The ♭2 (F) is the Phrygian colour note."),
      ],
    },
    {
      id: "w4-minimal",
      title: { en: "Minimal chord movement", ko: "최소한의 코드 움직임" },
      concept: [{ en: "Two chords sharing most notes create motion without breaking the hypnotic feel.", ko: "공통음이 많은 두 코드는 몰입감을 깨지 않고 움직임을 만들어요." }],
      exercises: [
        choice({ en: "Which pair changes only ONE note?", ko: "한 음만 바뀌는 쌍은?" }, ["Am → Fmaj7 (A C E → F A C E)", "Am → G", "Am → Bdim", "C → D"], 0, "Fmaj7 contains all of Am plus an F in the bass — a one-note colour shift."),
        { kind: "complete-progression", tonic: "A", scale: "minor", degrees: [1, 6], missing: 1, options: [6, 2, 5], prompt: { en: "Two-chord minimal loop: Am – ? (repeat)", ko: "투코드 미니멀 루프: Am – ? (반복)" }, alsoWorks: [{ degree: 5, why: "Em also shares E with Am — slightly more movement." }], explanation: "F shares A and C with Am: maximum continuity, gentle movement." },
      ],
    },
    {
      id: "w4-boss",
      boss: true,
      title: { en: "Boss: The Progression Lynx", ko: "보스: 진행 스라소니" },
      concept: [{ en: "Mixed challenge across World 4.", ko: "월드 4 종합 도전." }],
      exercises: [
        { kind: "complete-progression", tonic: "G", scale: "major", degrees: [1, 4, 5, 1], missing: 2, options: [5, 3, 6], prompt: { en: "I – IV – ? – I in G", ko: "G 키 I – IV – ? – I" }, explanation: "D (V) is the dominant of G." },
        choice({ en: "F – G – Am in C major is…", ko: "C 메이저의 F – G – Am은?" }, ["IV – V – vi", "I – II – iii", "IV – V – I", "ii – V – vi"], 0, "The 'deceptive' move: V goes to vi instead of I."),
        chord("E", "dom7", "the V7 of A harmonic minor"),
      ],
    },
  ]),

  world(5, "melody-bass", { en: "Melody & Basslines", ko: "멜로디와 베이스라인" }, { en: "Lines that fit the harmony", ko: "화성에 맞는 라인" }, "#e07a5f", [
    {
      id: "w5-chord-tones",
      title: { en: "Chord tones", ko: "코드 톤" },
      concept: [{ en: "Melody notes that belong to the current chord sound stable. Strong beats + chord tones = solid.", ko: "현재 코드에 속한 멜로디 음은 안정적. 강박 + 코드 톤 = 단단함." }],
      exercises: [
        { kind: "fix-melody", tonic: "A", scale: "minor", chord: { root: "A", type: "min" }, melody: [69, 72, 76, 74, 72, 74, 72, 71], editable: [7], mustBeChordTone: [7], prompt: { en: "This phrase over Am ends unresolved. Change the last note so it lands on a chord tone.", ko: "Am 위의 이 프레이즈는 해결되지 않고 끝나요. 마지막 음을 코드 톤으로 바꾸세요." } },
        { kind: "fix-melody", tonic: "C", scale: "major", chord: { root: "F", type: "maj7" }, melody: [65, 67, 69, 71, 72, 71, 74, 74], editable: [6, 7], mustBeChordTone: [7], prompt: { en: "Over Fmaj7, make the final note a chord tone (F A C E).", ko: "Fmaj7 위에서 마지막 음을 코드 톤으로 (F A C E)." } },
        choice({ en: "Which notes are chord tones of Dm7?", ko: "Dm7의 코드 톤은?" }, ["D F A C", "D F# A C", "D F A B", "D E F A"], 0, "Root D, m3 F, P5 A, m7 C."),
      ],
    },
    {
      id: "w5-non-chord",
      title: { en: "Passing & neighbour tones", ko: "경과음과 보조음" },
      concept: [
        { en: "Passing tone: a step between two chord tones (C–D–E over C).", ko: "경과음: 두 코드 톤 사이를 잇는 음 (C 위의 C–D–E)." },
        { en: "Neighbour tone: step away and back (E–F–E). These are colour, not mistakes.", ko: "보조음: 갔다가 돌아오기 (E–F–E). 실수가 아니라 색깔." },
      ],
      exercises: [
        choice({ en: "Over C major, the D in C–D–E is a…", ko: "C 위의 C–D–E에서 D는?" }, [{ en: "passing tone", ko: "경과음" }, { en: "neighbour tone", ko: "보조음" }, { en: "chord tone", ko: "코드 톤" }], 0, "It passes by step between two chord tones.", { audio: { type: "notes", midis: [60, 62, 64], mode: "melody" } }),
        choice({ en: "Over A minor, the B in A–B–A is a…", ko: "Am 위의 A–B–A에서 B는?" }, [{ en: "neighbour tone", ko: "보조음" }, { en: "passing tone", ko: "경과음" }, { en: "wrong note", ko: "틀린 음" }], 0, "It steps away from A and returns."),
        { kind: "fix-melody", tonic: "D", scale: "dorian", chord: { root: "D", type: "min7" }, melody: [62, 64, 65, 67, 69, 71, 69, 71], editable: [7], mustBeChordTone: [7], prompt: { en: "Over Dm7, keep the colourful B on note 6 but resolve the last note.", ko: "Dm7 위에서 6번째 B는 유지하고 마지막 음을 해결하세요." } },
      ],
    },
    {
      id: "w5-call-response",
      title: { en: "Call and response", ko: "콜 앤 리스폰스" },
      concept: [{ en: "A phrase asks (often ending open), the next answers (often ending on the tonic). Contrast + connection.", ko: "한 프레이즈가 묻고 (열린 끝), 다음이 답해요 (토닉으로 끝). 대비 + 연결." }],
      exercises: [
        { kind: "call-response", tonic: "A", scale: "minor", chord: { root: "A", type: "min7" }, low: 57, bpm: 120, call: [{ step: 0, midi: 69, len: 2 }, { step: 3, midi: 72, len: 1 }, { step: 4, midi: 76, len: 3 }, { step: 8, midi: 74, len: 2 }, { step: 12, midi: 72, len: 2 }, { step: 16, midi: 74, len: 6 }], prompt: { en: "Write a 2-bar answer to this call (bars 3–4).", ko: "이 콜에 대한 2마디 응답을 쓰세요 (3–4마디)." } },
      ],
    },
    {
      id: "w5-motif",
      title: { en: "Motifs & variation", ko: "모티프와 변주" },
      concept: [{ en: "A motif is a short idea. Vary it by transposing, inverting, changing rhythm, or changing one note.", ko: "모티프는 짧은 아이디어. 이조, 전위, 리듬 변화, 한 음 변경으로 변주." }],
      exercises: [
        choice({ en: "A–C–E → C–E–G keeps the shape but moves it up. That's…", ko: "A–C–E → C–E–G (모양 유지, 위로 이동)는?" }, [{ en: "transposition", ko: "이조" }, { en: "inversion", ko: "전위" }, { en: "retrograde", ko: "역행" }], 0, "Same contour, different starting note (diatonic transposition)."),
        choice({ en: "Playing a motif backwards is called…", ko: "모티프를 거꾸로 연주하는 것은?" }, [{ en: "retrograde", ko: "역행" }, { en: "augmentation", ko: "확대" }, { en: "inversion", ko: "전위" }], 0, "Retrograde = reverse order."),
        choice({ en: "Shifting the same riff one 16th later is…", ko: "같은 리프를 16분음표 하나 늦추는 것은?" }, [{ en: "rhythmic displacement", ko: "리듬 이동" }, { en: "transposition", ko: "이조" }, { en: "modulation", ko: "전조" }], 0, "A staple of minimal techno — same notes, new groove."),
      ],
    },
    {
      id: "w5-bassline",
      title: { en: "Basslines from chord tones", ko: "코드 톤 베이스라인" },
      concept: [{ en: "Anchor each chord with its root (or 5th/3rd) on the downbeat, then fill with octaves, passing tones and off-beats.", ko: "각 코드 시작을 근음(또는 5음/3음)으로, 나머지는 옥타브, 경과음, 엇박으로." }],
      exercises: [
        { kind: "bassline", tonic: "A", scale: "minor", chords: [{ root: "A", type: "min7" }, { root: "F", type: "maj7" }], low: 33, bpm: 122, prompt: { en: "Build a 1-bar bassline over Am7 → Fmaj7 (8 steps each).", ko: "Am7 → Fmaj7 위에 1마디 베이스라인 (각 8스텝)." } },
        choice({ en: "When the bass plays the 3rd of the chord instead of the root, the chord sounds…", ko: "베이스가 근음 대신 3음을 치면?" }, [{ en: "like a 1st inversion — lighter", ko: "1전위처럼 — 더 가벼움" }, { en: "wrong", ko: "틀림" }, { en: "like a different key", ko: "다른 키처럼" }], 0, "The bass note defines the inversion: 3rd in the bass = 1st inversion."),
      ],
    },
    {
      id: "w5-rhythm",
      title: { en: "Rhythmic placement", ko: "리듬 배치" },
      concept: [{ en: "Where a note lands matters as much as which note. Off-beats bounce; downbeats anchor.", ko: "음의 위치는 음 자체만큼 중요. 엇박은 튀고, 정박은 고정." }],
      exercises: [
        choice({ en: "In a 16-step bar, which steps are the off-beat 8ths (the 'and')?", ko: "16스텝에서 8분 엇박은 몇 번째 스텝?" }, ["3, 7, 11, 15", "1, 5, 9, 13", "2, 4, 6, 8", "4, 8, 12, 16"], 0, "Counting from 1: 1 e & a → '&' falls on 3, 7, 11, 15."),
        { kind: "bassline", tonic: "D", scale: "dorian", chords: [{ root: "D", type: "min7" }], low: 38, bpm: 124, prompt: { en: "One chord, Dm7: write a bouncy bassline using at least two off-beats.", ko: "Dm7 하나: 엇박을 최소 2개 쓰는 통통 튀는 베이스라인." } },
      ],
    },
    {
      id: "w5-boss",
      boss: true,
      title: { en: "Boss: The Bassline Bobcat", ko: "보스: 베이스라인 밥캣" },
      concept: [{ en: "Mixed challenge across World 5.", ko: "월드 5 종합 도전." }],
      exercises: [
        { kind: "fix-melody", tonic: "E", scale: "minor", chord: { root: "E", type: "min" }, melody: [64, 67, 71, 69, 67, 66, 69, 72], editable: [6, 7], mustBeChordTone: [7], prompt: { en: "Over Em, resolve the ending.", ko: "Em 위에서 끝을 해결하세요." } },
        { kind: "bassline", tonic: "C", scale: "minor", chords: [{ root: "C", type: "min" }, { root: "Ab", type: "maj" }], low: 36, bpm: 124, prompt: { en: "Bassline over Cm → A♭.", ko: "Cm → A♭ 베이스라인." } },
      ],
    },
  ]),

  world(6, "electronic", { en: "Electronic Music Application", ko: "전자음악 응용" }, { en: "Theory for the club", ko: "클럽을 위한 이론" }, "#a3c45a", [
    {
      id: "w6-house",
      title: { en: "House chord progressions", ko: "하우스 코드 진행" },
      concept: [{ en: "House loves 7ths and 9ths moving between two to four chords, often minor with Dorian colour.", ko: "하우스는 7, 9화음을 2–4개 코드로 순환, 주로 도리안 색의 마이너." }],
      demo: { label: { en: "Am9 – Dm9 offbeat stabs", ko: "Am9 – Dm9 엇박 스탭" }, cue: progCue([["A", "min9"], ["D", "min9"]], 122) },
      exercises: [
        { kind: "complete-progression", tonic: "A", scale: "dorian", degrees: [1, 4, 1, 4], missing: 1, options: [4, 5, 6], sevenths: true, prompt: { en: "A Dorian house loop: Am7 – ? – Am7 – ?", ko: "A 도리안 하우스 루프: Am7 – ? – Am7 – ?" }, alsoWorks: [{ degree: 5, why: "Em7 works too — a darker, more 'Aeolian' shade." }], explanation: "D7 contains F#, the Dorian colour note, so it screams deep house." },
        choice({ en: "Classic deep house stab chord?", ko: "클래식 딥하우스 스탭 코드는?" }, ["minor 9th", "augmented", "diminished 7th", "power chord"], 0, "m9 stabs: lush but compact."),
      ],
    },
    {
      id: "w6-minor-grooves",
      title: { en: "Minor-key grooves", ko: "마이너 그루브" },
      concept: [{ en: "One minor chord + a moving bassline can carry an entire techno track.", ko: "마이너 코드 하나 + 움직이는 베이스로 트랙 전체가 가능." }],
      exercises: [
        { kind: "bassline", tonic: "F", scale: "minor", chords: [{ root: "F", type: "min7" }], low: 29, bpm: 128, prompt: { en: "A rolling groove over Fm7 — anchor F on step 1, then explore.", ko: "Fm7 위의 롤링 그루브 — 1스텝에 F, 그다음 자유롭게." } },
        choice({ en: "Which scale is the safest for a minor groove bassline?", ko: "마이너 그루브 베이스에 가장 안전한 스케일은?" }, ["minor pentatonic", "Lydian", "major", "whole tone"], 0, "No semitones, all notes fit a minor chord."),
      ],
    },
    {
      id: "w6-acid",
      title: { en: "Acid bassline note selection", ko: "애시드 베이스 음 선택" },
      concept: [{ en: "Acid lines mix root, octave, ♭3, ♭7 and a sneaky ♭2 or ♭5 for squelchy tension. Slides and accents do the rest.", ko: "애시드는 근음, 옥타브, ♭3, ♭7과 ♭2/♭5로 긴장감. 슬라이드와 액센트가 나머지." }],
      demo: { label: { en: "Original acid phrase in A Phrygian", ko: "A 프리지안 애시드 프레이즈" }, cue: { type: "steps", instrument: "bass", bpm: 130, drums: true, notes: [{ step: 0, midi: 33, len: 1 }, { step: 2, midi: 45, len: 1 }, { step: 3, midi: 34, len: 1 }, { step: 5, midi: 33, len: 1 }, { step: 6, midi: 43, len: 1 }, { step: 8, midi: 36, len: 2 }, { step: 11, midi: 45, len: 1 }, { step: 13, midi: 34, len: 1 }, { step: 14, midi: 33, len: 2 }] } },
      exercises: [
        choice({ en: "Which note adds the most 'evil' squelch over an A acid bassline?", ko: "A 애시드 베이스에 가장 '사악한' 느낌을 주는 음은?" }, ["Bb (♭2)", "E (5th)", "A (octave)", "C (♭3)"], 0, "The ♭2 sits a semitone above the root — Phrygian darkness."),
        { kind: "bassline", tonic: "A", scale: "phrygian", chords: [{ root: "A", type: "min" }], low: 33, bpm: 130, prompt: { en: "Write a 16-step acid line in A Phrygian. Use the ♭2 (Bb) once.", ko: "A 프리지안 16스텝 애시드 라인. ♭2(Bb)를 한 번 사용." } },
      ],
    },
    {
      id: "w6-pedal",
      title: { en: "Pedal tones", ko: "페달 톤" },
      concept: [{ en: "A pedal tone holds one bass note while chords change above it — tension without losing the groove.", ko: "페달 톤: 베이스를 고정하고 위의 코드만 변화 — 그루브를 유지하며 긴장." }],
      demo: { label: { en: "A pedal under Am – F – G", ko: "Am – F – G 아래 A 페달" }, cue: { type: "progression", chords: [{ root: "A", type: "min" }, { root: "F", type: "maj" }, { root: "G", type: "maj" }, { root: "A", type: "min" }], bpm: 120, withBass: false } },
      exercises: [
        choice({ en: "Bass holds A while chords go Am → F → G. Over G, the A is…", ko: "베이스 A 고정, 코드 Am → F → G. G 위의 A는?" }, [{ en: "a non-chord tone creating tension", ko: "긴장을 만드는 비화성음" }, { en: "the root of G", ko: "G의 근음" }, { en: "a mistake", ko: "실수" }], 0, "A is the 9th (2nd) of G — a deliberate clash that resolves when Am returns."),
        choice({ en: "Pedal tones are especially useful in…", ko: "페달 톤이 특히 유용한 곳은?" }, [{ en: "long builds and breakdowns", ko: "긴 빌드업과 브레이크다운" }, { en: "drum fills only", ko: "드럼 필만" }, { en: "never in techno", ko: "테크노에선 안 씀" }], 0, "A static bass keeps DJs and dancers grounded while harmony shifts."),
      ],
    },
    {
      id: "w6-stabs",
      title: { en: "Chord stabs", ko: "코드 스탭" },
      concept: [{ en: "Stabs are short chords on off-beats. Keep them in a narrow mid range; leave the root to the bass.", ko: "스탭은 엇박의 짧은 코드. 중음역에 좁게, 근음은 베이스에게." }],
      exercises: [chord("C", "min9", "Cm9 stab"), chord("G", "min7", "Gm7 stab"), choice({ en: "Where do house stabs usually sit?", ko: "하우스 스탭의 일반적 위치는?" }, [{ en: "on the off-beat 8ths", ko: "8분 엇박" }, { en: "on every kick", ko: "킥마다" }, { en: "only on bar 1", ko: "1마디에만" }], 0, "Off-beats interlock with the four-on-the-floor kick.")],
    },
    {
      id: "w6-static-tension",
      title: { en: "Tension without chord changes", ko: "코드 변화 없는 긴장감" },
      concept: [{ en: "Change the melody's relationship to a static chord: move from chord tones to 9ths, 11ths, ♭2s — then back.", ko: "고정된 코드 위에서 멜로디를 코드 톤 → 9, 11, ♭2 → 다시 코드 톤으로." }],
      exercises: [
        { kind: "fix-melody", tonic: "A", scale: "minor", chord: { root: "A", type: "min7" }, melody: [76, 76, 71, 71, 74, 74, 71, 70], editable: [7], mustBeChordTone: [7], prompt: { en: "Static Am7. Keep the B and D tensions, but release the final note.", ko: "고정된 Am7. B와 D 긴장은 유지, 마지막 음을 해소하세요." } },
        choice({ en: "Which does NOT add tension over a static chord?", ko: "고정 코드에 긴장을 더하지 않는 것은?" }, [{ en: "doubling the root", ko: "근음 중복" }, { en: "a rising filter", ko: "필터 상승" }, { en: "melody on the ♭2", ko: "멜로디 ♭2" }, { en: "a sus4 stab", ko: "sus4 스탭" }], 0, "Doubling the root reinforces stability."),
      ],
    },
    {
      id: "w6-long-form",
      title: { en: "Harmony for long arrangements", ko: "긴 편곡을 위한 화성" },
      concept: [{ en: "In 6–8 minute club tracks, harmony changes are events. Save chord changes for phrase boundaries (8, 16, 32 bars).", ko: "6–8분 클럽 트랙에서 코드 변화는 이벤트. 8, 16, 32마디 경계에 배치." }],
      exercises: [
        choice({ en: "Best place to introduce a new chord in a DJ-friendly track?", ko: "DJ 친화적 트랙에서 새 코드를 넣기 좋은 위치?" }, [{ en: "at a 16- or 32-bar boundary", ko: "16 또는 32마디 경계" }, { en: "bar 7 of 8", ko: "8마디 중 7마디" }, { en: "randomly", ko: "무작위" }], 0, "Phrase boundaries match DJ mixing and dancers' expectations."),
        choice({ en: "You loop Am for 64 bars. A subtle way to add a lift?", ko: "Am을 64마디 반복 중. 미묘한 상승을 주려면?" }, [{ en: "switch to A Dorian colour (add F#)", ko: "A 도리안 색 (F# 추가)" }, { en: "change key to Eb major", ko: "Eb 메이저로 전조" }, { en: "remove the kick forever", ko: "킥 영구 제거" }], 0, "One colour note changes the mood without breaking the hypnosis."),
      ],
    },
    {
      id: "w6-boss",
      boss: true,
      title: { en: "Boss: The Warehouse Tiger", ko: "보스: 웨어하우스 호랑이" },
      concept: [{ en: "Mixed challenge across World 6.", ko: "월드 6 종합 도전." }],
      exercises: [
        chord("F", "min9", "Fm9 stab"),
        { kind: "bassline", tonic: "G", scale: "minor", chords: [{ root: "G", type: "min7" }, { root: "Eb", type: "maj7" }], low: 31, bpm: 126, prompt: { en: "Bassline over Gm7 → E♭maj7.", ko: "Gm7 → E♭maj7 베이스라인." } },
      ],
    },
  ]),

  world(7, "composition", { en: "Composition Lab", ko: "작곡 랩" }, { en: "Make your own track ideas", ko: "나만의 트랙 아이디어" }, "#ece4d2", [
    {
      id: "w7-progression",
      title: { en: "Build a 4-bar progression", ko: "4마디 진행 만들기" },
      concept: [{ en: "Pick a key, choose 4 diatonic chords, start or end on the tonic.", ko: "키를 고르고, 다이아토닉 코드 4개, 토닉으로 시작하거나 끝내기." }],
      labTask: { en: "Open the Lab, choose a minor key and write 4 chords. Listen with smooth voicing.", ko: "랩에서 마이너 키를 고르고 코드 4개를 써보세요." },
      exercises: [
        { kind: "complete-progression", tonic: "E", scale: "minor", degrees: [1, 6, 7, 1], missing: 2, options: [7, 4, 3], prompt: { en: "Your 4-bar loop: Em – C – ? – Em. Pick a chord.", ko: "4마디 루프: Em – C – ? – Em." }, alsoWorks: [{ degree: 4, why: "Am (iv) — softer, more melancholic." }, { degree: 3, why: "G (III) — brighter, more uplifting." }], explanation: "D (VII) rises a whole tone back to Em: the 'Aeolian cadence'." },
      ],
    },
    {
      id: "w7-bass",
      title: { en: "Compose a bassline", ko: "베이스라인 작곡" },
      concept: [{ en: "Roots on bar starts, then add movement: octaves, 5ths, off-beats.", ko: "마디 시작에 근음, 그다음 옥타브, 5도, 엇박으로 움직임." }],
      labTask: { en: "In the Lab, write a bassline under your progression and play it with drums.", ko: "랩에서 진행 아래 베이스라인을 쓰고 드럼과 함께 재생." },
      exercises: [{ kind: "bassline", tonic: "E", scale: "minor", chords: [{ root: "E", type: "min" }, { root: "C", type: "maj" }], low: 28, bpm: 124, prompt: { en: "Em → C bassline.", ko: "Em → C 베이스라인." } }],
    },
    {
      id: "w7-melody",
      title: { en: "Write a call-and-response melody", ko: "콜 앤 리스폰스 멜로디" },
      concept: [{ en: "2 bars ask, 2 bars answer. Reuse rhythm, change the ending.", ko: "2마디 질문, 2마디 대답. 리듬은 재사용, 끝은 바꾸기." }],
      exercises: [
        { kind: "call-response", tonic: "E", scale: "minor", chord: { root: "E", type: "min" }, low: 59, bpm: 124, call: [{ step: 0, midi: 71, len: 2 }, { step: 2, midi: 74, len: 2 }, { step: 6, midi: 71, len: 2 }, { step: 8, midi: 69, len: 4 }, { step: 14, midi: 67, len: 2 }, { step: 16, midi: 66, len: 8 }], prompt: { en: "Answer this call in E minor.", ko: "E 마이너로 이 콜에 답하세요." } },
      ],
    },
    {
      id: "w7-variation",
      title: { en: "Harmonic variation", ko: "화성적 변주" },
      concept: [{ en: "Repeat the loop, but change one chord, its quality, or its voicing the second time.", ko: "루프를 반복하되, 두 번째에 코드 하나·성질·보이싱을 바꾸기." }],
      exercises: [
        choice({ en: "Loop: Am – F – C – G. A subtle variation for bars 5–8?", ko: "루프 Am – F – C – G. 5–8마디 미묘한 변주?" }, [{ en: "Am – F – C – Esus4 → E", ko: "Am – F – C – Esus4 → E" }, { en: "Completely new key", ko: "완전히 새 키" }, { en: "Remove all chords", ko: "코드 전부 제거" }], 0, "Swapping the last chord for a sus4→V creates a turnaround while keeping identity."),
      ],
    },
    {
      id: "w7-expand",
      title: { en: "Expand to 8 and 16 bars", ko: "8, 16마디로 확장" },
      concept: [{ en: "A A' B A: repeat, vary, contrast, return. Use the Lab's expand buttons.", ko: "A A' B A: 반복, 변주, 대비, 복귀. 랩의 확장 버튼 활용." }],
      labTask: { en: "Use 'Expand' in the Lab to grow 4 bars into 8 or 16 with variation.", ko: "랩의 '확장'으로 4마디를 8, 16마디로." },
      exercises: [choice({ en: "In an A A' B A 16-bar form, what is A'?", ko: "A A' B A 형식에서 A'는?" }, [{ en: "A varied repeat of A", ko: "A의 변주 반복" }, { en: "A totally new section", ko: "완전히 새 섹션" }, { en: "Silence", ko: "침묵" }], 0, "A' keeps A's identity but changes a detail — often the last chord or melody note.")],
    },
    {
      id: "w7-export",
      title: { en: "Export to Ableton", ko: "에이블턴으로 내보내기" },
      concept: [{ en: "Export MIDI, drag the .mid into Ableton: each track (chords, bass, melody, drums) lands on its own MIDI track with the tempo.", ko: "MIDI를 내보내 Ableton에 드래그: 각 트랙이 별도 MIDI 트랙으로 템포와 함께." }],
      labTask: { en: "Click 'Export MIDI' in the Lab and drop the file into Ableton Live.", ko: "랩에서 'MIDI 내보내기' 클릭 후 에이블턴에 드롭." },
      exercises: [choice({ en: "Drums in the exported MIDI are on channel…", ko: "내보낸 MIDI의 드럼 채널은?" }, ["10 (GM drums)", "1", "16", "none"], 0, "Kick = 36 (C1), clap = 39, hat = 42 — maps to Ableton's Drum Rack defaults.")],
    },
  ]),
];

export const ALL_LESSONS: Lesson[] = WORLDS.flatMap((w) => w.lessons);
export const ALL_EXERCISES: ExerciseDef[] = ALL_LESSONS.flatMap((l) => l.exercises);

export function getLesson(id: string): Lesson | undefined {
  return ALL_LESSONS.find((l) => l.id === id);
}
export function getWorld(id: number): World | undefined {
  return WORLDS.find((w) => w.id === id);
}
export function nextLesson(id: string): Lesson | undefined {
  const i = ALL_LESSONS.findIndex((l) => l.id === id);
  return i >= 0 ? ALL_LESSONS[i + 1] : undefined;
}
