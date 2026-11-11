/**
 * Minimal, dependency-free Standard MIDI File (SMF type 1) writer.
 * Produces files that Ableton Live (and any DAW) can import.
 */

export const PPQ = 480;

export interface MidiNoteEvent {
  /** MIDI pitch 0–127 */
  midi: number;
  /** Start in quarter-note beats */
  start: number;
  /** Duration in quarter-note beats */
  duration: number;
  /** 1–127 */
  velocity?: number;
}

export interface MidiTrack {
  name: string;
  /** 0–15. Use 9 for General MIDI drums. */
  channel?: number;
  notes: MidiNoteEvent[];
}

export interface MidiSong {
  bpm: number;
  tracks: MidiTrack[];
  /** Time signature numerator/denominator, default 4/4 */
  timeSignature?: [number, number];
  name?: string;
}

/** Encode a number as a MIDI variable-length quantity. */
export function vlq(value: number): number[] {
  if (value < 0 || !Number.isFinite(value)) throw new Error(`Invalid VLQ value ${value}`);
  let v = Math.floor(value);
  const bytes = [v & 0x7f];
  v >>= 7;
  while (v > 0) {
    bytes.unshift((v & 0x7f) | 0x80);
    v >>= 7;
  }
  return bytes;
}

function u32(n: number): number[] {
  return [(n >>> 24) & 0xff, (n >>> 16) & 0xff, (n >>> 8) & 0xff, n & 0xff];
}
function u16(n: number): number[] {
  return [(n >>> 8) & 0xff, n & 0xff];
}
function ascii(s: string): number[] {
  return Array.from(s).map((c) => {
    const code = c.charCodeAt(0);
    return code < 128 ? code : 63; // '?'
  });
}

interface AbsEvent {
  tick: number;
  /** order: 0 = meta, 1 = note-off, 2 = note-on (offs before ons at the same tick) */
  order: number;
  bytes: number[];
}

function chunk(type: string, data: number[]): number[] {
  return [...ascii(type), ...u32(data.length), ...data];
}

function encodeTrack(events: AbsEvent[]): number[] {
  const sorted = [...events].sort((a, b) => a.tick - b.tick || a.order - b.order);
  const data: number[] = [];
  let last = 0;
  for (const e of sorted) {
    data.push(...vlq(e.tick - last), ...e.bytes);
    last = e.tick;
  }
  data.push(...vlq(0), 0xff, 0x2f, 0x00); // end of track
  return chunk("MTrk", data);
}

export const beatsToTicks = (beats: number): number => Math.round(beats * PPQ);

/** Build a type-1 SMF as bytes. Track 0 carries tempo and time signature. */
export function writeMidi(song: MidiSong): Uint8Array {
  const [num, den] = song.timeSignature ?? [4, 4];
  const mpqn = Math.round(60_000_000 / Math.max(1, song.bpm));
  const conductor: AbsEvent[] = [
    { tick: 0, order: 0, bytes: [0xff, 0x03, ...vlq(ascii(song.name ?? "Harmonic Cat").length), ...ascii(song.name ?? "Harmonic Cat")] },
    { tick: 0, order: 0, bytes: [0xff, 0x51, 0x03, (mpqn >> 16) & 0xff, (mpqn >> 8) & 0xff, mpqn & 0xff] },
    { tick: 0, order: 0, bytes: [0xff, 0x58, 0x04, num, Math.log2(den), 24, 8] },
  ];
  const trackChunks = [encodeTrack(conductor)];

  for (const track of song.tracks) {
    const ch = (track.channel ?? 0) & 0x0f;
    const evs: AbsEvent[] = [{ tick: 0, order: 0, bytes: [0xff, 0x03, ...vlq(ascii(track.name).length), ...ascii(track.name)] }];
    for (const n of track.notes) {
      if (n.duration <= 0) continue;
      const pitch = Math.max(0, Math.min(127, Math.round(n.midi)));
      const vel = Math.max(1, Math.min(127, Math.round(n.velocity ?? 100)));
      const on = beatsToTicks(n.start);
      const off = Math.max(on + 1, beatsToTicks(n.start + n.duration));
      evs.push({ tick: on, order: 2, bytes: [0x90 | ch, pitch, vel] });
      evs.push({ tick: off, order: 1, bytes: [0x80 | ch, pitch, 0] });
    }
    trackChunks.push(encodeTrack(evs));
  }

  const header = chunk("MThd", [...u16(1), ...u16(trackChunks.length), ...u16(PPQ)]);
  const all = [...header, ...trackChunks.flat()];
  return new Uint8Array(all);
}

/** Trigger a browser download of a MIDI song. */
export function downloadMidi(song: MidiSong, filename: string): void {
  const bytes = writeMidi(song);
  const blob = new Blob([bytes as BlobPart], { type: "audio/midi" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename.endsWith(".mid") ? filename : `${filename}.mid`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/* ---------- Minimal reader (used by tests to verify round-trips) ---------- */

export interface ParsedNote {
  track: number;
  channel: number;
  midi: number;
  startTick: number;
  endTick: number;
  velocity: number;
}

export interface ParsedMidi {
  format: number;
  ntracks: number;
  ppq: number;
  tempoMpqn: number | null;
  notes: ParsedNote[];
  /** raw event order per track: [tick, status] */
  order: Array<Array<[number, number]>>;
}

export function readMidi(bytes: Uint8Array): ParsedMidi {
  let p = 0;
  const str = (n: number) => String.fromCharCode(...bytes.slice(p, (p += n)));
  const r32 = () => ((bytes[p++] << 24) | (bytes[p++] << 16) | (bytes[p++] << 8) | bytes[p++]) >>> 0;
  const r16 = () => (bytes[p++] << 8) | bytes[p++];
  const rvlq = () => {
    let v = 0;
    let b: number;
    do {
      b = bytes[p++];
      v = (v << 7) | (b & 0x7f);
    } while (b & 0x80);
    return v;
  };
  if (str(4) !== "MThd") throw new Error("Not a MIDI file");
  r32();
  const format = r16();
  const ntracks = r16();
  const ppq = r16();
  let tempo: number | null = null;
  const notes: ParsedNote[] = [];
  const order: Array<Array<[number, number]>> = [];
  for (let t = 0; t < ntracks; t++) {
    if (str(4) !== "MTrk") throw new Error("Bad track chunk");
    const len = r32();
    const end = p + len;
    let tick = 0;
    const open = new Map<string, ParsedNote>();
    const ord: Array<[number, number]> = [];
    while (p < end) {
      tick += rvlq();
      const status = bytes[p++];
      ord.push([tick, status]);
      if (status === 0xff) {
        const type = bytes[p++];
        const l = rvlq();
        if (type === 0x51) tempo = (bytes[p] << 16) | (bytes[p + 1] << 8) | bytes[p + 2];
        p += l;
      } else {
        const kind = status & 0xf0;
        const ch = status & 0x0f;
        const a = bytes[p++];
        const b = bytes[p++];
        const key = `${ch}:${a}`;
        if (kind === 0x90 && b > 0) {
          const n: ParsedNote = { track: t, channel: ch, midi: a, startTick: tick, endTick: -1, velocity: b };
          open.set(key, n);
          notes.push(n);
        } else if (kind === 0x80 || (kind === 0x90 && b === 0)) {
          const n = open.get(key);
          if (n) {
            n.endTick = tick;
            open.delete(key);
          }
        }
      }
    }
    order.push(ord);
    p = end;
  }
  return { format, ntracks, ppq, tempoMpqn: tempo, notes, order };
}
