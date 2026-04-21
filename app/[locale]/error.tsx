"use client";
import { useEffect } from "react";

interface Props {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function PublicError({ error, reset }: Props) {
  useEffect(() => {
    // Sentry / structured logger eklenince buraya taşınır.
    console.error("public error:", error);
  }, [error]);

  return (
    <section className="container mx-auto px-6 py-24 text-center">
      <h2 className="text-text-primary text-3xl font-semibold">Bir hata oluştu</h2>
      <p className="text-text-secondary mt-4 text-lg">Sayfa yüklenemedi. Lütfen tekrar deneyin.</p>
      <button
        type="button"
        onClick={reset}
        className="mt-8 rounded-sm bg-[var(--color-accent-cobalt)] px-6 py-3 text-sm font-medium text-white"
      >
        Tekrar dene
      </button>
      {error.digest && (
        <p className="text-text-tertiary mt-6 font-mono text-xs">Kod: {error.digest}</p>
      )}
    </section>
  );
}
