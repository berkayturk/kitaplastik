// app/admin/catalog-requests/page.tsx
//
// Admin list of catalog download requests. Service-client read (bypasses RLS);
// most-recent first. Plan 5b data minimization: only email + locale + time
// stored; IP/UA never persisted, rows auto-deleted after 30 days via pg_cron.

import { requireAdmin } from "@/lib/admin/auth";
import { createServiceClient } from "@/lib/supabase/service";
import { Shell } from "@/components/admin/Shell";

interface CatalogRequestRow {
  id: string;
  email: string;
  locale: "tr" | "en" | "ru" | "ar";
  created_at: string;
}

const LOCALE_LABEL: Record<CatalogRequestRow["locale"], string> = {
  tr: "Türkçe",
  en: "English",
  ru: "Русский",
  ar: "العربية",
};

export default async function Page() {
  const user = await requireAdmin();

  const svc = createServiceClient();
  const { data, error } = await svc
    .from("catalog_requests")
    .select("id, email, locale, created_at")
    .order("created_at", { ascending: false })
    .limit(200);

  const rows: CatalogRequestRow[] = (data ?? []) as CatalogRequestRow[];
  const errorMessage = error
    ? typeof error === "object" && error !== null && "message" in error
      ? String((error as { message?: unknown }).message ?? "")
      : "unknown"
    : null;

  return (
    <Shell user={user} active="catalog">
      <div className="mb-6">
        <h1 className="font-display text-[28px] font-medium tracking-tight text-[var(--color-text-primary)]">
          Katalog İstekleri
        </h1>
        <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
          Son {rows.length} kayıt · 30 günden eski kayıtlar otomatik silinir
        </p>
      </div>

      {errorMessage && (
        <p
          role="alert"
          className="mb-4 rounded-[var(--radius-sm)] border border-[var(--color-alert-red)]/40 bg-[var(--color-alert-red)]/10 px-4 py-3 text-sm text-[var(--color-alert-red)]"
        >
          Veri yüklenemedi ({errorMessage}). Tablo oluşmamış olabilir —{" "}
          <code>pnpm exec supabase db push</code> komutunu çalıştırın.
        </p>
      )}

      <div className="overflow-hidden rounded-[var(--radius-md)] border border-[var(--color-border-hairline)] bg-[var(--color-bg-elevated)]">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-[var(--color-border-hairline)] text-[11px] tracking-wide text-[var(--color-text-tertiary)] uppercase">
            <tr>
              <th className="px-4 py-3 font-medium">Tarih</th>
              <th className="px-4 py-3 font-medium">E-posta</th>
              <th className="px-4 py-3 font-medium">Dil</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--color-border-hairline)]">
            {rows.length === 0 ? (
              <tr>
                <td
                  colSpan={3}
                  className="px-4 py-10 text-center text-[var(--color-text-tertiary)]"
                >
                  Henüz katalog isteği yok.
                </td>
              </tr>
            ) : (
              rows.map((r) => (
                <tr key={r.id} className="hover:bg-[var(--color-bg-secondary)]/40">
                  <td className="px-4 py-3 font-mono text-[12px] text-[var(--color-text-secondary)]">
                    {new Date(r.created_at).toLocaleString("tr-TR")}
                  </td>
                  <td className="px-4 py-3 text-[var(--color-text-primary)]">
                    <a
                      href={`mailto:${r.email}`}
                      className="hover:text-[var(--color-accent-cobalt)] hover:underline"
                    >
                      {r.email}
                    </a>
                  </td>
                  <td className="px-4 py-3 text-[var(--color-text-secondary)]">
                    {LOCALE_LABEL[r.locale] ?? r.locale}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </Shell>
  );
}
