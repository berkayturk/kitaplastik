"use client";
import { useTransition } from "react";

export function CloneButton({ action }: { action: () => Promise<void> }) {
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => start(() => action())}
      className="rounded-sm border border-[var(--color-border-subtle-dark)] px-3 py-1.5 text-sm font-medium hover:border-[var(--color-border-strong)] disabled:opacity-50"
    >
      {pending ? "Kopyalanıyor…" : "Bu ürüne benzer yeni ekle"}
    </button>
  );
}
