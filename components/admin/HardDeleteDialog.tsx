"use client";
import { useState, useTransition } from "react";

interface Props {
  /** Visible label of the entity (e.g. product TR name or reference key). */
  entityLabel: string;
  /** What the user must type into the confirmation field to enable the destructive button. */
  confirmToken: string;
  /**
   * Server action that performs the irreversible delete. Receives the typed
   * token; the server re-validates it against the DB so a direct call without
   * the dialog is rejected.
   */
  action: (typedToken: string) => Promise<void>;
  /** Compact label displayed on the trigger button. */
  triggerLabel?: string;
}

export function HardDeleteDialog({
  entityLabel,
  confirmToken,
  action,
  triggerLabel = "Kalıcı sil",
}: Props) {
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [typed, setTyped] = useState("");

  const matches = typed.trim() === confirmToken;

  function close() {
    setOpen(false);
    setError(null);
    setTyped("");
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-sm font-medium text-[var(--color-accent-red)] hover:underline"
      >
        {triggerLabel}
      </button>
      {open && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
        >
          <div className="bg-bg-primary w-full max-w-md rounded-md p-5 shadow-xl">
            <h3 className="text-base font-semibold text-[var(--color-accent-red)]">
              ⚠ Kalıcı silme — geri alınamaz
            </h3>
            <p className="text-text-secondary mt-3 text-sm">
              Bu işlem <strong>{entityLabel}</strong> kaydını veritabanından ve depolama alanındaki
              ilişkili görsellerden <strong>kalıcı olarak siler</strong>. İşlem tamamlandıktan sonra
              geri yüklenemez.
            </p>
            <p className="text-text-secondary mt-3 text-sm">
              Onaylamak için aşağıya{" "}
              <code className="bg-bg-secondary rounded px-1 py-0.5 font-mono text-xs">
                {confirmToken}
              </code>{" "}
              yazın:
            </p>
            <input
              type="text"
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              placeholder={confirmToken}
              autoFocus
              className="bg-bg-secondary mt-2 w-full rounded-sm border border-[var(--color-border-subtle-dark)] px-2 py-1.5 font-mono text-sm"
              aria-label="Onay kelimesini yazın"
            />
            {error && (
              <p className="mt-3 text-xs text-[var(--color-accent-red)]" role="alert">
                {error}
              </p>
            )}
            <div className="mt-4 flex justify-end gap-3">
              <button type="button" onClick={close} className="text-sm">
                İptal
              </button>
              <button
                type="button"
                disabled={!matches || pending}
                onClick={() => {
                  setError(null);
                  start(async () => {
                    try {
                      await action(typed.trim());
                      close();
                    } catch (err) {
                      setError(err instanceof Error ? err.message : "Kalıcı silme başarısız");
                    }
                  });
                }}
                className="rounded-sm bg-[var(--color-accent-red)] px-3 py-1.5 text-sm text-white disabled:opacity-40"
              >
                {pending ? "Siliniyor…" : "Kalıcı sil"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
