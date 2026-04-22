// app/admin/inbox/[id]/page.tsx
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/admin/auth";
import { createServiceClient } from "@/lib/supabase/service";
import { Shell } from "@/components/admin/Shell";
import { StatusBadge, type RfqStatus } from "@/components/admin/StatusBadge";
import { formatRfqPayload } from "@/lib/admin/rfq-format";
import { getCountryName } from "@/lib/countries";
import { updateStatus, saveNotes } from "./actions";

interface Attachment {
  path: string;
  name: string;
  size: number;
  mime: string;
}

interface Rfq {
  id: string;
  type: "custom" | "standart";
  status: RfqStatus;
  locale: string;
  contact: Record<string, string>;
  payload: Record<string, unknown>;
  attachments: Attachment[];
  internal_notes: string | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

interface PageProps {
  params: Promise<{ id: string }>;
}

const STATUSES = ["new", "reviewing", "quoted", "won", "lost", "archived"] as const;

export default async function Page({ params }: PageProps) {
  const user = await requireAdmin();
  const { id } = await params;

  const svc = createServiceClient();
  const { data, error } = await svc.from("rfqs").select("*").eq("id", id).single();
  if (error || !data) notFound();
  const rfq = data as unknown as Rfq;

  const signed: Array<Attachment & { url: string | null }> = [];
  for (const a of rfq.attachments ?? []) {
    const { data: s } = await svc.storage.from("rfq-attachments").createSignedUrl(a.path, 60 * 10);
    signed.push({ ...a, url: s?.signedUrl ?? null });
  }

  return (
    <Shell user={user} active="inbox">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-text-primary text-2xl font-semibold tracking-tight">
            RFQ {rfq.id.slice(0, 8)}
          </h1>
          <p className="text-text-secondary text-xs">
            {new Date(rfq.created_at).toLocaleString("tr-TR")} · {rfq.type} ·{" "}
            <StatusBadge status={rfq.status} />
          </p>
        </div>
        <form action={updateStatus} className="flex items-center gap-2">
          <input type="hidden" name="id" value={rfq.id} />
          <select
            name="status"
            defaultValue={rfq.status}
            className="bg-bg-primary/60 rounded-sm border border-[var(--color-border-subtle-dark)] px-2 py-1 text-xs"
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <button
            type="submit"
            className="rounded-sm bg-[var(--color-accent-red)] px-3 py-1 text-xs font-semibold text-white"
          >
            Güncelle
          </button>
        </form>
      </div>

      <section className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="bg-bg-secondary/30 rounded-lg border border-[var(--color-border-subtle-dark)] p-4">
          <h2 className="text-text-primary mb-2 text-sm font-semibold">İletişim</h2>
          <dl className="text-xs">
            {Object.entries(rfq.contact).map(([k, v]) => {
              const display = k === "country" ? getCountryName(String(v), "tr") : String(v);
              return (
                <div key={k} className="flex justify-between gap-2 py-0.5">
                  <dt className="text-text-secondary">{k}</dt>
                  <dd className="text-text-primary">{display}</dd>
                </div>
              );
            })}
            <div className="flex justify-between gap-2 py-0.5">
              <dt className="text-text-secondary">IP</dt>
              <dd className="text-text-primary">{rfq.ip_address ?? "—"}</dd>
            </div>
          </dl>
        </div>
        <div className="bg-bg-secondary/30 rounded-lg border border-[var(--color-border-subtle-dark)] p-4">
          <h2 className="text-text-primary mb-2 text-sm font-semibold">Ekler ({signed.length})</h2>
          <ul className="space-y-1 text-xs">
            {signed.map((a) => (
              <li key={a.path} className="flex items-center justify-between gap-2">
                <span className="truncate">
                  {a.name} · {(a.size / 1024).toFixed(0)} KB
                </span>
                {a.url ? (
                  <a
                    href={a.url}
                    className="text-[var(--color-accent-blue)] hover:underline"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    İndir
                  </a>
                ) : (
                  <span>—</span>
                )}
              </li>
            ))}
            {signed.length === 0 && <li className="text-text-secondary">Ek yok.</li>}
          </ul>
        </div>
      </section>

      <section className="mt-6">
        <h2 className="text-text-primary mb-3 text-sm font-semibold">Form Verisi</h2>
        <PayloadDisplay type={rfq.type} payload={rfq.payload} />
      </section>

      <section className="mt-6">
        <form action={saveNotes} className="space-y-2">
          <input type="hidden" name="id" value={rfq.id} />
          <label className="block">
            <span className="text-text-primary text-sm font-semibold">Dahili Not</span>
            <textarea
              name="notes"
              rows={6}
              defaultValue={rfq.internal_notes ?? ""}
              className="bg-bg-primary/60 text-text-primary mt-1 w-full rounded-sm border border-[var(--color-border-subtle-dark)] px-3 py-2 font-mono text-xs"
            />
          </label>
          <button
            type="submit"
            className="rounded-sm bg-[var(--color-accent-red)] px-3 py-1.5 text-xs font-semibold text-white"
          >
            Notu Kaydet
          </button>
        </form>
      </section>
    </Shell>
  );
}

function PayloadDisplay({
  type,
  payload,
}: {
  type: "custom" | "standart";
  payload: Record<string, unknown>;
}) {
  const entries = formatRfqPayload(type, payload);
  const longEntries = entries.filter((e) => e.fullWidth);
  const shortEntries = entries.filter((e) => !e.fullWidth);

  return (
    <div className="bg-bg-secondary/30 space-y-5 rounded-lg border border-[var(--color-border-subtle-dark)] p-5">
      {shortEntries.length > 0 && (
        <dl className="grid grid-cols-1 gap-x-8 gap-y-3 sm:grid-cols-2">
          {shortEntries.map((e) => (
            <div key={e.key} className="flex flex-col gap-0.5">
              <dt className="text-text-secondary text-[11px] tracking-wide uppercase">{e.label}</dt>
              <dd className="text-text-primary text-sm">
                {e.kind === "chips" ? (
                  <span className="flex flex-wrap gap-1.5">
                    {e.value.split(",").map((chip) => (
                      <span
                        key={chip.trim()}
                        className="inline-flex items-center rounded-[var(--radius-sm)] bg-[var(--color-accent-cobalt)]/10 px-2 py-0.5 text-[11px] font-medium text-[var(--color-accent-cobalt)]"
                      >
                        {chip.trim()}
                      </span>
                    ))}
                  </span>
                ) : e.kind === "boolean" ? (
                  <span
                    className={
                      e.value === "Evet"
                        ? "inline-flex items-center rounded-[var(--radius-sm)] bg-[var(--color-accent-jade)]/10 px-2 py-0.5 text-[11px] font-medium text-[var(--color-accent-jade)]"
                        : "text-text-secondary text-sm"
                    }
                  >
                    {e.value}
                  </span>
                ) : (
                  e.value
                )}
              </dd>
            </div>
          ))}
        </dl>
      )}

      {longEntries.map((e) => (
        <div key={e.key} className="space-y-1.5">
          <p className="text-text-secondary text-[11px] tracking-wide uppercase">{e.label}</p>
          <div className="text-text-primary bg-bg-primary/60 rounded-[var(--radius-sm)] border border-[var(--color-border-hairline)] p-3.5 text-sm leading-relaxed whitespace-pre-wrap">
            {e.value}
          </div>
        </div>
      ))}

      <details className="group mt-2">
        <summary className="text-text-secondary hover:text-text-primary cursor-pointer text-[11px] select-none">
          Ham veri (JSON)
        </summary>
        <pre className="bg-bg-primary/60 mt-2 overflow-x-auto rounded-[var(--radius-sm)] border border-[var(--color-border-hairline)] p-3 font-mono text-[11px]">
          {JSON.stringify(payload, null, 2)}
        </pre>
      </details>
    </div>
  );
}
