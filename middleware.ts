import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const SESSION_COOKIE = "cultureTrailAuth";

// Paths that don't require authentication
const PUBLIC_PATHS = ["/login", "/api/auth"];

// Static asset patterns to bypass
const STATIC_EXTENSIONS = /\.(ico|png|jpg|jpeg|svg|webp|gif|css|js|woff|woff2|ttf|map)$/;

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow static assets through
  if (STATIC_EXTENSIONS.test(pathname)) {
    return NextResponse.next();
  }

  // Allow Next.js internals through (_next/*)
  if (pathname.startsWith("/_next")) {
    return NextResponse.next();
  }

  // Allow public paths (login page and auth API) through without auth check
  const isPublicPath = PUBLIC_PATHS.some(
    (path) => pathname === path || pathname.startsWith(path + "/")
  );
  if (isPublicPath) {
    return NextResponse.next();
  }

  // Check for auth cookie
  const authCookie = request.cookies.get(SESSION_COOKIE);

  if (!authCookie || !authCookie.value) {
    // No cookie — redirect to login, preserving intended destination
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  // Cookie exists — allow request through.
  // Full token validation happens server-side in API routes that call lib/auth.
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
