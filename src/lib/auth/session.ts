/**
 * Multi-user login without a database.
 * - Login derives key K = PBKDF2-SHA256(password, salt, 600k) and checks SHA-256(K) against the
 *   stored verifier (constant-time).
 * - The session cookie (httpOnly, Secure, SameSite=Lax) carries "username.K". The proxy only needs a
 *   cheap SHA-256 to verify it, and K can't be computed from the public code without the password.
 * - Rotating a user's salt/password (re-running scripts/add-user.mjs) invalidates their sessions.
 * Set HC_AUTH=off to disable the login entirely (e.g. local development).
 * Uses Web Crypto so it works in both the proxy and route handlers.
 */
import { USERS, type UserRecord } from "./users";

export const SESSION_COOKIE = "hc_session";
/** Readable (non-secret) cookie with the signed-in username, used to keep each user's progress separate. */
export const USER_COOKIE = "hc_user";

export function authEnabled(): boolean {
  return process.env.HC_AUTH !== "off";
}

const enc = new TextEncoder();
const hexToBytes = (hex: string) => new Uint8Array(hex.match(/../g)!.map((h) => parseInt(h, 16)));
const toHex = (buf: ArrayBuffer) => Array.from(new Uint8Array(buf), (b) => b.toString(16).padStart(2, "0")).join("");

/** Constant-time string comparison. */
export function safeEqual(a: string, b: string): boolean {
  const ab = enc.encode(a);
  const bb = enc.encode(b);
  let diff = ab.length ^ bb.length;
  for (let i = 0; i < Math.max(ab.length, bb.length); i++) diff |= (ab[i] ?? 0) ^ (bb[i] ?? 0);
  return diff === 0;
}

export function findUser(username: string): UserRecord | undefined {
  const u = username.trim().toLowerCase();
  return USERS.find((x) => x.username === u);
}

async function deriveKey(password: string, user: UserRecord): Promise<string> {
  const material = await crypto.subtle.importKey("raw", enc.encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt: hexToBytes(user.salt), iterations: user.iterations }, material, 256);
  return toHex(bits);
}

async function sha256Hex(hex: string): Promise<string> {
  return toHex(await crypto.subtle.digest("SHA-256", hexToBytes(hex)));
}

/** Check a password. Returns the session token on success. */
export async function login(username: string, password: string): Promise<{ user: string; token: string } | null> {
  const user = findUser(username);
  // Always do the expensive work, even for unknown users, so timing doesn't reveal which usernames exist
  const target = user ?? USERS[0];
  const key = await deriveKey(password, target);
  const ok = Boolean(user) && safeEqual(await sha256Hex(key), target.verifier);
  return ok ? { user: target.username, token: `${target.username}.${key}` } : null;
}

/** Returns the username if the session cookie is valid. */
export async function verifySession(token: string | undefined): Promise<string | null> {
  if (!token) return null;
  const dot = token.indexOf(".");
  if (dot < 1) return null;
  const user = findUser(token.slice(0, dot));
  const key = token.slice(dot + 1);
  if (!user || !/^[0-9a-f]{64}$/.test(key)) return null;
  return safeEqual(await sha256Hex(key), user.verifier) ? user.username : null;
}

/* ---- Brute-force protection (per server instance) ---- */
const MAX_FAILS = 5;
const LOCK_MS = 15 * 60_000;
const failures = new Map<string, { count: number; until: number }>();

export function lockedFor(key: string): number {
  const f = failures.get(key);
  if (!f) return 0;
  if (f.until > Date.now()) return f.until - Date.now();
  if (f.until && f.until <= Date.now()) failures.delete(key);
  return 0;
}

export function recordFailure(key: string) {
  const f = failures.get(key) ?? { count: 0, until: 0 };
  f.count++;
  if (f.count >= MAX_FAILS) {
    f.until = Date.now() + LOCK_MS;
    f.count = 0;
  }
  failures.set(key, f);
}

export function clearFailures(key: string) {
  failures.delete(key);
}
