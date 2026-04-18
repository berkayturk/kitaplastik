// components/admin/Shell.tsx
import type { ReactNode } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { AdminUser } from "@/lib/admin/auth";

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
    <div className="bg-bg-primary text-text-primary min-h-screen">
      <header className="flex items-center justify-between border-b border-[var(--color-border-subtle-dark)] px-6 py-3">
        <nav className="flex items-center gap-4 text-sm">
          <span className="font-semibold">Kıta Admin</span>
          <Link
            href="/admin/inbox"
            className={
              active === "inbox"
                ? "text-[var(--color-accent-red)]"
                : "text-text-secondary hover:text-text-primary"
            }
          >
            Gelen Kutusu
          </Link>
          <Link
            href="/admin/ayarlar/bildirimler"
            className={
              active === "bildirimler"
                ? "text-[var(--color-accent-red)]"
                : "text-text-secondary hover:text-text-primary"
            }
          >
            Bildirim Alıcıları
          </Link>
        </nav>
        <div className="flex items-center gap-3 text-xs">
          <span className="text-text-secondary">
            {user.displayName ?? user.email} · {user.role}
          </span>
          <form action={signOut}>
            <button
              type="submit"
              className="rounded-sm border border-[var(--color-border-subtle-dark)] px-2 py-1"
            >
              Çıkış
            </button>
          </form>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-6 py-6">{children}</main>
    </div>
  );
}
