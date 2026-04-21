"use client";
import { useState, useTransition } from "react";

export function RestoreButton({ action }: { action: () => Promise<void> }) {
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
        className="text-sm font-medium text-[var(--color-accent-cobalt)] hover:underline disabled:opacity-50"
      >
        {pending ? "Geri yükleniyor…" : "Geri yükle"}
      </button>
      {error && <p className="text-xs text-[var(--color-accent-red)]">{error}</p>}
    </div>
  );
}
