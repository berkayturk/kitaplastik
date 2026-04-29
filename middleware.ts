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
    pathname === "/admin/forgot-password" ||
    pathname.startsWith("/admin/forgot-password/") ||
    pathname.startsWith("/admin/auth/callback")
  );
}

// Auth callback hariç login + forgot-password'da kullanıcı zaten oturumlu ise
// dashboard'a yönlendirilir. Callback dışarıda — session'ı kuran handler odur.
function isAuthLandingPath(pathname: string): boolean {
  return (
    pathname === "/admin/login" ||
    pathname.startsWith("/admin/login/") ||
    pathname === "/admin/forgot-password" ||
    pathname.startsWith("/admin/forgot-password/")
  );
}

// Supabase SSR pattern: updateSession refresh edilen access token'ı `response`
// üzerine cookie olarak yazar. Redirect dönerken bu cookie'leri yeni response'a
// kopyalamazsak browser eski/expired token'la kalır → bir sonraki Server Action
// sırasında getUser() null döner → kullanıcı login'e atılır. Bu helper redirect
// response'una refresh cookie'lerini taşır.
function redirectWithCookies(target: URL, sourceResponse: NextResponse): NextResponse {
  const redirect = NextResponse.redirect(target);
  sourceResponse.cookies.getAll().forEach((cookie) => {
    redirect.cookies.set(cookie);
  });
  return redirect;
}

export default async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (isAdminPath(pathname)) {
    const { response, userId } = await updateSession(request);
    if (isAuthLandingPath(pathname) && userId) {
      const url = request.nextUrl.clone();
      url.pathname = "/admin/catalog-requests";
      url.search = "";
      return redirectWithCookies(url, response);
    }
    if (!isAdminPublicPath(pathname) && !userId) {
      const url = request.nextUrl.clone();
      url.pathname = "/admin/login";
      url.searchParams.set("next", pathname);
      return redirectWithCookies(url, response);
    }
    return response;
  }

  return intlMiddleware(request);
}

// Matcher excludes /catalog-template/* so next-intl does not apply a locale
// prefix to the internal PDF render target. Access to those routes is
// guarded by app/catalog-template/layout.tsx (shared-secret header check).
// /pa/* is the Plausible same-origin proxy path — next.config.ts
// beforeFiles rewrites forward it upstream before middleware would run,
// but excluding it here makes the intent explicit and avoids any
// middleware-level handling if the rewrite order ever shifts.
export const config = {
  matcher: ["/((?!_next|_vercel|api|catalog-template|pa|.*\\..*).*)"],
};
