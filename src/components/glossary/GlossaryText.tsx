"use client";
import { useMemo, useState } from "react";
import { GlossaryEntry, segmentText } from "@/content/glossary";
import { loc, Localized } from "@/lib/exercises/types";
import { useSettings } from "@/store/settings";
import { Volume2 } from "lucide-react";
import { primeSpeech, speak, speechSupported } from "@/lib/audio/speech";

/** One annotated term: English word + small Korean word; tap/hover for the Korean definition. */
function Term({ text, entry }: { text: string; entry: GlossaryEntry }) {
  const [open, setOpen] = useState(false);
  return (
    <span className="relative inline-block">
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setOpen((o) => !o);
        }}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onBlur={() => setOpen(false)}
        aria-expanded={open}
        aria-label={`${text}: ${entry.ko}. ${entry.def}`}
        className="cursor-help rounded underline decoration-pink/60 decoration-dotted underline-offset-4 focus-visible:outline-2 focus-visible:outline-pink"
      >
        {text}
        <span lang="ko" className="ml-1 rounded-md bg-pink/15 px-1 py-px align-[1px] text-[0.72em] font-bold text-pink no-underline">
          {entry.ko}
        </span>
      </button>
      {open && (
        <span role="tooltip" lang="ko" className="fixed inset-x-4 bottom-24 z-50 block rounded-xl sm:absolute sm:inset-x-auto sm:bottom-auto sm:left-0 sm:top-full sm:mt-1.5 sm:w-64 border border-pink/40 bg-card p-2.5 text-left text-xs font-semibold leading-relaxed text-foreground shadow-xl">
          <span className="block font-black text-pink">
            {entry.ko} <span className="font-bold text-muted-foreground">· {entry.terms[0]}</span>
          </span>
          {entry.def}
        </span>
      )}
    </span>
  );
}

/**
 * Renders lesson content in English (always), annotating music terms with Korean words.
 * Pass a shared `seen` set to annotate each term only once across several blocks.
 */
export function GlossaryText({ text, seen }: { text: Localized | undefined; seen?: Set<GlossaryEntry> }) {
  const enabled = useSettings((s) => s.koreanTerms);
  const english = loc(text, "en");
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const segs = useMemo(() => (enabled ? segmentText(english, seen ?? new Set()) : [{ text: english }]), [english, enabled]);
  return (
    <>
      {segs.map((s, i) => (s.entry ? <Term key={i} text={s.text} entry={s.entry} /> : <span key={i}>{s.text}</span>))}
    </>
  );
}

/** "Key terms" list for a lesson. */
export function KeyTerms({ entries }: { entries: GlossaryEntry[] }) {
  if (!entries.length) return null;
  return (
    <div className="flex flex-wrap gap-2">
      {entries.map((e) => (
        <div key={e.terms[0]} className="rounded-xl border border-border bg-secondary/50 px-3 py-2 text-sm">
          <span className="font-black">{e.terms[0]}</span>{" "}
          <span lang="ko" className="font-bold text-pink">
            {e.ko}
          </span>
          {speechSupported() && (
            <button
              onClick={async () => {
                primeSpeech();
                const s = useSettings.getState();
                await speak(e.terms[0], { rate: s.narrationRate ?? 1, voiceURI: s.narrationVoice });
                await speak(e.ko.replace(/\(.*?\)/g, ""), { lang: "ko", rate: (s.narrationRate ?? 1) * 0.95 });
              }}
              aria-label={`Hear ${e.terms[0]} and ${e.ko}`}
              className="ml-1.5 inline-flex translate-y-[2px] text-muted-foreground hover:text-pink"
            >
              <Volume2 className="size-3.5" />
            </button>
          )}
          <p lang="ko" className="mt-0.5 max-w-64 text-xs text-muted-foreground">
            {e.def}
          </p>
        </div>
      ))}
    </div>
  );
}
