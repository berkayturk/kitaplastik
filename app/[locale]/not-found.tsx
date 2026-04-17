import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

export default function NotFound() {
  const t = useTranslations("common.notFound");

  return (
    <section className="container mx-auto flex min-h-[60dvh] flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="text-4xl font-semibold">{t("title")}</h1>
      <p className="text-text-secondary">{t("description")}</p>
      <Link href="/" className="underline">
        {t("home")}
      </Link>
    </section>
  );
}
