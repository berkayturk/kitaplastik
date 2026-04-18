// app/admin/login/page.tsx
"use client";

import { Suspense, useActionState } from "react";
import { useSearchParams } from "next/navigation";
import { TextField, Button, Card, CardEyebrow, CardTitle } from "@/components/ui";
import { sendMagicLink } from "./actions";

const INITIAL_STATE = { ok: false, message: "" };

function LoginForm() {
  const sp = useSearchParams();
  const next = sp.get("next") ?? "/admin/inbox";
  const [state, action, pending] = useActionState(sendMagicLink, INITIAL_STATE);

  return (
    <form action={action} className="w-full max-w-sm">
      <Card elevated padding="lg" className="space-y-6">
        <div>
          <CardEyebrow>Admin paneli</CardEyebrow>
          <CardTitle className="mt-2">Girişe başla</CardTitle>
          <p className="mt-3 text-[14px] leading-[1.55] text-[var(--color-text-secondary)]">
            Kayıtlı e-posta adresinize tek kullanımlık bir giriş bağlantısı göndeririz.
          </p>
        </div>
        <TextField
          name="email"
          type="email"
          label="E-posta"
          placeholder="ad@kitaplastik.com"
          autoComplete="email"
          required
        />
        <input type="hidden" name="next" value={next} />
        <Button type="submit" variant="primary" size="md" isLoading={pending} className="w-full">
          Bağlantıyı Gönder
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
  );
}

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--color-bg-secondary)] px-6 py-16">
      <Suspense fallback={null}>
        <LoginForm />
      </Suspense>
    </main>
  );
}
