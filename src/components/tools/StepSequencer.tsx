"use client";
import { useMemo } from "react";
import type { StepNote } from "@/lib/music/events";
import { mod12, noteColor, pcName } from "@/lib/theory/notes";
import { cn } from "@/lib/utils";

export interface StepSequencerProps {
  steps: number;
  /** MIDI notes for rows, listed high → low */
  rows: number[];
  notes: StepNote[];
  onChange: (notes: StepNote[]) => void;
  /** Note length for newly placed notes (in steps) */
  noteLength?: number;
  playhead?: number | null;
  /** Read-only notes drawn faintly (e.g. a call phrase) */
  ghost?: StepNote[];
  /** Labels across regions (e.g. chord names), evenly spread */
  regionLabels?: string[];
  /** Steps that are locked (can't be edited), e.g. call phrase area */
  lockedBefore?: number;
  /** Highlight rows that are chord tones per step */
  isHighlightRow?: (midi: number, step: number) => boolean;
  preferFlats?: boolean;
  label?: string;
}

/** Remove/truncate notes so that the sequence stays monophonic around `step`. */
export function placeMono(notes: StepNote[], n: StepNote): StepNote[] {
  const out: StepNote[] = [];
  for (const x of notes) {
    if (x.step === n.step) continue; // replaced
    if (x.step < n.step && x.step + x.len > n.step) out.push({ ...x, len: n.step - x.step });
    else if (x.step > n.step && x.step < n.step + n.len) continue; // swallowed by new note
    else out.push(x);
  }
  return [...out, n].sort((a, b) => a.step - b.step);
}

export function toggleNote(notes: StepNote[], step: number, midi: number, len: number, maxSteps: number): StepNote[] {
  const existing = notes.find((n) => n.step === step && n.midi === midi);
  if (existing) return notes.filter((n) => n !== existing);
  return placeMono(notes, { step, midi, len: Math.min(len, maxSteps - step) });
}

export function StepSequencer({
  steps,
  rows,
  notes,
  onChange,
  noteLength = 1,
  playhead,
  ghost = [],
  regionLabels,
  lockedBefore = 0,
  isHighlightRow,
  preferFlats,
  label = "Step sequencer",
}: StepSequencerProps) {
  const cover = useMemo(() => {
    const m = new Map<string, { start: boolean; note: StepNote }>();
    for (const n of notes) for (let s = n.step; s < n.step + n.len; s++) m.set(`${s}:${n.midi}`, { start: s === n.step, note: n });
    return m;
  }, [notes]);
  const ghostCover = useMemo(() => {
    const m = new Set<string>();
    for (const n of ghost) for (let s = n.step; s < n.step + n.len; s++) m.add(`${s}:${n.midi}`);
    return m;
  }, [ghost]);

  const cellW = 28;
  return (
    <div className="w-full">
      <div className="no-scrollbar overflow-x-auto rounded-2xl border border-border bg-background/60 p-2">
        <div role="grid" aria-label={label} style={{ minWidth: steps * cellW + 44 }}>
          {regionLabels && (
            <div className="ml-11 flex">
              {regionLabels.map((l, i) => (
                <div key={i} className="truncate border-l-2 border-primary/50 px-1 pb-1 text-xs font-black text-primary" style={{ width: `${100 / regionLabels.length}%` }}>
                  {l}
                </div>
              ))}
            </div>
          )}
          {rows.map((midi) => (
            <div role="row" key={midi} className="flex items-stretch">
              <div className="flex w-11 shrink-0 items-center justify-end pr-2 text-[10px] font-bold" style={{ color: noteColor(midi) }}>
                {pcName(midi, preferFlats ? "flat" : "sharp")}
                {Math.floor(midi / 12) - 1}
              </div>
              {Array.from({ length: steps }, (_, s) => {
                const key = `${s}:${midi}`;
                const c = cover.get(key);
                const g = ghostCover.has(key);
                const locked = s < lockedBefore;
                const hl = isHighlightRow?.(midi, s);
                return (
                  <button
                    role="gridcell"
                    key={s}
                    type="button"
                    disabled={locked}
                    aria-label={`Step ${s + 1}, ${pcName(midi)}${c ? ", note on" : ""}`}
                    aria-pressed={!!c}
                    onClick={() => onChange(toggleNote(notes, c ? c.note.step : s, midi, noteLength, steps))}
                    className={cn(
                      "h-6 flex-1 border-b border-r border-border/40 transition-colors focus-visible:z-10 focus-visible:outline-2 focus-visible:outline-pink",
                      s % 4 === 0 && "border-l border-l-border",
                      s % 16 === 0 && "border-l-2 border-l-primary/50",
                      !c && !g && (Math.floor(s / 4) % 2 === 0 ? "bg-secondary/40" : "bg-secondary/15"),
                      !c && hl && "bg-lime/10",
                      playhead === s && "brightness-150 outline outline-1 outline-lime/60",
                      locked && "cursor-not-allowed",
                      !locked && "hover:bg-primary/30",
                    )}
                    style={{
                      minWidth: cellW - 2,
                      background: c ? noteColor(mod12(midi)) : g ? `${noteColor(midi)}55` : undefined,
                      borderTopLeftRadius: c?.start ? 6 : undefined,
                      borderBottomLeftRadius: c?.start ? 6 : undefined,
                      opacity: c && !c.start ? 0.75 : 1,
                    }}
                  />
                );
              })}
            </div>
          ))}
          <div className="ml-11 flex">
            {Array.from({ length: steps }, (_, s) => (
              <div key={s} className={cn("flex-1 text-center text-[9px] text-muted-foreground", playhead === s && "text-lime")} style={{ minWidth: cellW - 2 }}>
                {s % 4 === 0 ? s / 4 + 1 : "·"}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/** Build sequencer rows (high → low) from a scale across a range, optionally chromatic. */
export function rowsFor(low: number, span: number, scalePcs: number[] | null): number[] {
  const out: number[] = [];
  for (let m = low; m <= low + span; m++) if (!scalePcs || scalePcs.includes(mod12(m))) out.push(m);
  return out.reverse();
}
