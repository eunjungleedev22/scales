"use client";
import { useState } from "react";
import { Grid3x3, KeyboardMusic, Layers, ListMusic, Piano } from "lucide-react";
import { ScaleExplorer } from "@/components/tools/ScaleExplorer";
import { ChordExplorer } from "@/components/tools/ChordExplorer";
import { ProgressionBuilder } from "@/components/tools/ProgressionBuilder";
import { FreeSequencer } from "@/components/tools/FreeSequencer";
import { VirtualPiano } from "@/components/piano/VirtualPiano";
import { useT } from "@/i18n/useT";
import { cn } from "@/lib/utils";

const TABS = [
  { id: "scales", label: "Scale Explorer", icon: ListMusic },
  { id: "chords", label: "Chord Explorer", icon: Layers },
  { id: "progressions", label: "Progression Builder", icon: KeyboardMusic },
  { id: "sequencer", label: "Step Sequencer", icon: Grid3x3 },
  { id: "piano", label: "Free Piano", icon: Piano },
] as const;

export default function PlaygroundPage() {
  const { t } = useT();
  const [tab, setTab] = useState<(typeof TABS)[number]["id"]>("scales");
  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="display text-4xl sm:text-5xl">{t("nav_playground")}</h1>
        <p className="text-muted-foreground">No right answers here — just explore and listen.</p>
      </div>
      <div role="tablist" aria-label="Playground tools" className="no-scrollbar flex gap-2 overflow-x-auto">
        {TABS.map((x) => (
          <button
            key={x.id}
            role="tab"
            aria-selected={tab === x.id}
            onClick={() => setTab(x.id)}
            className={cn("flex shrink-0 items-center gap-2 rounded-2xl border border-border px-4 py-2 text-sm font-bold", tab === x.id ? "border-primary bg-primary/20 text-foreground" : "text-muted-foreground hover:bg-secondary")}
          >
            <x.icon className="size-4" /> {x.label}
          </button>
        ))}
      </div>
      <div role="tabpanel" className="rounded-lg border border-border bg-card/60 p-4 sm:p-6">
        {tab === "scales" && <ScaleExplorer />}
        {tab === "chords" && <ChordExplorer />}
        {tab === "progressions" && <ProgressionBuilder />}
        {tab === "sequencer" && <FreeSequencer />}
        {tab === "piano" && (
          <div className="flex flex-col gap-3">
            <p className="text-sm text-muted-foreground">Polyphonic — click, tap or use your computer keyboard (A W S E D F T G Y H U J K…). Z / X shift octaves.</p>
            <VirtualPiano startMidi={48} octaves={3} keyboardInput />
          </div>
        )}
      </div>
    </div>
  );
}
