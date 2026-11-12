"use client";
/** Client-side helpers for the signed-in user (the username cookie is not secret). */
export function currentUser(): string | null {
  if (typeof document === "undefined") return null;
  const m = document.cookie.match(/(?:^|;\s*)hc_user=([^;]+)/);
  return m ? decodeURIComponent(m[1]) : null;
}

/**
 * localStorage key for a store, namespaced per user so accounts on the same device never mix.
 * The original account ("cat") keeps the original keys so existing progress isn't lost.
 */
export function storageName(base: string, user = currentUser()): string {
  return !user || user === "cat" ? base : `${base}:${user}`;
}
