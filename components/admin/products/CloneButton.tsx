"use client";
import { useState, useTransition } from "react";

export function CloneButton({ action }: { action: () => Promise<void> }) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function onClick() {
    setError(null);
    start(async () => {
      try {
        await action();
      } catch (err) {
        setError(err instanceof Error ? err.message : "İşlem başarısız");
      }
    });
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        disabled={pending}
        onClick={onClick}
        className="rounded-sm border border-[var(--color-border-subtle-dark)] px-3 py-1.5 text-sm font-medium hover:border-[var(--color-border-strong)] disabled:opacity-50"
      >
        {pending ? "Kopyalanıyor…" : "Bu ürüne benzer yeni ekle"}
      </button>
      {error && <p className="text-xs text-[var(--color-accent-red)]">{error}</p>}
    </div>
  );
}
