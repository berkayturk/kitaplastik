import Link from "next/link";
import type { Metadata } from "next";
import { Container } from "@/components/layout/Container";

export const metadata: Metadata = {
  title: "404 — Kıta Plastik",
  robots: { index: false, follow: true },
};

export default function NotFound() {
  return (
    <Container>
      <section className="flex min-h-[60dvh] flex-col items-center justify-center gap-6 py-24 text-center">
        <p className="eyebrow text-[var(--color-accent-cobalt)]">ERROR · 404</p>
        <h1 className="text-4xl font-semibold tracking-tight text-[var(--color-text-primary)] md:text-5xl">
          Sayfa bulunamadı <span className="text-[var(--color-text-tertiary)]">·</span> Page not
          found <span className="text-[var(--color-text-tertiary)]">·</span> Страница не найдена{" "}
          <span className="text-[var(--color-text-tertiary)]">·</span> الصفحة غير موجودة
        </h1>
        <Link
          href="/"
          className="mt-4 inline-flex items-center justify-center rounded-sm bg-[var(--color-accent-cobalt)] px-6 py-3 text-sm font-medium text-white transition-opacity hover:opacity-90"
        >
          Anasayfa · Home · Главная · الرئيسية
        </Link>
      </section>
    </Container>
  );
}
