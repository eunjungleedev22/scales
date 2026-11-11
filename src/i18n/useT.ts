"use client";
import { useCallback } from "react";
import { useSettings } from "@/store/settings";
import { DICT, DictKey } from "./dict";
import { loc, Localized } from "@/lib/exercises/types";

export function useT() {
  const lang = useSettings((s) => s.lang);
  const t = useCallback((k: DictKey) => DICT[lang][k] ?? DICT.en[k], [lang]);
  const L = useCallback((l: Localized | undefined) => loc(l, lang), [lang]);
  return { t, L, lang };
}
