"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { audio } from "@/lib/audio/engine";
import { isBlackKey, mod12, noteColor, pcName, solfege } from "@/lib/theory/notes";
import { useSettings } from "@/store/settings";
import { cn } from "@/lib/utils";

export type KeyMark = "selected" | "right" | "wrong" | "missing" | "scale" | "root" | "given";

/** Ableton-style computer keyboard mapping (semitones from the base C). */
const KEYMAP: Record<string, number> = { a: 0, w: 1, s: 2, e: 3, d: 4, f: 5, t: 6, g: 7, y: 8, h: 9, u: 10, j: 11, k: 12, o: 13, l: 14, p: 15, ";": 16, "'": 17 };
const KEY_LABEL = Object.fromEntries(Object.entries(KEYMAP).map(([k, v]) => [v, k.toUpperCase()]));

export interface VirtualPianoProps {
  startMidi?: number;
  octaves?: number;
  /** Marks per MIDI note */
  marks?: Record<number, KeyMark>;
  /** Marks per pitch class (applied in every octave, lower priority than `marks`) */
  pcMarks?: Record<number, KeyMark>;
  onPress?: (midi: number) => void;
  playSound?: boolean;
  keyboardInput?: boolean;
  disabled?: boolean;
  className?: string;
  /** Force-show/hide labels; defaults to the user setting */
  showNames?: boolean;
  label?: string;
  /** Small text labels drawn on specific keys (e.g. "W", "H", "R") */
  badges?: Record<number, string>;
  /** Visual height variant */
  compact?: boolean;
}

const MARK_STYLE: Record<KeyMark, { bg?: string; ring?: string }> = {
  selected: {},
  right: { ring: "#f5c542" },
  wrong: { ring: "#ff4d3d" },
  missing: { ring: "#f5c542" },
  scale: {},
  root: {},
  given: {},
};

export function VirtualPiano({
  startMidi = 48,
  octaves = 2,
  marks = {},
  pcMarks = {},
  onPress,
  playSound = true,
  keyboardInput = false,
  disabled = false,
  className,
  showNames,
  label = "Piano keyboard",
  badges,
  compact,
}: VirtualPianoProps) {
  const settings = useSettings();
  const names = showNames ?? settings.showNoteNames;
  const [active, setActive] = useState<Set<number>>(new Set());
  const [shift, setShift] = useState(0);
  const endMidi = startMidi + octaves * 12;
  const keys = useMemo(() => Array.from({ length: endMidi - startMidi + 1 }, (_, i) => startMidi + i), [startMidi, endMidi]);
  const whites = keys.filter((k) => !isBlackKey(k));
  const whiteWidth = 100 / whites.length;
  const pressRef = useRef(onPress);
  pressRef.current = onPress;

  const press = useCallback(
    (midi: number) => {
      if (disabled) return;
      if (playSound) void audio.playNotes([midi], 0.9, "keys");
      setActive((a) => new Set(a).add(midi));
      setTimeout(
        () =>
          setActive((a) => {
            const n = new Set(a);
            n.delete(midi);
            return n;
          }),
        180,
      );
      pressRef.current?.(midi);
    },
    [disabled, playSound],
  );

  useEffect(() => {
    if (!keyboardInput || disabled) return;
    const handler = (e: KeyboardEvent) => {
      if (e.repeat || e.ctrlKey || e.metaKey || e.altKey || e.shiftKey) return;
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      const k = e.key.toLowerCase();
      if (k === "z") return setShift((s) => Math.max(-((startMidi - 24) / 12), s - 1));
      if (k === "x") return setShift((s) => Math.min(octaves - 1, s + 1));
      if (k in KEYMAP) {
        const midi = startMidi + shift * 12 + KEYMAP[k];
        if (midi >= startMidi && midi <= endMidi) {
          e.preventDefault();
          press(midi);
        }
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [keyboardInput, disabled, startMidi, endMidi, octaves, shift, press]);

  const labelFor = (m: number) => {
    const pc = mod12(m);
    const n = pcName(pc, settings.preferFlats ? "flat" : "sharp");
    return settings.solfege ? `${n}\n${solfege(pc)}` : n;
  };

  const markOf = (m: number): KeyMark | undefined => marks[m] ?? pcMarks[mod12(m)];

  const renderKey = (m: number, black: boolean, left: number) => {
    const mark = markOf(m);
    const color = noteColor(m);
    const isActive = active.has(m);
    const filled = mark === "selected" || mark === "right" || mark === "root" || mark === "given" || isActive;
    const tinted = mark === "scale";
    const style: React.CSSProperties = black
      ? { left: `${left}%`, width: `${whiteWidth * 0.62}%` }
      : { width: `${whiteWidth}%` };
    if (filled) style.background = mark === "given" ? `linear-gradient(to bottom, ${color}88, ${color}55)` : color;
    else if (tinted) style.background = black ? `linear-gradient(to bottom, #171512, ${color}aa)` : `linear-gradient(to bottom, #ffffff, ${color}66)`;
    const ring = mark ? MARK_STYLE[mark].ring : undefined;
    if (ring) style.boxShadow = `inset 0 0 0 4px ${ring}`;
    if (mark === "missing") style.boxShadow = `inset 0 0 0 4px #f5c542`;
    const keyHint = keyboardInput ? KEY_LABEL[m - startMidi - shift * 12] : undefined;
    return (
      <button
        key={m}
        type="button"
        role="button"
        aria-label={`${pcName(m, settings.preferFlats ? "flat" : "sharp")}${Math.floor(m / 12) - 1}${mark ? `, ${mark}` : ""}`}
        aria-pressed={mark === "selected" || mark === "right"}
        disabled={disabled}
        onPointerDown={(e) => {
          e.preventDefault();
          press(m);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            e.stopPropagation();
            press(m);
          }
        }}
        className={cn(
          "relative flex select-none flex-col items-center justify-end pb-1.5 font-bold transition-[transform,background] duration-75 focus-visible:z-30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink",
          black
            ? "absolute top-0 z-20 h-[60%] rounded-b-lg border border-black bg-[#1d1b18] text-[9px] text-white/70 shadow-[0_3px_0_0_#000]"
            : "h-full rounded-b-xl border border-[#3a362f] bg-[#efe8d8] text-[11px] text-[#171512] shadow-[inset_0_-6px_0_0_#cfc6b0]",
          isActive && "translate-y-[2px]",
          disabled && "cursor-default",
          !disabled && "cursor-pointer",
        )}
        style={{ ...style, touchAction: "manipulation" }}
      >
        {badges?.[m] && (
          <span className={cn("absolute left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-md bg-pink px-1 text-[10px] font-black text-white shadow", black ? "top-[45%]" : "top-[52%]")}>
            {badges[m]}
          </span>
        )}
        {(mark === "right" || mark === "wrong") && (
          <span aria-hidden className={cn("absolute left-1/2 top-[38%] -translate-x-1/2 rounded-full px-1 text-xs font-black", mark === "right" ? "bg-[#171512] text-lime" : "bg-[#171512] text-[#ff4d3d]")}>
            {mark === "right" ? "✓" : "✕"}
          </span>
        )}
        {keyHint && <span className={cn("absolute top-1 hidden text-[9px] opacity-50 md:inline", black ? "text-white" : "text-[#171512]")}>{keyHint}</span>}
        {names && (
          <span className={cn("whitespace-pre text-center leading-tight", filled && !black && "text-[#171512]", filled && black && "text-[#171512]")}>{labelFor(m)}</span>
        )}
      </button>
    );
  };

  return (
    <div className={cn("w-full", className)}>
      <div className="no-scrollbar overflow-x-auto rounded-2xl">
        <div role="group" aria-label={label} className={cn("relative flex", compact ? "h-32 sm:h-36" : "h-40 sm:h-48 md:h-52")} style={{ minWidth: compact ? undefined : `${whites.length * 19}px` }}>
          {whites.map((m) => renderKey(m, false, 0))}
          {keys
            .filter((m) => isBlackKey(m))
            .map((m) => {
              const whiteIndex = whites.findIndex((w) => w > m);
              const left = whiteIndex * whiteWidth - whiteWidth * 0.31;
              return renderKey(m, true, left);
            })}
        </div>
      </div>
      {keyboardInput && (
        <p className="mt-2 hidden text-center text-xs text-muted-foreground md:block">
          Computer keys: A–; play notes (Ableton layout) · Z / X shift octave {shift !== 0 && `(${shift > 0 ? "+" : ""}${shift})`}
        </p>
      )}
    </div>
  );
}
