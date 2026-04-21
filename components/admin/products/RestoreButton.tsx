"use client";
import { useTransition } from "react";

export function RestoreButton({ action }: { action: () => Promise<void> }) {
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => start(() => action())}
      className="text-sm font-medium text-[var(--color-accent-cobalt)] hover:underline disabled:opacity-50"
    >
      {pending ? "Geri yükleniyor…" : "Geri yükle"}
    </button>
  );
}
