"use client";
import { useEffect } from "react";

interface Props {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function AdminError({ error, reset }: Props) {
  useEffect(() => {
    console.error("admin error:", error);
  }, [error]);

  return (
    <div className="mx-auto max-w-2xl p-8">
      <h2 className="text-text-primary text-xl font-semibold">Bir hata oluştu</h2>
      <p className="text-text-secondary mt-3 text-sm">
        İşlem tamamlanamadı. Tekrar deneyin veya sayfayı yenileyin.
      </p>
      {error.digest && (
        <p className="text-text-tertiary mt-2 font-mono text-xs">Kod: {error.digest}</p>
      )}
      <div className="mt-4 flex gap-3">
        <button
          type="button"
          onClick={reset}
          className="rounded-sm border border-[var(--color-border-subtle-dark)] px-3 py-1.5 text-sm font-medium"
        >
          Tekrar dene
        </button>
      </div>
    </div>
  );
}
