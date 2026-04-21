// app/admin/settings/notifications/page.tsx
import { requireAdmin } from "@/lib/admin/auth";
import { createServiceClient } from "@/lib/supabase/service";
import { Shell } from "@/components/admin/Shell";
import { addRecipient, toggleRecipient, removeRecipient } from "./actions";

interface Recipient {
  id: string;
  email: string;
  rfq_types: ("custom" | "standart")[];
  active: boolean;
  created_at: string;
}

export default async function Page() {
  const user = await requireAdmin();
  const svc = createServiceClient();
  const { data } = await svc
    .from("notification_recipients")
    .select("*")
    .order("created_at", { ascending: false });
  const rows: Recipient[] = (data as unknown as Recipient[] | null) ?? [];

  const canManage = user.role === "admin";

  return (
    <Shell user={user} active="bildirimler">
      <h1 className="text-text-primary mb-4 text-2xl font-semibold tracking-tight">
        Bildirim Alıcıları
      </h1>
      <p className="text-text-secondary mb-6 text-sm">
        Yeni RFQ geldiğinde hangi e-postalara bildirim gitsin.
      </p>

      {canManage && (
        <form
          action={addRecipient}
          className="bg-bg-secondary/30 mb-8 flex flex-wrap items-end gap-3 rounded-lg border border-[var(--color-border-subtle-dark)] p-4"
        >
          <label className="flex-1">
            <span className="text-text-primary mb-1 block text-xs font-medium">E-posta</span>
            <input
              name="email"
              type="email"
              required
              className="bg-bg-primary/60 text-text-primary w-full rounded-sm border border-[var(--color-border-subtle-dark)] px-3 py-2 text-sm"
            />
          </label>
          <fieldset className="flex gap-3 pt-5 text-xs">
            <label>
              <input type="checkbox" name="types" value="custom" defaultChecked /> custom
            </label>
            <label>
              <input type="checkbox" name="types" value="standart" defaultChecked /> standart
            </label>
          </fieldset>
          <button
            type="submit"
            className="rounded-sm bg-[var(--color-accent-red)] px-3 py-2 text-xs font-semibold text-white"
          >
            Ekle
          </button>
        </form>
      )}

      <ul className="divide-y divide-[var(--color-border-subtle-dark)]/50 rounded-lg border border-[var(--color-border-subtle-dark)]">
        {rows.map((r) => (
          <li key={r.id} className="flex items-center justify-between gap-3 p-3 text-sm">
            <div>
              <span className={r.active ? "text-text-primary" : "text-text-secondary line-through"}>
                {r.email}
              </span>
              <span className="text-text-secondary ms-2 text-xs">{r.rfq_types.join(", ")}</span>
            </div>
            {canManage && (
              <div className="flex gap-2">
                <form action={toggleRecipient}>
                  <input type="hidden" name="id" value={r.id} />
                  <input type="hidden" name="active" value={String(r.active)} />
                  <button
                    type="submit"
                    className="rounded-sm border border-[var(--color-border-subtle-dark)] px-2 py-1 text-xs"
                  >
                    {r.active ? "Pasifleştir" : "Aktifleştir"}
                  </button>
                </form>
                <form action={removeRecipient}>
                  <input type="hidden" name="id" value={r.id} />
                  <button
                    type="submit"
                    className="rounded-sm border border-[var(--color-border-subtle-dark)] px-2 py-1 text-xs text-[var(--color-accent-red)]"
                  >
                    Kaldır
                  </button>
                </form>
              </div>
            )}
          </li>
        ))}
        {rows.length === 0 && <li className="text-text-secondary p-3 text-sm">Henüz alıcı yok.</li>}
      </ul>
    </Shell>
  );
}
