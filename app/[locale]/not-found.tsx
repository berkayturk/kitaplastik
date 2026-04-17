import Link from "next/link";

export default function NotFound() {
  return (
    <section className="container mx-auto flex min-h-[60dvh] flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="text-4xl font-semibold">Sayfa bulunamadı</h1>
      <p className="text-muted-foreground">Aradığınız sayfa mevcut değil veya taşınmış olabilir.</p>
      <Link href="/" className="underline">
        Anasayfaya dön
      </Link>
      {/* TODO(Task 8): replace with useTranslations("common.notFound") once messages are populated */}
    </section>
  );
}
