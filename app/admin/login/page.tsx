// app/admin/login/page.tsx
"use client";

import { Suspense, useActionState } from "react";
import { useSearchParams } from "next/navigation";
import { sendMagicLink } from "./actions";

const INITIAL_STATE = { ok: false, message: "" };

function LoginForm() {
  const sp = useSearchParams();
  const next = sp.get("next") ?? "/admin/inbox";
  const [state, action, pending] = useActionState(sendMagicLink, INITIAL_STATE);

  return (
    <form
      action={action}
      className="bg-bg-secondary/40 w-full max-w-sm space-y-4 rounded-lg border border-[var(--color-border-subtle-dark)] p-6"
    >
      <h1 className="text-text-primary text-xl font-semibold">Admin Girişi</h1>
      <p className="text-text-secondary text-xs">
        Kayıtlı e-posta adresinize tek kullanımlık giriş bağlantısı göndeririz.
      </p>
      <label className="block">
        <span className="text-text-primary mb-1 block text-xs font-medium">E-posta</span>
        <input
          name="email"
          type="email"
          required
          autoComplete="email"
          className="bg-bg-primary/60 text-text-primary w-full rounded-sm border border-[var(--color-border-subtle-dark)] px-3 py-2 text-sm"
        />
      </label>
      <input type="hidden" name="next" value={next} />
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-sm bg-[var(--color-accent-red)] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
      >
        {pending ? "Gönderiliyor…" : "Bağlantıyı Gönder"}
      </button>
      {state.message && (
        <p
          role={state.ok ? "status" : "alert"}
          className={
            state.ok ? "text-sm text-emerald-400" : "text-sm text-[var(--color-accent-red)]"
          }
        >
          {state.message}
        </p>
      )}
    </form>
  );
}

export default function LoginPage() {
  return (
    <main className="bg-bg-primary flex min-h-screen items-center justify-center px-6">
      <Suspense fallback={null}>
        <LoginForm />
      </Suspense>
    </main>
  );
}
