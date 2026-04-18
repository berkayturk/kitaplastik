import type { ReactNode } from "react";
import { fraunces, hankenGrotesk, jetbrainsMono } from "@/lib/fonts";
import "@fontsource-variable/noto-sans-arabic/wght.css";
import "@/app/globals.css";

// Internal render-verification route. Not in sitemap, not translated.
// Delete before the redesign branch merges to main.

export const metadata = {
  title: "Design debug — Kıta Plastik",
  robots: { index: false, follow: false },
};

export default function DesignDebugLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="tr"
      className={`${fraunces.variable} ${hankenGrotesk.variable} ${jetbrainsMono.variable}`}
    >
      <body className="bg-bg-primary text-text-primary font-sans antialiased">{children}</body>
    </html>
  );
}
