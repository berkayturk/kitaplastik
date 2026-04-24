// components/admin/settings/company/CompanySection.tsx
import type { ReactNode } from "react";

interface CompanySectionProps {
  index: number; // 1-4
  title: string;
  children: ReactNode;
}

export function CompanySection({ index, title, children }: CompanySectionProps) {
  const label = index.toString().padStart(2, "0");
  return (
    <section className="rounded-[var(--radius-md)] border border-[var(--color-border-hairline)] bg-[var(--color-bg-elevated)] p-6">
      <header className="mb-6 flex items-baseline gap-3 border-b border-[var(--color-border-hairline)] pb-3">
        <span className="font-mono text-[11px] tracking-[0.08em] text-[var(--color-accent-cobalt)]">
          BÖLÜM {label}
        </span>
        <h2 className="font-display text-[18px] font-medium tracking-tight">{title}</h2>
      </header>
      <div className="space-y-4">{children}</div>
    </section>
  );
}
