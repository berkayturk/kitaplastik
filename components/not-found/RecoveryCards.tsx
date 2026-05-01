import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

type CardSlug = "products" | "catalog" | "contact";

type RouteHref = "/products" | "/request-quote" | "/contact";

const CARD_HREFS: Record<CardSlug, RouteHref> = {
  products: "/products",
  catalog: "/request-quote",
  contact: "/contact",
};

const ORDER: CardSlug[] = ["products", "catalog", "contact"];

export function RecoveryCards() {
  const t = useTranslations("common.notFound");

  return (
    <nav aria-labelledby="nf-recovery-title" className="mt-16">
      <p id="nf-recovery-title" className="eyebrow">
        {t("recoveryTitle")}
      </p>
      <ul className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {ORDER.map((slug) => (
          <li key={slug}>
            <Link
              href={CARD_HREFS[slug]}
              className="group focus-visible:ring-accent-cobalt/40 block h-full rounded-sm border border-[var(--color-border-hairline)] bg-[var(--color-bg-elevated)] p-5 transition-colors hover:border-[var(--color-accent-cobalt)] hover:bg-[var(--color-accent-cobalt-tint)] focus-visible:ring-2 focus-visible:outline-none md:p-6"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-base font-medium text-[var(--color-text-primary)]">
                    {t(`cards.${slug}.title` as never)}
                  </div>
                  <p className="text-text-secondary mt-1 text-sm">
                    {t(`cards.${slug}.desc` as never)}
                  </p>
                </div>
                <span
                  aria-hidden="true"
                  className="text-[var(--color-accent-cobalt)] transition-transform group-hover:translate-x-1 rtl:group-hover:-translate-x-1"
                >
                  →
                </span>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
