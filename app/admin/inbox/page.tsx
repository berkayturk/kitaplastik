// app/admin/inbox/page.tsx
import { requireAdmin } from "@/lib/admin/auth";
import { createServiceClient } from "@/lib/supabase/service";
import { Shell } from "@/components/admin/Shell";
import { InboxTable, type InboxRow } from "@/components/admin/InboxTable";
import type { RfqStatus } from "@/components/admin/StatusBadge";

interface ContactShape {
  name?: string;
  email?: string;
  company?: string;
}

interface Row {
  id: string;
  type: "custom" | "standart";
  status: RfqStatus;
  contact: ContactShape;
  created_at: string;
}

export default async function InboxPage() {
  const user = await requireAdmin();
  const svc = createServiceClient();
  const { data, error } = await svc
    .from("rfqs")
    .select("id, type, status, contact, created_at")
    .order("created_at", { ascending: false })
    .limit(100);

  const rows: InboxRow[] =
    !error && data
      ? (data as unknown as Row[]).map((r) => ({
          id: r.id,
          type: r.type,
          status: r.status,
          company: r.contact?.company ?? "—",
          name: r.contact?.name ?? "—",
          email: r.contact?.email ?? "—",
          createdAt: r.created_at,
        }))
      : [];

  return (
    <Shell user={user} active="inbox">
      <h1 className="text-text-primary mb-4 text-2xl font-semibold tracking-tight">Gelen Kutusu</h1>
      <InboxTable rows={rows} />
    </Shell>
  );
}
