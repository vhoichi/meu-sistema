import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SESSION_COOKIE } from "@/lib/sessionCookie";

/**
 * Lightweight edge guard: redirects based only on the PRESENCE of the session
 * cookie (edge runtime can't run the HMAC verification). Full cryptographic
 * verification happens in the Node-runtime server components and API routes.
 */
export function middleware(request: NextRequest) {
  const hasCookie = Boolean(request.cookies.get(SESSION_COOKIE)?.value);
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/dashboard") && !hasCookie) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  if (pathname === "/" && hasCookie) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/dashboard/:path*"],
};
