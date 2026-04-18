// components/admin/Shell.tsx
import type { ReactNode } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { AdminUser } from "@/lib/admin/auth";
import { cn } from "@/lib/utils";

interface Props {
  user: AdminUser;
  active: "inbox" | "bildirimler";
  children: ReactNode;
}

async function signOut() {
  "use server";
  const supabase = await createClient();
  await supabase.auth.signOut();
  // After sign out, middleware will redirect to /admin/login on next request.
}

export function Shell({ user, active, children }: Props) {
  return (
    <div className="min-h-screen bg-[var(--color-bg-secondary)] text-[var(--color-text-primary)]">
      <header className="border-b border-[var(--color-border-hairline)] bg-[var(--color-bg-primary)]">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-6 px-6 py-4">
          <nav className="flex items-center gap-6">
            <span
              className="font-display text-[18px] leading-none font-medium"
              style={{ fontOpticalSizing: "auto" }}
            >
              Kıta <span className="text-[var(--color-text-tertiary)]">— Admin</span>
            </span>
            <NavLink href="/admin/inbox" active={active === "inbox"}>
              Gelen Kutusu
            </NavLink>
            <NavLink href="/admin/ayarlar/bildirimler" active={active === "bildirimler"}>
              Bildirim Alıcıları
            </NavLink>
          </nav>
          <div className="flex items-center gap-3">
            <span className="font-mono text-[12px] tracking-[0.04em] text-[var(--color-text-tertiary)]">
              {user.displayName ?? user.email} · {user.role}
            </span>
            <form action={signOut}>
              <button
                type="submit"
                className="rounded-[var(--radius-sm)] border border-[var(--color-border-default)] bg-[var(--color-bg-elevated)] px-3 py-1 text-[12px] font-medium text-[var(--color-text-secondary)] transition-colors duration-200 ease-out hover:border-[var(--color-border-strong)] hover:text-[var(--color-text-primary)]"
              >
                Çıkış
              </button>
            </form>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-6 py-8">{children}</main>
    </div>
  );
}

function NavLink({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "text-[14px] font-medium transition-colors duration-200 ease-out",
        active
          ? "text-[var(--color-accent-cobalt)]"
          : "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]",
      )}
    >
      {children}
    </Link>
  );
}
