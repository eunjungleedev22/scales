/**
 * Backup / restore of everything the app saves in this browser (scores, lessons,
 * achievements, settings, Composition Lab project). No server needed: the backup is a
 * small JSON file (or a copyable code) you can move to another device.
 */
export const BACKUP_KEYS = ["harmonic-cat-progress", "harmonic-cat-settings", "harmonic-cat-lab"] as const;

export interface Backup {
  app: "harmonic-cat";
  version: 1;
  exportedAt: string;
  data: Partial<Record<(typeof BACKUP_KEYS)[number], string>>;
}

/** Maps logical backup keys to the actual storage keys (namespaced per user). */
export type KeyMap = (key: (typeof BACKUP_KEYS)[number]) => string;
const identity: KeyMap = (k) => k;

export function createBackup(storage: Pick<Storage, "getItem">, keyOf: KeyMap = identity): Backup {
  const data: Backup["data"] = {};
  for (const k of BACKUP_KEYS) {
    const v = storage.getItem(keyOf(k));
    if (v) data[k] = v;
  }
  return { app: "harmonic-cat", version: 1, exportedAt: new Date().toISOString(), data };
}

/** Accepts the raw JSON or the base64 "code" form. Throws a friendly error if invalid. */
export function parseBackup(input: string): Backup {
  const text = input.trim();
  let json = text;
  if (!text.startsWith("{")) {
    try {
      json = decodeURIComponent(escape(atob(text.replace(/\s+/g, ""))));
    } catch {
      throw new Error("That doesn't look like a Harmonic Cat backup.");
    }
  }
  let obj: unknown;
  try {
    obj = JSON.parse(json);
  } catch {
    throw new Error("That doesn't look like a Harmonic Cat backup.");
  }
  const b = obj as Backup;
  if (!b || b.app !== "harmonic-cat" || typeof b.data !== "object" || b.data === null) throw new Error("That doesn't look like a Harmonic Cat backup.");
  for (const [k, v] of Object.entries(b.data)) {
    if (!(BACKUP_KEYS as readonly string[]).includes(k) || typeof v !== "string") throw new Error("The backup contains unexpected data.");
    JSON.parse(v); // each entry must itself be valid JSON
  }
  return b;
}

export function applyBackup(b: Backup, storage: Pick<Storage, "setItem">, keyOf: KeyMap = identity) {
  for (const [k, v] of Object.entries(b.data)) if (v) storage.setItem(keyOf(k as (typeof BACKUP_KEYS)[number]), v);
}

/** Compact copy-paste code (base64 of the JSON, Unicode-safe). */
export function backupToCode(b: Backup): string {
  return btoa(unescape(encodeURIComponent(JSON.stringify(b))));
}

/** Short human summary, e.g. "1,240 XP · 12 lessons". */
export function summarize(b: Backup): string {
  try {
    const p = JSON.parse(b.data["harmonic-cat-progress"] ?? "{}").state ?? {};
    return `${p.xp ?? 0} XP · ${Object.keys(p.lessons ?? {}).length} lessons · ${Object.keys(p.achievements ?? {}).length} achievements`;
  } catch {
    return "";
  }
}
