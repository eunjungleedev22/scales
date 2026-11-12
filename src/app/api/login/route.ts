import { NextResponse } from "next/server";
import { authEnabled, clearFailures, lockedFor, login, recordFailure, SESSION_COOKIE, USER_COOKIE } from "@/lib/auth/session";

export async function POST(request: Request) {
  if (!authEnabled()) return NextResponse.json({ ok: true });
  let body: { username?: string; password?: string } = {};
  try {
    body = await request.json();
  } catch {
    /* empty body */
  }
  const username = String(body.username ?? "").trim().toLowerCase().slice(0, 64);
  const password = String(body.password ?? "").slice(0, 256);
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";

  // Lock per account and per IP after repeated failures
  const wait = Math.max(lockedFor(`u:${username}`), lockedFor(`ip:${ip}`));
  if (wait > 0) {
    return NextResponse.json({ ok: false, locked: true, retryAfterMinutes: Math.ceil(wait / 60_000) }, { status: 429, headers: { "Retry-After": String(Math.ceil(wait / 1000)) } });
  }

  const result = username && password ? await login(username, password) : null;
  if (!result) {
    recordFailure(`u:${username}`);
    recordFailure(`ip:${ip}`);
    await new Promise((r) => setTimeout(r, 400 + Math.random() * 400)); // slow down guessing
    return NextResponse.json({ ok: false }, { status: 401 });
  }
  clearFailures(`u:${username}`);
  clearFailures(`ip:${ip}`);

  const secure = process.env.NODE_ENV === "production";
  const res = NextResponse.json({ ok: true, user: result.user });
  res.cookies.set(SESSION_COOKIE, result.token, { httpOnly: true, secure, sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 90 });
  res.cookies.set(USER_COOKIE, result.user, { httpOnly: false, secure, sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 90 });
  return res;
}
