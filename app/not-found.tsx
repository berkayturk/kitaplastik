import Link from "next/link";
import { Container } from "@/components/layout/Container";

export default function NotFound() {
  return (
    <Container>
      <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
        <div className="text-accent-blue font-mono text-xs tracking-widest uppercase">
          Error · 404
        </div>
        <h1 className="mt-4 text-5xl font-bold tracking-tight">Sayfa bulunamadı</h1>
        <p className="text-text-secondary mt-4 max-w-md">
          Aradığınız sayfa taşınmış, silinmiş ya da hiç var olmamış olabilir.
        </p>
        <Link
          href="/"
          className="mt-8 rounded-sm bg-[var(--color-accent-red)] px-6 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
        >
          Anasayfaya dön
        </Link>
      </div>
    </Container>
  );
}
