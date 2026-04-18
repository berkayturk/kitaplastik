"use client";

import { Fragment } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { locales, type Locale } from "@/i18n/routing";
import { cn } from "@/lib/utils";

const LABEL: Record<Locale, string> = {
  tr: "TR",
  en: "EN",
  ru: "RU",
  ar: "AR",
};

export function LocaleSwitcher() {
  const current = useLocale();
  const pathname = usePathname();
  const t = useTranslations("nav");

  return (
    <nav aria-label={t("language")} className="flex items-center font-mono text-[13px]">
      {locales.map((locale, i) => {
        const active = locale === current;
        return (
          <Fragment key={locale}>
            {i > 0 && (
              <span aria-hidden="true" className="mx-1 text-[var(--color-text-tertiary)]">
                ·
              </span>
            )}
            <Link
              href={pathname}
              locale={locale}
              aria-current={active ? "true" : undefined}
              className={cn(
                "tracking-[0.08em] transition-colors duration-200 ease-out",
                active
                  ? "text-[var(--color-text-primary)] underline decoration-[var(--color-accent-cobalt)] decoration-2 underline-offset-[6px]"
                  : "text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)]",
              )}
            >
              {LABEL[locale]}
            </Link>
          </Fragment>
        );
      })}
    </nav>
  );
}
