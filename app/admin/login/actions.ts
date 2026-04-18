// app/admin/login/actions.ts
"use server";

import { createClient } from "@/lib/supabase/server";
import { env } from "@/lib/env";

interface Result {
  ok: boolean;
  message: string;
}

export async function sendMagicLink(_prevState: Result, formData: FormData): Promise<Result> {
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const next = String(formData.get("next") ?? "/admin/inbox");
  if (!email || !email.includes("@")) {
    return { ok: false, message: "Geçerli bir e-posta girin." };
  }
  const supabase = await createClient();
  const origin = env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${origin}/admin/auth/callback?next=${encodeURIComponent(next)}`,
      shouldCreateUser: false,
    },
  });
  if (error) {
    return { ok: false, message: "Bağlantı gönderilemedi. Lütfen tekrar deneyin." };
  }
  return { ok: true, message: "E-posta gönderildi. Lütfen gelen kutunuzu kontrol edin." };
}
