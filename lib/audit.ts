// lib/audit.ts
import "server-only";
import { createServiceClient } from "@/lib/supabase/service";

export interface AuditEntry {
  action: string;
  entity_type: string;
  entity_id: string | null;
  user_id: string | null;
  ip: string | null;
  diff: unknown;
}

export async function recordAudit(entry: AuditEntry): Promise<void> {
  try {
    const supabase = createServiceClient();
    const { error } = await supabase.from("audit_log").insert({
      action: entry.action,
      entity_type: entry.entity_type,
      entity_id: entry.entity_id,
      user_id: entry.user_id,
      ip_address: entry.ip,
      diff: entry.diff as never,
    });
    if (error) {
      console.warn("[audit] insert failed", error.message);
    }
  } catch (e) {
    console.warn("[audit] unexpected", e);
  }
}
