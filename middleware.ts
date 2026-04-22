// middleware.ts
import createIntlMiddleware from "next-intl/middleware";
import { NextResponse, type NextRequest } from "next/server";
import { routing } from "./i18n/routing";
import { updateSession } from "./lib/supabase/middleware";

const intlMiddleware = createIntlMiddleware(routing);

function isAdminPath(pathname: string): boolean {
  return pathname === "/admin" || pathname.startsWith("/admin/");
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

// Matcher excludes /catalog-template/* so next-intl does not apply a locale
// prefix to the internal PDF render target. Access to those routes is
// guarded by app/catalog-template/layout.tsx (shared-secret header check).
export const config = {
  matcher: ["/((?!_next|_vercel|api|catalog-template|.*\\..*).*)"],
};
