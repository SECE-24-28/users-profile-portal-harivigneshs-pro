// proxy.ts
// Next.js Proxy (formerly Middleware) — runs on every request BEFORE the page renders.
// Protects all routes under /dashboard and /voters from unauthenticated access.

import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";

// ─── PROTECTED ROUTE PREFIXES ─────────────────────────────────────────────────
// Any path starting with these strings will require a valid JWT cookie.
const PROTECTED_PATHS = ["/dashboard", "/voters"];

// ─── PUBLIC PATHS ────────────────────────────────────────────────────────────
// These paths are always accessible regardless of auth state.
const PUBLIC_PATHS = ["/login", "/signup", "/api/graphql", "/api/upload"];

// Export as "proxy" — the new convention in Next.js 16+
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip for public paths and static assets
  const isPublicPath = PUBLIC_PATHS.some((p) => pathname.startsWith(p));
  const isStaticAsset =
    pathname.startsWith("/_next") || pathname.startsWith("/uploads");

  if (isPublicPath || isStaticAsset) {
    return NextResponse.next();
  }

  // Check if path requires protection
  const isProtectedPath = PROTECTED_PATHS.some((p) => pathname.startsWith(p));

  if (isProtectedPath) {
    // Read the JWT from the "auth_token" cookie (set by the login page)
    const token = request.cookies.get("auth_token")?.value;

    if (!token) {
      // No token — redirect to login with the original path as a redirect param
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Verify the token is valid and not expired
    const user = verifyToken(token);
    if (!user) {
      // Invalid/expired token — clear the cookie and redirect to login
      const loginUrl = new URL("/login", request.url);
      const response = NextResponse.redirect(loginUrl);
      response.cookies.delete("auth_token");
      return response;
    }
  }

  return NextResponse.next();
}

// Configure which routes the proxy applies to
export const config = {
  matcher: [
    // Apply to all paths except Next.js internals and static files
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
