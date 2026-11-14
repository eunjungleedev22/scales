/**
 * "Go deeper" readings from Working in Harmony, a free textbook by Gabriel Fankhauser
 * (University of North Georgia), licensed CC BY 4.0: https://faculty.ung.edu/gfankhauser/
 * Several lesson intros adapt its teaching approach (scale-degree tendencies, the interval method,
 * consonance tiers, voice-leading rules, V7 resolution, cadences). Wording in this app is our own.
 */
const BASE = "https://faculty.ung.edu/gfankhauser/index.fld/";
const U1 = `${BASE}Fankhauser%20-%20Harmony%201%20August%202026.pdf`;
const U2 = `${BASE}Fankhauser%20-%20Harmony%202%20August%202026.pdf`;
const U4 = `${BASE}Fankhauser%20-%20Harmony%204%20August%202026.pdf`;

export const BOOK = { title: "Working in Harmony", author: "Gabriel Fankhauser", license: "CC BY 4.0", home: "https://faculty.ung.edu/gfankhauser/" };

export interface Reading {
  chapter: string;
  url: string;
}

const r = (pdf: string, page: number | null, chapter: string): Reading => ({ chapter, url: page ? `${pdf}#page=${page}` : pdf });

const CH1 = r(U1, 13, "Ch. 1: Clefs and Pitch Notation");
const CH2 = r(U1, 19, "Ch. 2: Scales and Scale Degrees");
const CH2_SPELL = r(U1, 20, "Ch. 2: Spelling and Context");
const CH2_MINOR = r(U1, 21, "Ch. 2: Minor Scales");
const CH2_TEND = r(U1, 22, "Ch. 2: Scale Degree Tendencies");
const CH3 = r(U1, 38, "Ch. 3: Key Signatures");
const CH4 = r(U1, 47, "Ch. 4: Intervals");
const CH5 = r(U1, 56, "Ch. 5: Consonance and Dissonance");
const CH8 = r(U1, 91, "Ch. 8: Triads");
const CH10 = r(U2, 6, "Ch. 10: Smooth Voice Leading");
const CH12 = r(U2, 25, "Ch. 12: Roman-Numeral Analysis");
const CH14 = r(U2, 47, "Ch. 14: Passing and Neighboring Tones");
const CH16 = r(U2, 55, "Ch. 16: Dominant Seventh Chord");
const CH17 = r(U2, 62, "Ch. 17: Triads in Inversion");
const CH18 = r(U2, 81, "Ch. 18: Cadences");
const CH23 = r(U2, 144, "Ch. 23: Diatonic Seventh Chords");
const CH25 = r(U2, 174, "Ch. 25: Phrase and Periodic Structure");
const CH38 = r(U4, null, "Ch. 38: Modes and Pitch Collections");

export const READINGS: Record<string, Reading> = {
  "w1-keyboard": CH1,
  "w1-steps": CH2,
  "w1-accidentals": CH2_SPELL,
  "w1-octaves": CH1,
  "w1-intervals": CH4,
  "w1-ear-intervals": CH5,
  "w2-major": CH2,
  "w2-minor": CH2_MINOR,
  "w2-modes": CH38,
  "w2-degrees": CH2_TEND,
  "w2-in-scale": CH3,
  "w2-tonal-center": CH2_TEND,
  "w3-triads": CH8,
  "w3-dim-aug": CH8,
  "w3-construction": CH8,
  "w3-ear-chords": CH8,
  "w3-sevenths": CH23,
  "w3-inversions": CH17,
  "w3-voicings": CH10,
  "w4-diatonic": CH12,
  "w4-roman": CH12,
  "w4-functions": CH18,
  "w4-common": CH12,
  "w4-voice-leading": CH10,
  "w4-tension": CH16,
  "w4-modal": CH38,
  "w4-minimal": CH10,
  "w5-chord-tones": CH14,
  "w5-non-chord": CH14,
  "w5-call-response": CH25,
  "w5-motif": CH25,
};
