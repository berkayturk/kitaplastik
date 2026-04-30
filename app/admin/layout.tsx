// app/admin/layout.tsx
import type { ReactNode } from "react";
import { NextIntlClientProvider } from "next-intl";
import { fraunces, hankenGrotesk, jetbrainsMono } from "@/lib/fonts";
import "@fontsource/ibm-plex-serif/400.css";
import "@fontsource/ibm-plex-serif/500.css";
import "@fontsource/ibm-plex-sans/300.css";
import "@fontsource/ibm-plex-sans/400.css";
import "@fontsource/ibm-plex-sans/500.css";
import "@fontsource/ibm-plex-mono/400.css";
import "@fontsource/ibm-plex-mono/500.css";
import "@fontsource-variable/noto-sans-arabic/wght.css";
import "@/app/globals.css";

const TR_LOCALE = "tr";

async function loadAdminMessages() {
  const admin = (await import("@/messages/tr/admin.json")).default;
  const common = (await import("@/messages/tr/common.json")).default;
  return { ...admin, common };
}

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const messages = await loadAdminMessages();
  return (
    <html
      lang={TR_LOCALE}
      className={`${fraunces.variable} ${hankenGrotesk.variable} ${jetbrainsMono.variable}`}
    >
      <body className="bg-[var(--color-bg-secondary)] font-sans text-[var(--color-text-primary)] antialiased">
        <NextIntlClientProvider locale={TR_LOCALE} messages={messages}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
