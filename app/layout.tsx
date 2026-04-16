import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Kıta Plastik · 1989'dan beri Bursa",
  description:
    "Plastik enjeksiyonun mühendislik partneri. Cam yıkama, kapak ve tekstil sektörlerine üretim.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr">
      <body className="bg-bg-primary text-text-primary antialiased">{children}</body>
    </html>
  );
}
