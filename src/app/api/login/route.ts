import { NextResponse } from "next/server";
import { authConfig, makeSessionToken, safeEqual, SESSION_COOKIE } from "@/lib/auth/session";

export async function POST(request: Request) {
  const cfg = authConfig();
  if (!cfg.enabled) return NextResponse.json({ ok: true });
  let body: { username?: string; password?: string } = {};
  try {
    body = await request.json();
  } catch {
    /* empty body */
  }
  const ok = safeEqual((body.username ?? "").trim().toLowerCase(), cfg.username.toLowerCase()) && safeEqual(body.password ?? "", cfg.password);
  if (!ok) {
    await new Promise((r) => setTimeout(r, 600)); // slow down guessing
    return NextResponse.json({ ok: false }, { status: 401 });
  }
  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, await makeSessionToken(cfg.username, cfg.secret), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
  return res;
}
