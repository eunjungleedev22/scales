/**
 * Minimal single-user login (no sign-up). The app holds no sensitive data, so the
 * default account is built in; environment variables can override it:
 *   HC_USERNAME, HC_PASSWORD, HC_SECRET — or HC_AUTH=off to disable the login entirely.
 * Uses Web Crypto so it works in both the proxy and route handlers.
 */
export const DEFAULT_USERNAME = "cat";
export const DEFAULT_PASSWORD = "kitten-paws-2209";
export const SESSION_COOKIE = "hc_session";

export function authConfig() {
  const username = process.env.HC_USERNAME || DEFAULT_USERNAME;
  const password = process.env.HC_PASSWORD || DEFAULT_PASSWORD;
  const secret = process.env.HC_SECRET || `harmonic-cat:${username}:${password}`;
  return { enabled: process.env.HC_AUTH !== "off", username, password, secret };
}

const enc = new TextEncoder();

async function hmac(secret: string, message: string): Promise<string> {
  const key = await crypto.subtle.importKey("raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(message));
  return Array.from(new Uint8Array(sig), (b) => b.toString(16).padStart(2, "0")).join("");
}

/** Constant-time string comparison. */
export function safeEqual(a: string, b: string): boolean {
  const ab = enc.encode(a);
  const bb = enc.encode(b);
  let diff = ab.length ^ bb.length;
  for (let i = 0; i < Math.max(ab.length, bb.length); i++) diff |= (ab[i] ?? 0) ^ (bb[i] ?? 0);
  return diff === 0;
}

export async function makeSessionToken(username: string, secret: string): Promise<string> {
  return `${username}.${await hmac(secret, `session:${username}`)}`;
}

export async function verifySessionToken(token: string | undefined, username: string, secret: string): Promise<boolean> {
  if (!token) return false;
  return safeEqual(token, await makeSessionToken(username, secret));
}
