// app/admin/set-password/actions.ts
"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

interface Result {
  ok: boolean;
  message: string;
}

const MIN_LENGTH = 8;

export async function updatePassword(_prevState: Result, formData: FormData): Promise<Result> {
  // Trim'lemiyoruz: şifrenin başında/sonunda boşluk geçerli olabilir.
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");

  if (password.length < MIN_LENGTH) {
    return { ok: false, message: `Şifre en az ${MIN_LENGTH} karakter olmalıdır.` };
  }
  if (password !== confirm) {
    return { ok: false, message: "Şifreler eşleşmiyor." };
  }

  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) {
    return {
      ok: false,
      message:
        "Oturum bulunamadı. Sıfırlama bağlantısının süresi dolmuş olabilir — yeni bağlantı isteyin.",
    };
  }

  const { error } = await supabase.auth.updateUser({ password });
  if (error) {
    const Sentry = await import("@sentry/nextjs");
    Sentry.captureException(error, {
      tags: { module: "admin_set_password" },
      extra: { status: error.status, code: error.code, message: error.message },
    });
    if (error.code === "same_password") {
      return { ok: false, message: "Yeni şifre eskisinden farklı olmalıdır." };
    }
    if (error.code === "weak_password") {
      return { ok: false, message: "Şifre çok zayıf. Daha güçlü bir şifre seçin." };
    }
    return { ok: false, message: "Şifre güncellenemedi. Tekrar deneyin." };
  }

  redirect("/admin/catalog-requests");
}
