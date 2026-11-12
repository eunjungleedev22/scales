import { NextResponse, type NextRequest } from "next/server";
import { authEnabled, SESSION_COOKIE, verifySession } from "@/lib/auth/session";

/** Sends visitors to /login unless they have a valid session cookie. */
export async function proxy(request: NextRequest) {
  if (!authEnabled()) return NextResponse.next();
  const user = await verifySession(request.cookies.get(SESSION_COOKIE)?.value);
  if (user) return NextResponse.next();
  const url = new URL("/login", request.url);
  const next = request.nextUrl.pathname + request.nextUrl.search;
  if (next !== "/") url.searchParams.set("next", next);
  return NextResponse.redirect(url);
}

export const config = {
  // Everything except the login page/API, Next internals and static files
  matcher: ["/((?!login|api/login|_next/|favicon.ico|.*\\.(?:png|svg|ico|jpg|webp|woff2?)$).*)"],
};
