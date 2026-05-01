"use server";

import { createClient } from "@/lib/supabase/server";
import { env } from "@/lib/env";

interface Result {
  ok: boolean;
  message: string;
}

export async function requestReset(_prevState: Result, formData: FormData): Promise<Result> {
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  if (!email) {
    return { ok: false, message: "E-posta zorunludur." };
  }

  const origin = (env.NEXT_PUBLIC_SITE_URL ?? "https://kitaplastik.com").replace(/\/$/, "");
  const redirectTo = `${origin}/admin/auth/callback?next=/admin/set-password`;

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });

  if (error) {
    const Sentry = await import("@sentry/nextjs");
    Sentry.captureException(error, {
      tags: { module: "admin_forgot_password" },
      extra: { status: error.status, code: error.code, message: error.message },
    });
    if (error.status === 429 || error.code === "over_email_send_rate_limit") {
      return { ok: false, message: "Çok fazla istek. Birkaç dakika sonra tekrar deneyin." };
    }
  }

  // Email enumeration koruması: hata olsa da olmasa da aynı mesajı döner.
  return {
    ok: true,
    message:
      "Eğer bu e-posta sistemde kayıtlıysa, sıfırlama bağlantısı gönderildi. Gelen kutunu (ve spam'ı) kontrol et.",
  };
}
