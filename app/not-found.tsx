import Link from "next/link";
import { Container } from "@/components/layout/Container";

export default function NotFound() {
  return (
    <Container>
      <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
        <div className="eyebrow text-accent-blue">Error · 404</div>
        <h1 className="mt-4 text-5xl font-bold tracking-tight">
          Sayfa bulunamadı <span className="opacity-50">·</span> Page not found
        </h1>
        <p className="text-text-secondary mt-4 max-w-md">
          Aradığınız sayfa taşınmış, silinmiş ya da hiç var olmamış olabilir. / The page you are
          looking for may have been moved, deleted or never existed.
        </p>
        <Link
          href="/"
          className="mt-8 rounded-sm bg-[var(--color-accent-red)] px-6 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
        >
          Anasayfaya dön / Back to home
        </Link>
      </div>
    </Container>
  );
}
