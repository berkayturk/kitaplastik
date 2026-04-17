"use client";

import { useLocale } from "next-intl";
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

  return (
    <nav aria-label="Dil / Language" className="flex items-center gap-1 text-sm">
      {locales.map((locale) => {
        const active = locale === current;
        return (
          <Link
            key={locale}
            href={pathname}
            locale={locale}
            aria-current={active ? "true" : undefined}
            className={cn(
              "rounded-sm px-2 py-1 font-mono text-xs tracking-widest uppercase transition-colors",
              active
                ? "bg-bg-elevated text-text-primary"
                : "text-text-secondary hover:text-text-primary",
            )}
          >
            {LABEL[locale]}
          </Link>
        );
      })}
    </nav>
  );
}
