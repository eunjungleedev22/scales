"use client";
import { useRef, useState } from "react";
import { Check, Copy, Download, Upload } from "lucide-react";
import { applyBackup, backupToCode, createBackup, parseBackup, summarize } from "@/lib/progress/backup";
import { useProgress } from "@/store/progress";
import { useSettings } from "@/store/settings";
import { useLab } from "@/store/lab";
import { useUI } from "@/store/ui";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

/** Save / restore all scores and progress (move them between devices without a server). */
export function BackupCard() {
  const xp = useProgress((s) => s.xp);
  const lessons = useProgress((s) => s.lessons);
  const [code, setCode] = useState("");
  const [copied, setCopied] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const download = () => {
    const b = createBackup(localStorage);
    const blob = new Blob([JSON.stringify(b, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `harmonic-cat-backup-${b.exportedAt.slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  };

  const copy = async () => {
    const c = backupToCode(createBackup(localStorage));
    try {
      await navigator.clipboard.writeText(c);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCode(c); // clipboard blocked: show it so it can be copied by hand
      setMsg({ ok: true, text: "Copy the code from the box below." });
    }
  };

  const restore = async (input: string) => {
    try {
      const b = parseBackup(input);
      const summary = summarize(b);
      if (!confirm(`Replace the progress on this device with the backup?\n${summary}`)) return;
      applyBackup(b, localStorage);
      await Promise.all([useProgress.persist.rehydrate(), useSettings.persist.rehydrate(), useLab.persist.rehydrate()]);
      setCode("");
      setMsg({ ok: true, text: `Restored: ${summary}` });
      useUI.getState().pushInfo("Progress restored");
    } catch (e) {
      setMsg({ ok: false, text: e instanceof Error ? e.message : "Couldn't read that backup." });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Your scores</CardTitle>
        <CardDescription>
          Saved automatically in this browser: <b className="text-foreground">{xp} XP</b> · {Object.keys(lessons).length} lessons. To move them to another
          device (e.g. laptop → phone), back up here and restore there.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <div className="flex flex-wrap gap-2">
          <Button variant="lime" onClick={download}>
            <Download /> Download backup
          </Button>
          <Button variant="secondary" onClick={copy}>
            {copied ? <Check /> : <Copy />} {copied ? "Copied!" : "Copy backup code"}
          </Button>
          <Button variant="secondary" onClick={() => fileRef.current?.click()}>
            <Upload /> Restore from file
          </Button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json,text/plain"
            className="hidden"
            onChange={async (e) => {
              const f = e.target.files?.[0];
              if (f) await restore(await f.text());
              e.target.value = "";
            }}
          />
        </div>
        <textarea
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="…or paste a backup code here"
          aria-label="Backup code"
          rows={3}
          className="w-full rounded-2xl border border-border bg-secondary p-3 font-mono text-xs focus-visible:border-primary focus-visible:outline-none"
        />
        <div className="flex flex-wrap items-center gap-3">
          <Button size="sm" onClick={() => restore(code)} disabled={!code.trim()}>
            Restore from code
          </Button>
          {msg && <p className={msg.ok ? "text-sm font-bold text-lime" : "text-sm font-bold text-destructive"}>{msg.text}</p>}
        </div>
      </CardContent>
    </Card>
  );
}
