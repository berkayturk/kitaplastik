// middleware.ts
import createIntlMiddleware from "next-intl/middleware";
import { NextResponse, type NextRequest } from "next/server";
import { routing } from "./i18n/routing";
import { updateSession } from "./lib/supabase/middleware";

const intlMiddleware = createIntlMiddleware(routing);

function isAdminPath(pathname: string): boolean {
  return pathname === "/admin" || pathname.startsWith("/admin/");
}

// Internal render-verification route; bypass locale middleware entirely.
// Remove this helper when /design-debug is deleted before ship.
function isDesignDebugPath(pathname: string): boolean {
  return pathname === "/design-debug" || pathname.startsWith("/design-debug/");
}

function isAdminPublicPath(pathname: string): boolean {
  return (
    pathname === "/admin/login" ||
    pathname.startsWith("/admin/login/") ||
    pathname.startsWith("/admin/auth/callback")
  );
}

export default async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (isDesignDebugPath(pathname)) {
    return NextResponse.next();
  }

  if (isAdminPath(pathname)) {
    const { response, userId } = await updateSession(request);
    if (!isAdminPublicPath(pathname) && !userId) {
      const url = request.nextUrl.clone();
      url.pathname = "/admin/login";
      url.searchParams.set("next", pathname);
      return NextResponse.redirect(url);
    }
    return response;
  }

  return intlMiddleware(request);
}

export const config = {
  matcher: ["/((?!_next|_vercel|api|.*\\..*).*)"],
};
