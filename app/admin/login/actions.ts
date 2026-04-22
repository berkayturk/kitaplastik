// app/admin/login/actions.ts
"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

interface Result {
  ok: boolean;
  message: string;
}

export async function signIn(_prevState: Result, formData: FormData): Promise<Result> {
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  // Not trimmed: leading/trailing whitespace is valid in passwords and must not be silently dropped.
  const password = String(formData.get("password") ?? "");
  if (!email || !password) {
    return { ok: false, message: "E-posta ve şifre zorunludur." };
  }
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    const Sentry = await import("@sentry/nextjs");
    Sentry.captureException(error, {
      tags: { module: "admin_login" },
      extra: { status: error.status, code: error.code, message: error.message },
    });
    if (error.code === "invalid_credentials") {
      return { ok: false, message: "E-posta veya şifre hatalı." };
    }
    if (error.status === 429 || error.code === "over_request_rate_limit") {
      return { ok: false, message: "Çok fazla deneme. 1 dakika sonra tekrar deneyin." };
    }
    return { ok: false, message: "Giriş başarısız. Tekrar deneyin." };
  }
  redirect("/admin/catalog-requests");
}
