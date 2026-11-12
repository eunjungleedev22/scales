"use client";
import { useSettings } from "@/store/settings";
import { useProgress } from "@/store/progress";
import { useLab } from "@/store/lab";
import { useT } from "@/i18n/useT";
import { audio } from "@/lib/audio/engine";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { NativeSelect } from "@/components/ui/select";
import { Kbd } from "@/components/ui/kbd";
import { BackupCard } from "@/components/settings/BackupCard";
import { SoundCheck } from "@/components/settings/SoundCheck";
import { TonePicker } from "@/components/settings/TonePicker";

export default function SettingsPage() {
  const s = useSettings();
  const { t } = useT();
  const resetProgress = useProgress((x) => x.reset);
  const resetLab = useLab((x) => x.reset);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="display text-4xl sm:text-5xl">{t("nav_settings")}</h1>
      <Card>
        <CardHeader>
          <CardTitle>General</CardTitle>
        </CardHeader>
        <CardContent className="divide-y divide-border">
          <Row label={t("language")} id="lang">
            <NativeSelect id="lang" value={s.lang} onChange={(e) => s.set({ lang: e.target.value as "en" | "ko" })}>
              <option value="en">English</option>
              <option value="ko">한국어</option>
            </NativeSelect>
          </Row>
          <Row label="Korean term hints (semitone 반음, whole tone 온음…)" id="koterms">
            <Switch id="koterms" checked={s.koreanTerms} onCheckedChange={(v) => s.set({ koreanTerms: v })} />
          </Row>
          <Row label={t("showNoteNames")} id="names">
            <Switch id="names" checked={s.showNoteNames} onCheckedChange={(v) => s.set({ showNoteNames: v })} />
          </Row>
          <Row label={t("solfege")} id="solfege">
            <Switch id="solfege" checked={s.solfege} onCheckedChange={(v) => s.set({ solfege: v })} />
          </Row>
          <Row label={t("preferFlats")} id="flats">
            <Switch id="flats" checked={s.preferFlats} onCheckedChange={(v) => s.set({ preferFlats: v })} />
          </Row>
          <Row label={`${t("focusMode")} (Shift+F)`} id="focus">
            <Switch id="focus" checked={s.focusMode} onCheckedChange={(v) => s.set({ focusMode: v })} />
          </Row>
          <Row label={t("reducedMotion")} id="motion">
            <Switch id="motion" checked={s.reducedMotion} onCheckedChange={(v) => s.set({ reducedMotion: v })} />
          </Row>
          <Row label={t("breakReminder")} id="break">
            <NativeSelect id="break" value={s.breakReminderMinutes} onChange={(e) => s.set({ breakReminderMinutes: Number(e.target.value) })}>
              <option value={0}>{t("off")}</option>
              <option value={25}>25 {t("minutes")}</option>
              <option value={50}>50 {t("minutes")}</option>
              <option value={90}>90 {t("minutes")}</option>
            </NativeSelect>
          </Row>
          <Row label={t("volume")}>
            <div className="flex w-48 items-center gap-3">
              <Slider aria-label={t("volume")} value={[s.volume * 100]} max={100} step={1} onValueChange={([v]) => s.set({ volume: v / 100 })} />
              <Button size="sm" variant="secondary" onClick={() => audio.playNotes([60, 64, 67], 0.8)}>
                Test
              </Button>
            </div>
          </Row>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("shortcuts")}</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
          {[
            ["A W S E D F T G Y H U J K", "Play piano keys (Ableton layout)"],
            ["Z / X", "Octave down / up"],
            ["Enter", "Check answer / continue"],
            ["Backspace", "Clear selection"],
            ["Space", "Play / replay audio"],
            ["1 – 9", "Choose an answer"],
            ["/", "Show hint"],
            ["Esc", "Leave lesson"],
            ["Shift + F", "Toggle focus mode"],
          ].map(([k, v]) => (
            <div key={k} className="flex items-center justify-between rounded-xl bg-secondary/50 px-3 py-2">
              <span>{v}</span>
              <Kbd className="inline-block">{k}</Kbd>
            </div>
          ))}
        </CardContent>
      </Card>

      <TonePicker />

      <SoundCheck />

      <BackupCard />

      <Card>
        <CardHeader>
          <CardTitle>Data</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <p className="w-full text-sm text-muted-foreground">Progress is saved automatically in this browser (localStorage). Nothing is sent to a server.</p>
          <Button
            variant="destructive"
            onClick={() => {
              if (confirm("Reset all XP, lesson progress and achievements?")) resetProgress();
            }}
          >
            {t("resetProgress")}
          </Button>
          <Button
            variant="secondary"
            onClick={() => {
              if (confirm("Reset the Composition Lab project?")) resetLab();
            }}
          >
            Reset Lab project
          </Button>
          <Button
            variant="outline"
            onClick={async () => {
              await fetch("/api/logout", { method: "POST" });
              window.location.href = "/login";
            }}
          >
            Sign out
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

function Row({ label, children, id }: { label: string; children: React.ReactNode; id?: string }) {
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <label htmlFor={id} className="font-bold">
        {label}
      </label>
      {children}
    </div>
  );
}
