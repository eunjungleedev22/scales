import { NextResponse, type NextRequest } from "next/server";
import { authConfig, SESSION_COOKIE, verifySessionToken } from "@/lib/auth/session";

/** Sends visitors to /login unless they have a valid session cookie (only when credentials are configured). */
export async function proxy(request: NextRequest) {
  const cfg = authConfig();
  if (!cfg.enabled) return NextResponse.next();
  const ok = await verifySessionToken(request.cookies.get(SESSION_COOKIE)?.value, cfg.username, cfg.secret);
  if (ok) return NextResponse.next();
  const url = new URL("/login", request.url);
  const next = request.nextUrl.pathname + request.nextUrl.search;
  if (next !== "/") url.searchParams.set("next", next);
  return NextResponse.redirect(url);
}

export const config = {
  // Everything except the login page/API, Next internals and static files
  matcher: ["/((?!login|api/login|_next/|favicon.ico|.*\\.(?:png|svg|ico|jpg|webp|woff2?)$).*)"],
};
