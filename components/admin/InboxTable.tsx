// components/admin/InboxTable.tsx
"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";
import { StatusBadge, type RfqStatus } from "./StatusBadge";

export interface InboxRow {
  id: string;
  type: "custom" | "standart";
  status: RfqStatus;
  company: string;
  name: string;
  email: string;
  createdAt: string;
}

export function InboxTable({ rows }: { rows: InboxRow[] }) {
  const t = useTranslations("admin.inbox");
  if (rows.length === 0) {
    return <p className="text-text-secondary text-sm">{t("empty")}</p>;
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-sm">
        <thead className="text-text-secondary border-b border-[var(--color-border-subtle-dark)] text-left text-xs">
          <tr>
            <th className="py-2 pe-3">{t("columns.type")}</th>
            <th className="py-2 pe-3">{t("columns.status")}</th>
            <th className="py-2 pe-3">{t("columns.company")}</th>
            <th className="py-2 pe-3">{t("columns.contact")}</th>
            <th className="py-2 pe-3">{t("columns.created")}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr
              key={r.id}
              className="border-b border-[var(--color-border-subtle-dark)]/50 align-top hover:bg-white/[0.02]"
            >
              <td className="py-2 pe-3">
                <Link href={`/admin/inbox/${r.id}`} className="hover:underline">
                  {t(`types.${r.type}`)}
                </Link>
              </td>
              <td className="py-2 pe-3">
                <StatusBadge status={r.status} />
              </td>
              <td className="py-2 pe-3">{r.company}</td>
              <td className="py-2 pe-3">
                {r.name}
                <br />
                <span className="text-text-secondary text-xs">{r.email}</span>
              </td>
              <td className="text-text-secondary py-2 pe-3 text-xs">
                {new Date(r.createdAt).toLocaleString("tr-TR")}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
