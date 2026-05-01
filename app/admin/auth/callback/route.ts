// app/admin/auth/callback/route.ts
import { NextResponse, type NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { env } from "@/lib/env";

function publicOrigin(): string {
  return (env.NEXT_PUBLIC_SITE_URL ?? "https://kitaplastik.com").replace(/\/$/, "");
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const origin = publicOrigin();
  const rawNext = searchParams.get("next") ?? "/admin/catalog-requests";
  // Open-redirect guard: only internal absolute paths (reject scheme-relative like "//evil.com")
  const safeNext =
    rawNext.startsWith("/") && !rawNext.startsWith("//") ? rawNext : "/admin/catalog-requests";
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const code = searchParams.get("code");
  // Recovery flow her zaman /admin/set-password'a yönlenir.
  const next = type === "recovery" ? "/admin/set-password" : safeNext;

  const supabase = await createClient();

  // Non-PKCE magic-link flow (admin-generated or older clients)
  if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
    if (!error) return NextResponse.redirect(`${origin}${next}`);
    return NextResponse.redirect(`${origin}/admin/login?error=exchange_failed`);
  }

  // PKCE flow (default for @supabase/ssr client)
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(`${origin}${next}`);
    return NextResponse.redirect(`${origin}/admin/login?error=exchange_failed`);
  }

  return NextResponse.redirect(`${origin}/admin/login?error=missing_code`);
}
