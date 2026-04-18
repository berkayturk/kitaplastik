// app/admin/layout.tsx
import type { ReactNode } from "react";
import { NextIntlClientProvider } from "next-intl";

const TR_LOCALE = "tr";

async function loadAdminMessages() {
  const admin = (await import("@/messages/tr/admin.json")).default;
  const common = (await import("@/messages/tr/common.json")).default;
  return { ...admin, common };
}

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const messages = await loadAdminMessages();
  return (
    <NextIntlClientProvider locale={TR_LOCALE} messages={messages}>
      {children}
    </NextIntlClientProvider>
  );
}
