// app/admin/forgot-password/page.tsx
"use client";

import Link from "next/link";
import { useActionState } from "react";
import { TextField, Button, Card, CardEyebrow, CardTitle } from "@/components/ui";
import { requestReset } from "./actions";

const INITIAL_STATE = { ok: false, message: "" };

export default function ForgotPasswordPage() {
  const [state, action, pending] = useActionState(requestReset, INITIAL_STATE);

  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--color-bg-secondary)] px-6 py-16">
      <form action={action} className="w-full max-w-sm">
        <Card elevated padding="lg" className="space-y-6">
          <div>
            <CardEyebrow>Admin paneli</CardEyebrow>
            <CardTitle className="mt-2">Şifre sıfırla</CardTitle>
            <p className="mt-3 text-[14px] leading-[1.55] text-[var(--color-text-secondary)]">
              E-posta adresine sıfırlama bağlantısı gönderelim. Bağlantı 1 saat geçerlidir.
            </p>
          </div>
          <TextField
            name="email"
            type="email"
            label="E-posta"
            autoComplete="email"
            required
            disabled={state.ok}
          />
          <Button
            type="submit"
            variant="primary"
            size="md"
            isLoading={pending}
            disabled={state.ok}
            className="w-full"
          >
            Sıfırlama Bağlantısı Gönder
          </Button>
          {state.message && (
            <p
              role={state.ok ? "status" : "alert"}
              className={
                state.ok
                  ? "text-[13px] text-[var(--color-accent-jade-hover)]"
                  : "text-[13px] text-[var(--color-alert-red)]"
              }
            >
              {state.message}
            </p>
          )}
          <Link
            href="/admin/login"
            className="block text-center text-[13px] text-[var(--color-text-secondary)] underline-offset-4 hover:underline"
          >
            Giriş ekranına dön
          </Link>
        </Card>
      </form>
    </main>
  );
}
