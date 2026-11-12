"use client";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, ChevronDown, ExternalLink, Mic, MicOff, NotebookPen, PenLine, Star, Trash2, MessageCircleQuestion } from "lucide-react";
import { useProgress, LessonNote } from "@/store/progress";
import { useDictation } from "@/hooks/useDictation";
import { askUrl, ASK_PROVIDERS, AskProvider } from "@/lib/notes/ask";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface NotebookContext {
  head?: string;
  text: string;
}

/** Ask the intro video to pause (e.g. while asking a question). */
export const pauseIntro = () => window.dispatchEvent(new Event("hc:pause-intro"));

type Panel = null | "note" | "ask";
const NO_NOTES: LessonNote[] = [];

function DictationField({ value, onChange, placeholder, rows = 3, label }: { value: string; onChange: (v: string) => void; placeholder: string; rows?: number; label: string }) {
  const [lang, setLang] = useState<"en-US" | "ko-KR">("en-US");
  const dict = useDictation((t) => onChange(value ? `${value.trim()} ${t}` : t));
  return (
    <div className="flex flex-col gap-2">
      <div className="relative">
        <textarea
          aria-label={label}
          value={dict.listening && dict.interim ? `${value} ${dict.interim}`.trim() : value}
          onChange={(e) => onChange(e.target.value)}
          rows={rows}
          placeholder={placeholder}
          className="w-full rounded-md border border-border bg-background p-3 pr-12 text-sm focus-visible:border-primary focus-visible:outline-none"
        />
        {dict.supported && (
          <button
            type="button"
            onClick={() => (dict.listening ? dict.stop() : dict.start(lang))}
            aria-label={dict.listening ? "Stop voice input" : "Speak instead of typing"}
            aria-pressed={dict.listening}
            className={cn("absolute right-2 top-2 rounded-md border p-2", dict.listening ? "border-pink bg-pink/20 text-pink" : "border-border text-muted-foreground hover:text-foreground")}
          >
            {dict.listening ? <MicOff className="size-4" /> : <Mic className="size-4" />}
          </button>
        )}
      </div>
      {dict.supported && (
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          {dict.listening ? <span className="label text-pink">● listening…</span> : <span>Tap the mic to speak.</span>}
          <span className="ml-auto flex overflow-hidden rounded-md border border-border font-mono" role="group" aria-label="Voice input language">
            {(["en-US", "ko-KR"] as const).map((l) => (
              <button key={l} type="button" onClick={() => setLang(l)} aria-pressed={lang === l} className={cn("px-2 py-1", lang === l && "bg-primary text-primary-foreground")}>
                {l === "en-US" ? "EN" : "한국어"}
              </button>
            ))}
          </span>
        </div>
      )}
      {dict.error && <p className="text-xs font-bold text-destructive">{dict.error}</p>}
    </div>
  );
}

export function LessonNotebook({ lessonId, lessonTitle, world, current }: { lessonId: string; lessonTitle: string; world: string; current: NotebookContext | null }) {
  const stored = useProgress((s) => s.notes);
  const allNotes = stored ?? NO_NOTES;
  const { addNote, updateNote, deleteNote } = useProgress();
  const notes = allNotes.filter((n) => n.lessonId === lessonId);
  const [panel, setPanel] = useState<Panel>(null);
  const [noteText, setNoteText] = useState("");
  const [question, setQuestion] = useState("");
  const [asked, setAsked] = useState<LessonNote | null>(null);
  const [answer, setAnswer] = useState("");
  const [open, setOpen] = useState(false);
  const [flash, setFlash] = useState<string | null>(null);

  const toast = (m: string) => {
    setFlash(m);
    setTimeout(() => setFlash(null), 1800);
  };

  const saveHighlight = () => {
    if (!current) return;
    addNote({ lessonId, kind: "highlight", text: current.text, context: current.head });
    toast("Saved to your notes ★");
  };

  const ask = (provider: AskProvider) => {
    if (!question.trim()) return;
    const url = askUrl(provider, question, { lessonTitle, world, context: current ? [current.head, current.text].filter(Boolean).join(" — ") : undefined });
    window.open(url, "_blank", "noopener,noreferrer");
    const n = addNote({ lessonId, kind: "question", text: question.trim(), context: current?.head, askedWith: ASK_PROVIDERS.find((p) => p.id === provider)?.name });
    setAsked(n);
    setAnswer("");
  };

  const togglePanel = (p: Panel) => {
    pauseIntro();
    setPanel((x) => (x === p ? null : p));
  };

  return (
    <section className="panel overflow-hidden" aria-label="Notebook">
      <div className="flex flex-wrap items-center gap-2 border-b border-border bg-[#171512] px-3 py-2">
        <span className="label mr-1 flex items-center gap-1.5">
          <NotebookPen className="size-3.5" /> Notebook
        </span>
        <Button size="sm" variant="secondary" onClick={saveHighlight} disabled={!current} title={current ? "Save what's on screen" : "Play the intro first"}>
          <Star /> Save this part
        </Button>
        <Button size="sm" variant={panel === "note" ? "default" : "secondary"} onClick={() => togglePanel("note")}>
          <PenLine /> Note
        </Button>
        <Button size="sm" variant={panel === "ask" ? "default" : "secondary"} onClick={() => togglePanel("ask")}>
          <MessageCircleQuestion /> Ask
        </Button>
        <AnimatePresence>
          {flash && (
            <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="label text-lime" role="status">
              {flash}
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      {panel === "note" && (
        <div className="flex flex-col gap-2 p-3">
          <DictationField value={noteText} onChange={setNoteText} label="Note" placeholder={current?.head ? `A note about "${current.head}"…` : "Write a note…"} />
          <div className="flex gap-2">
            <Button
              size="sm"
              disabled={!noteText.trim()}
              onClick={() => {
                addNote({ lessonId, kind: "note", text: noteText.trim(), context: current?.head });
                setNoteText("");
                setPanel(null);
                toast("Note saved ✓");
              }}
            >
              <Check /> Save note
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setPanel(null)}>
              Cancel
            </Button>
          </div>
        </div>
      )}

      {panel === "ask" && (
        <div className="flex flex-col gap-3 p-3">
          {!asked ? (
            <>
              <DictationField value={question} onChange={setQuestion} label="Your question" placeholder={current?.head ? `Ask about "${current.head}"…` : "What do you want to know?"} rows={2} />
              <div>
                <p className="label mb-1.5">Ask with — opens in a new tab, with this lesson as context</p>
                <div className="flex flex-wrap gap-2">
                  {ASK_PROVIDERS.map((p) => (
                    <Button key={p.id} size="sm" variant="secondary" disabled={!question.trim()} onClick={() => ask(p.id)}>
                      {p.name} <ExternalLink />
                    </Button>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <>
              <p className="text-sm">
                <span className="label text-primary">Asked {asked.askedWith}: </span>
                {asked.text}
              </p>
              <DictationField value={answer} onChange={setAnswer} label="Answer" placeholder="Paste or summarise the answer to keep it with your question (optional)" rows={4} />
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  onClick={() => {
                    if (answer.trim()) updateNote(asked.id, { answer: answer.trim() });
                    setAsked(null);
                    setQuestion("");
                    setPanel(null);
                    toast(answer.trim() ? "Q&A saved ✓" : "Question saved ✓");
                  }}
                >
                  <Check /> {answer.trim() ? "Save Q&A" : "Done"}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setAsked(null);
                    setQuestion("");
                  }}
                >
                  Ask another
                </Button>
              </div>
            </>
          )}
        </div>
      )}

      <button onClick={() => setOpen((o) => !o)} aria-expanded={open} className="flex w-full items-center justify-between px-3 py-2.5 text-left text-sm font-semibold hover:bg-secondary/40">
        <span>
          My notes for this lesson <span className="readout text-xs text-muted-foreground">({notes.length})</span>
        </span>
        <ChevronDown className={cn("size-4 transition-transform", open && "rotate-180")} />
      </button>
      {open && (
        <ul className="divide-y divide-border border-t border-border">
          {notes.length === 0 && <li className="p-3 text-sm text-muted-foreground">Nothing yet. Star a part of the video, write a note, or ask a question — they show up here and in Reflect.</li>}
          {notes.map((n) => (
            <NoteRow key={n.id} n={n} onDelete={() => deleteNote(n.id)} onAnswer={(a) => updateNote(n.id, { answer: a })} />
          ))}
        </ul>
      )}
    </section>
  );
}

function NoteRow({ n, onDelete, onAnswer }: { n: LessonNote; onDelete: () => void; onAnswer: (a: string) => void }) {
  const [adding, setAdding] = useState(false);
  const [a, setA] = useState("");
  const icon = n.kind === "highlight" ? "★" : n.kind === "question" ? "?" : "✎";
  return (
    <li className="flex gap-3 p-3 text-sm">
      <span className={cn("readout mt-0.5 w-4 shrink-0 text-center", n.kind === "highlight" ? "text-lime" : n.kind === "question" ? "text-pink" : "text-primary")}>{icon}</span>
      <div className="min-w-0 flex-1">
        {n.context && <p className="label mb-0.5">{n.context}</p>}
        <p className={cn(n.kind === "question" && "font-semibold")}>{n.text}</p>
        {n.answer && <p className="mt-1 whitespace-pre-wrap border-l-2 border-pink/50 pl-2 text-muted-foreground">{n.answer}</p>}
        {n.kind === "question" && !n.answer && !adding && (
          <button onClick={() => setAdding(true)} className="label mt-1 text-pink hover:underline">
            + add answer
          </button>
        )}
        {adding && (
          <div className="mt-2 flex flex-col gap-2">
            <textarea aria-label="Answer" value={a} onChange={(e) => setA(e.target.value)} rows={3} className="w-full rounded-md border border-border bg-background p-2 text-sm" placeholder="Paste the answer…" />
            <div className="flex gap-2">
              <Button size="sm" disabled={!a.trim()} onClick={() => (onAnswer(a.trim()), setAdding(false))}>
                Save
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setAdding(false)}>
                Cancel
              </Button>
            </div>
          </div>
        )}
        <p className="label mt-1">
          {new Date(n.createdAt).toLocaleDateString()}
          {n.askedWith ? ` · asked ${n.askedWith}` : ""}
        </p>
      </div>
      <button onClick={() => confirm("Delete this note?") && onDelete()} aria-label="Delete note" className="self-start p-1 text-muted-foreground hover:text-destructive">
        <Trash2 className="size-4" />
      </button>
    </li>
  );
}

