"use client";
import { useState, useTransition } from "react";

export function DeleteDialog({
  productName,
  action,
}: {
  productName: string;
  action: () => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Sil"
        className="text-[var(--color-accent-red)]"
      >
        🗑
      </button>
      {open && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
        >
          <div className="bg-bg-primary w-96 rounded-md p-5 shadow-xl">
            <h3 className="text-base font-semibold">Silmek istediğine emin misin?</h3>
            <p className="text-text-secondary mt-2 text-sm">
              &quot;{productName}&quot; ürünü Silinmiş tab&apos;ına taşınacak. Daha sonra geri
              yükleyebilirsin.
            </p>
            {error && <p className="mt-3 text-xs text-[var(--color-accent-red)]">{error}</p>}
            <div className="mt-4 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  setError(null);
                }}
                className="text-sm"
              >
                İptal
              </button>
              <button
                type="button"
                disabled={pending}
                onClick={() => {
                  setError(null);
                  start(async () => {
                    try {
                      await action();
                      setOpen(false);
                    } catch (err) {
                      setError(err instanceof Error ? err.message : "Silme başarısız");
                    }
                  });
                }}
                className="rounded-sm bg-[var(--color-accent-red)] px-3 py-1.5 text-sm text-white disabled:opacity-60"
              >
                {pending ? "Siliniyor…" : "Evet, sil"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
