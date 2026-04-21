"use client";
export function SaveProgressModal({
  open,
  label = "Kaydediliyor...",
}: {
  open: boolean;
  label?: string;
}) {
  if (!open) return null;
  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
    >
      <div className="bg-bg-primary rounded-md px-6 py-4 shadow-xl">
        <p className="text-sm font-medium">{label}</p>
      </div>
    </div>
  );
}
