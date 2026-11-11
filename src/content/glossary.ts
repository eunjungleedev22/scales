/**
 * English music-theory terms with their Korean equivalents and a short Korean definition.
 * Explanations in the app stay in English; these annotate terms inline (e.g. "semitone" → 반음).
 */
export interface GlossaryEntry {
  /** English spellings to match (case-insensitive, whole words) */
  terms: string[];
  /** Korean word */
  ko: string;
  /** Short Korean definition */
  def: string;
}

export const GLOSSARY: GlossaryEntry[] = [
  // Notes & intervals
  { terms: ["semitone", "semitones", "half step", "half steps"], ko: "반음", def: "건반에서 바로 옆 건반까지의 거리. 가장 작은 음 간격." },
  { terms: ["whole tone", "whole tones", "whole step", "whole steps"], ko: "온음", def: "반음 두 개 거리. 예: C에서 D." },
  { terms: ["sharp", "sharps"], ko: "샵 (올림표 ♯)", def: "음을 반음 올리는 기호." },
  { terms: ["flat", "flats"], ko: "플랫 (내림표 ♭)", def: "음을 반음 내리는 기호." },
  { terms: ["accidental", "accidentals"], ko: "임시표", def: "♯, ♭, ♮처럼 음높이를 바꾸는 기호." },
  { terms: ["enharmonic", "enharmonic equivalents", "enharmonically"], ko: "이명동음", def: "이름은 다르지만 같은 건반(같은 높이)인 음. 예: C♯ = D♭." },
  { terms: ["octave", "octaves"], ko: "옥타브", def: "반음 12개 거리. 같은 음 이름, 주파수는 2배." },
  { terms: ["pitch class", "pitch classes"], ko: "음고류", def: "옥타브와 상관없이 같은 이름의 음 묶음. 예: 모든 C." },
  { terms: ["interval", "intervals"], ko: "음정", def: "두 음 사이의 거리." },
  { terms: ["unison"], ko: "완전1도 (동음)", def: "같은 높이의 두 음." },
  { terms: ["minor 2nd"], ko: "단2도", def: "반음 1개 거리의 음정." },
  { terms: ["major 2nd"], ko: "장2도", def: "반음 2개(온음) 거리의 음정." },
  { terms: ["minor 3rd", "minor 3rds", "minor third"], ko: "단3도", def: "반음 3개 거리. 단화음의 핵심, 어두운 느낌." },
  { terms: ["major 3rd", "major 3rds", "major third"], ko: "장3도", def: "반음 4개 거리. 장화음의 핵심, 밝은 느낌." },
  { terms: ["perfect 4th", "perfect fourth"], ko: "완전4도", def: "반음 5개 거리. 열린, 비어 있는 느낌." },
  { terms: ["tritone"], ko: "트라이톤 (증4도/감5도)", def: "반음 6개 거리. 가장 불안정해서 해결하고 싶어지는 음정." },
  { terms: ["perfect 5th", "perfect fifth", "fifths"], ko: "완전5도", def: "반음 7개 거리. 가장 안정적이고 힘 있는 음정." },
  { terms: ["minor 6th"], ko: "단6도", def: "반음 8개 거리의 음정." },
  { terms: ["major 6th"], ko: "장6도", def: "반음 9개 거리의 음정." },
  { terms: ["minor 7th"], ko: "단7도", def: "반음 10개 거리. 블루지·펑키한 색." },
  { terms: ["major 7th"], ko: "장7도", def: "반음 11개 거리. 몽환적인 딥하우스 색." },
  { terms: ["melodic"], ko: "선율적 (차례로)", def: "두 음을 하나씩 차례로 연주하는 방식." },
  { terms: ["harmonic interval", "harmonic intervals"], ko: "화성적 (동시에)", def: "두 음을 동시에 연주하는 방식." },
  { terms: ["solfège", "solfege"], ko: "계이름", def: "도, 레, 미…처럼 음을 부르는 이름." },

  // Scales & keys
  { terms: ["scale", "scales"], ko: "음계 (스케일)", def: "정해진 간격으로 배열된 음들의 집합." },
  { terms: ["major scale"], ko: "장음계", def: "온-온-반-온-온-온-반 패턴의 밝은 음계." },
  { terms: ["natural minor"], ko: "자연단음계", def: "온-반-온-온-반-온-온 패턴의 어두운 음계." },
  { terms: ["harmonic minor"], ko: "화성단음계", def: "자연단음계에서 7음을 반음 올린 음계. 강한 해결감." },
  { terms: ["pentatonic"], ko: "5음 음계 (펜타토닉)", def: "다섯 개 음으로 된 음계. 반음 충돌이 없어 안전함." },
  { terms: ["mode", "modes"], ko: "선법 (모드)", def: "같은 음들을 다른 음에서 시작해 새로운 색을 만든 음계." },
  { terms: ["Ionian"], ko: "이오니안 선법", def: "장음계와 같음." },
  { terms: ["Dorian"], ko: "도리안 선법", def: "단음계 + 높은 6음. 소울풀한 딥하우스 느낌." },
  { terms: ["Phrygian"], ko: "프리지안 선법", def: "단음계 + 낮은 2음. 어둡고 위협적인 테크노 느낌." },
  { terms: ["Lydian"], ko: "리디안 선법", def: "장음계 + 높은 4음. 떠다니는 몽환적 느낌." },
  { terms: ["Mixolydian"], ko: "믹소리디안 선법", def: "장음계 + 낮은 7음. 펑키·블루지한 느낌." },
  { terms: ["Aeolian"], ko: "에올리안 선법", def: "자연단음계와 같음." },
  { terms: ["Locrian"], ko: "로크리안 선법", def: "으뜸화음이 감화음인 불안정한 선법." },
  { terms: ["tonic"], ko: "으뜸음 (토닉)", def: "음계의 1음, 음악의 '집'." },
  { terms: ["subdominant"], ko: "버금딸림음", def: "음계의 4음." },
  { terms: ["leading tone"], ko: "이끈음", def: "으뜸음 반음 아래의 7음. 으뜸음으로 강하게 끌림." },
  { terms: ["scale degree", "scale degrees", "degree", "degrees"], ko: "음도 (음계 도수)", def: "음계 안에서 몇 번째 음인지 나타내는 번호 (1–7)." },
  { terms: ["relative minor", "relative major", "relative keys"], ko: "나란한조", def: "같은 음들을 공유하는 장조와 단조. 예: C장조–A단조." },
  { terms: ["tonal centre", "tonal center", "tonal centers"], ko: "조성의 중심", def: "곡에서 '집'처럼 느껴지는 음." },
  { terms: ["chromatic"], ko: "반음계적", def: "음계 밖의 음을 사용하는 것." },

  // Chords
  { terms: ["chord", "chords"], ko: "화음 (코드)", def: "세 개 이상의 음을 함께 울리는 것." },
  { terms: ["triad", "triads"], ko: "3화음", def: "근음, 3음, 5음으로 된 화음." },
  { terms: ["root"], ko: "근음", def: "화음의 기준이 되는 가장 기본 음." },
  { terms: ["diminished"], ko: "감 (감화음)", def: "단3도 + 단3도. 긴장되고 불안정한 화음." },
  { terms: ["augmented"], ko: "증 (증화음)", def: "장3도 + 장3도. 기묘하고 떠 있는 화음." },
  { terms: ["seventh chord", "seventh chords", "7th chord", "7th chords"], ko: "7화음", def: "3화음 위에 7음을 더한 화음." },
  { terms: ["dominant 7th", "dominant seventh", "dom7"], ko: "속7화음", def: "장3화음 + 단7도. 으뜸화음으로 강하게 해결하려 함." },
  { terms: ["half-diminished"], ko: "반감7화음", def: "감3화음 + 단7도 (m7♭5)." },
  { terms: ["suspended", "sus4", "sus2"], ko: "계류화음 (sus)", def: "3음 대신 2음이나 4음을 쓴 화음. 장/단이 정해지지 않음." },
  { terms: ["inversion", "inversions"], ko: "자리바꿈 (전위)", def: "근음이 아닌 음을 가장 낮게 놓은 화음 배치." },
  { terms: ["root position"], ko: "기본 위치", def: "근음이 가장 낮은 화음 배치." },
  { terms: ["voicing", "voicings", "voiced"], ko: "보이싱 (화음 배치)", def: "화음의 음들을 어떤 높이와 순서로 놓을지 정하는 것." },
  { terms: ["open voicing", "open voicings"], ko: "개방 배치", def: "화음 음들을 넓게 펼친 배치." },
  { terms: ["extension", "extensions", "9th", "9ths"], ko: "확장음 (텐션)", def: "7음 위에 더한 9, 11, 13음 등." },
  { terms: ["stab", "stabs"], ko: "스탭", def: "짧게 끊어 치는 화음. 하우스의 엇박 코드." },

  // Harmony
  { terms: ["diatonic"], ko: "다이아토닉 (온음계적)", def: "음계 안의 음만 사용하는 것." },
  { terms: ["Roman numeral", "Roman numerals"], ko: "로마 숫자 표기", def: "화음을 음도 번호로 표기 (I, ii, V…). 대문자=장, 소문자=단." },
  { terms: ["function", "functions"], ko: "화성 기능", def: "화음이 진행 안에서 하는 역할 (토닉, 프리도미넌트, 도미넌트)." },
  { terms: ["predominant"], ko: "버금딸림 기능 (프리도미넌트)", def: "집에서 떠나 도미넌트를 준비하는 역할 (ii, IV)." },
  { terms: ["dominant"], ko: "딸림 (도미넌트)", def: "5음 또는 5도 화음. 으뜸화음으로 돌아가려는 긴장을 만듦." },
  { terms: ["cadence", "cadences"], ko: "종지", def: "프레이즈를 마무리하는 화음 진행." },
  { terms: ["plagal"], ko: "변격 종지", def: "IV → I 로 끝나는 부드러운 종지 ('아멘' 종지)." },
  { terms: ["deceptive"], ko: "거짓 종지 (위종지)", def: "V 다음에 I 대신 vi로 가는 진행." },
  { terms: ["progression", "progressions"], ko: "화성 진행 (코드 진행)", def: "화음이 이어지는 순서." },
  { terms: ["voice leading", "voice-led"], ko: "성부 진행", def: "각 음(성부)이 다음 화음으로 움직이는 방식. 짧게 움직일수록 매끄러움." },
  { terms: ["common tone", "common tones"], ko: "공통음", def: "두 화음이 함께 가진 음." },
  { terms: ["tension"], ko: "긴장", def: "해결되고 싶은 불안정한 느낌." },
  { terms: ["resolution", "resolve", "resolves", "resolved", "resolving"], ko: "해결", def: "긴장된 음이나 화음이 안정된 곳으로 이동하는 것." },
  { terms: ["modal"], ko: "선법적 (모달)", def: "장/단조 대신 선법의 색깔을 중심으로 하는 것." },
  { terms: ["vamp", "vamps"], ko: "뱀프 (반복 진행)", def: "두세 개 화음을 계속 반복하는 진행." },
  { terms: ["borrowed"], ko: "차용화음", def: "같은 으뜸음의 다른 조/선법에서 빌려온 화음." },

  // Melody & bass
  { terms: ["chord tone", "chord tones"], ko: "화성음 (코드 톤)", def: "현재 화음에 속한 음." },
  { terms: ["non-chord tone", "non-chord tones"], ko: "비화성음", def: "현재 화음에 속하지 않는 음. 색깔과 긴장을 더함." },
  { terms: ["passing tone", "passing tones"], ko: "경과음", def: "두 화성음 사이를 순차적으로 잇는 음." },
  { terms: ["neighbour tone", "neighbor tone", "neighbour tones", "neighbor tones"], ko: "보조음", def: "화성음에서 한 음 떠났다가 다시 돌아오는 음." },
  { terms: ["call and response", "call-and-response"], ko: "메기고 받기 (콜 앤 리스폰스)", def: "한 프레이즈가 묻고 다음 프레이즈가 답하는 구조." },
  { terms: ["motif", "motifs"], ko: "동기 (모티프)", def: "짧고 기억에 남는 음악 아이디어." },
  { terms: ["transposition", "transposing", "transpose"], ko: "이조", def: "모양을 유지한 채 다른 높이로 옮기는 것." },
  { terms: ["retrograde"], ko: "역행", def: "선율을 거꾸로 연주하는 것." },
  { terms: ["rhythmic displacement"], ko: "리듬 이동", def: "같은 리프를 박자 위치만 옮기는 것." },
  { terms: ["contour"], ko: "선율 윤곽", def: "선율이 올라가고 내려가는 모양." },
  { terms: ["bassline", "basslines"], ko: "베이스라인", def: "가장 낮은 음역의 선율. 화성의 토대." },
  { terms: ["off-beat", "off-beats", "offbeat"], ko: "엇박", def: "박과 박 사이 (8분음표의 '앤드')." },
  { terms: ["downbeat", "downbeats"], ko: "강박 (다운비트)", def: "마디나 박의 첫 번째, 가장 강한 박." },
  { terms: ["syncopation"], ko: "당김음", def: "약박을 강조해 리듬을 비트는 것." },
  { terms: ["pedal tone", "pedal tones", "pedal"], ko: "페달음 (지속음)", def: "화음이 바뀌어도 계속 유지되는 베이스 음." },
  { terms: ["phrase", "phrases"], ko: "악구 (프레이즈)", def: "음악의 한 문장 단위." },
  { terms: ["groove"], ko: "그루브", def: "리듬이 만들어내는 몸이 움직이는 느낌." },
];

interface IndexedTerm {
  term: string;
  entry: GlossaryEntry;
}

const INDEX: IndexedTerm[] = GLOSSARY.flatMap((entry) => entry.terms.map((term) => ({ term, entry }))).sort((a, b) => b.term.length - a.term.length);

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** One regex that matches any glossary term as a whole word (longest first). */
export const GLOSSARY_REGEX = new RegExp(`(?<![\\w-])(${INDEX.map((t) => escape(t.term)).join("|")})(?![\\w-])`, "gi");

export function lookupTerm(match: string): GlossaryEntry | undefined {
  const lower = match.toLowerCase();
  return INDEX.find((t) => t.term.toLowerCase() === lower)?.entry;
}

export interface TextSegment {
  text: string;
  entry?: GlossaryEntry;
}

/**
 * Split English text into plain and glossary segments.
 * Each glossary entry is annotated only at its first occurrence within `seen` (pass a shared Set to dedupe across blocks).
 */
export function segmentText(text: string, seen: Set<GlossaryEntry> = new Set()): TextSegment[] {
  const out: TextSegment[] = [];
  let last = 0;
  for (const m of text.matchAll(GLOSSARY_REGEX)) {
    const entry = lookupTerm(m[0]);
    const idx = m.index ?? 0;
    if (!entry || seen.has(entry)) continue;
    seen.add(entry);
    if (idx > last) out.push({ text: text.slice(last, idx) });
    out.push({ text: m[0], entry });
    last = idx + m[0].length;
  }
  if (last < text.length) out.push({ text: text.slice(last) });
  return out;
}

/** All distinct glossary entries that appear in the given texts. */
export function termsIn(texts: string[]): GlossaryEntry[] {
  const seen = new Set<GlossaryEntry>();
  for (const t of texts) for (const m of t.matchAll(GLOSSARY_REGEX)) {
    const e = lookupTerm(m[0]);
    if (e) seen.add(e);
  }
  return [...seen];
}
