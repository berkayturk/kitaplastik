// app/admin/set-password/page.tsx
"use client";

import { useActionState } from "react";
import { TextField, Button, Card, CardEyebrow, CardTitle } from "@/components/ui";
import { updatePassword } from "./actions";

const INITIAL_STATE = { ok: false, message: "" };

export default function SetPasswordPage() {
  const [state, action, pending] = useActionState(updatePassword, INITIAL_STATE);

  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--color-bg-secondary)] px-6 py-16">
      <form action={action} className="w-full max-w-sm">
        <Card elevated padding="lg" className="space-y-6">
          <div>
            <CardEyebrow>Admin paneli</CardEyebrow>
            <CardTitle className="mt-2">Yeni şifre belirle</CardTitle>
            <p className="mt-3 text-[14px] leading-[1.55] text-[var(--color-text-secondary)]">
              En az 8 karakter olmalı. Eski şifreniz kullanılamayacak.
            </p>
          </div>
          <TextField
            name="password"
            type="password"
            label="Yeni şifre"
            autoComplete="new-password"
            minLength={8}
            required
          />
          <TextField
            name="confirm"
            type="password"
            label="Şifre tekrar"
            autoComplete="new-password"
            minLength={8}
            required
          />
          <Button type="submit" variant="primary" size="md" isLoading={pending} className="w-full">
            Şifreyi Kaydet
          </Button>
          {state.message && (
            <p role="alert" className="text-[13px] text-[var(--color-alert-red)]">
              {state.message}
            </p>
          )}
        </Card>
      </form>
    </main>
  );
}
