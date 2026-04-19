// app/admin/login/page.tsx
"use client";

import { useActionState } from "react";
import { TextField, Button, Card, CardEyebrow, CardTitle } from "@/components/ui";
import { signIn } from "./actions";

const INITIAL_STATE = { ok: false, message: "" };

export default function LoginPage() {
  const [state, action, pending] = useActionState(signIn, INITIAL_STATE);

  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--color-bg-secondary)] px-6 py-16">
      <form action={action} className="w-full max-w-sm">
        <Card elevated padding="lg" className="space-y-6">
          <div>
            <CardEyebrow>Admin paneli</CardEyebrow>
            <CardTitle className="mt-2">Giriş</CardTitle>
            <p className="mt-3 text-[14px] leading-[1.55] text-[var(--color-text-secondary)]">
              Yetkili hesap ile giriş yapın.
            </p>
          </div>
          <TextField name="email" type="email" label="E-posta" autoComplete="email" required />
          <TextField
            name="password"
            type="password"
            label="Şifre"
            autoComplete="current-password"
            required
          />
          <Button type="submit" variant="primary" size="md" isLoading={pending} className="w-full">
            Giriş Yap
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
        </Card>
      </form>
    </main>
  );
}
