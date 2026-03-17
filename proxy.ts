import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SESSION_COOKIE_NAME } from "./lib/auth-config";

// Protect all routes except these
const publicPaths = ["/login", "/api/auth/session", "/hest.png"];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check if current path is public
  const isPublicPath = publicPaths.some(
    (path) => pathname.startsWith(path) || pathname === path
  );

  // Read the session cookie
  const sessionCookie = request.cookies.get(SESSION_COOKIE_NAME);

  // If no session and trying to access protected route, redirect to login
  if (!sessionCookie && !isPublicPath) {
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  // If logged in and trying to access login page, redirect to home
  if (sessionCookie && pathname === "/login") {
    const homeUrl = new URL("/", request.url);
    return NextResponse.redirect(homeUrl);
  }

  // Allow the request to proceed
  return NextResponse.next();
}

export const config = {
  // Run on all routes except static files and image optimization
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|webp|svg|ico)$).*)',
  ],
};
