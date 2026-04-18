// components/admin/StatusBadge.tsx
"use client";

import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

export type RfqStatus = "new" | "reviewing" | "quoted" | "won" | "lost" | "archived";

const STYLES: Record<RfqStatus, string> = {
  new: "bg-blue-500/15 text-blue-300",
  reviewing: "bg-amber-500/15 text-amber-300",
  quoted: "bg-violet-500/15 text-violet-300",
  won: "bg-emerald-500/15 text-emerald-300",
  lost: "bg-red-500/15 text-red-300",
  archived: "bg-slate-500/15 text-slate-300",
};

export function StatusBadge({ status }: { status: RfqStatus }) {
  const t = useTranslations("admin.inbox.statuses");
  return (
    <span className={cn("inline-flex rounded-sm px-2 py-0.5 text-xs font-medium", STYLES[status])}>
      {t(status)}
    </span>
  );
}
