"use client";
import { audio } from "@/lib/audio/engine";
import { diatonicChords, FUNCTION_COLORS } from "@/lib/theory/harmony";
import { CHORD_TYPES, CHORD_TYPE_IDS, ChordType, chordMidi } from "@/lib/theory/chords";
import { COMMON_TONICS } from "@/lib/theory/notes";
import type { ScaleId } from "@/lib/theory/scales";
import { ProgChord, resolveChord } from "@/lib/music/progression";
import { cn } from "@/lib/utils";

interface Props {
  tonic: string;
  scale: ScaleId;
  chords: ProgChord[];
  onChange: (index: number, c: ProgChord) => void;
  activeIndex?: number | null;
}

/** Editable row of chord slots with Roman numeral + function analysis. */
export function ChordSlots({ tonic, scale, chords, onChange, activeIndex }: Props) {
  const dia = diatonicChords(tonic, scale, false);
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      {chords.map((c, i) => {
        const r = resolveChord(tonic, scale, c);
        const color = r.fn === "chromatic" ? "#e07a5f" : FUNCTION_COLORS[r.fn];
        return (
          <div key={i} className={cn("flex flex-col gap-1.5 rounded-2xl border border-border bg-card p-2.5 transition-all", activeIndex === i && "scale-[1.03] border-lime")}>
            <div className="flex items-center justify-between text-[10px] font-bold uppercase text-muted-foreground">
              <span>Bar {i + 1}</span>
              <span style={{ color }}>{r.fn}</span>
            </div>
            <button
              onClick={() => audio.playNotes(chordMidi(r.root, r.type, 0, 52), 1.2)}
              className="rounded-xl py-1 text-center hover:bg-secondary"
              aria-label={`Play ${r.symbol}`}
            >
              <span className="block text-2xl font-black" style={{ color }}>
                {r.roman}
              </span>
              <span className="block text-sm font-bold">{r.symbol}</span>
            </button>
            <select
              aria-label={`Bar ${i + 1} chord`}
              value={c.root ? "custom" : String(c.degree)}
              onChange={(e) => {
                const v = e.target.value;
                if (v === "custom") onChange(i, { ...c, root: r.root, override: r.type });
                else onChange(i, { degree: Number(v), seventh: c.seventh });
              }}
              className="h-8 rounded-lg border border-border bg-secondary px-1 text-xs font-bold"
            >
              {dia.map((d) => (
                <option key={d.degree} value={d.degree}>
                  {d.roman} · {d.symbol}
                </option>
              ))}
              <option value="custom">Custom / borrowed…</option>
            </select>
            {c.root !== undefined && (
              <div className="flex gap-1">
                <select aria-label="Custom root" value={c.root} onChange={(e) => onChange(i, { ...c, root: e.target.value })} className="h-8 flex-1 rounded-lg border border-border bg-secondary px-1 text-xs font-bold">
                  {COMMON_TONICS.map((n) => (
                    <option key={n}>{n}</option>
                  ))}
                </select>
                <select aria-label="Custom quality" value={c.override ?? "maj"} onChange={(e) => onChange(i, { ...c, override: e.target.value as ChordType })} className="h-8 flex-1 rounded-lg border border-border bg-secondary px-1 text-xs font-bold">
                  {CHORD_TYPE_IDS.map((t) => (
                    <option key={t} value={t}>
                      {CHORD_TYPES[t].symbol || "maj"}
                    </option>
                  ))}
                </select>
              </div>
            )}
            {c.root === undefined && (
              <label className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground">
                <input type="checkbox" checked={c.seventh} onChange={(e) => onChange(i, { ...c, seventh: e.target.checked, override: undefined })} /> 7th
              </label>
            )}
          </div>
        );
      })}
    </div>
  );
}
