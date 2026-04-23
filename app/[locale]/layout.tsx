import type { Metadata } from "next";
import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { AtmosphereScene } from "@/components/three/AtmosphereScene";
import { WhatsAppFab } from "@/components/contact/WhatsAppFab";
import { getDir } from "@/lib/rtl";
import { cn } from "@/lib/utils";
import { fraunces, hankenGrotesk, jetbrainsMono } from "@/lib/fonts";
import { PlausibleScript } from "@/components/PlausibleScript";
import "@fontsource-variable/noto-sans-arabic/wght.css";
import "@/app/globals.css";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) return {};
  const tBrand = await getTranslations({ locale, namespace: "common.brand" });
  const tHero = await getTranslations({ locale, namespace: "home.hero" });
  return {
    title: `${tBrand("name")} · ${tBrand("tagline")}`,
    description: tHero("subtitle"),
  };
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

// Next.js 15 LayoutConfig validator constrains `params.locale` to `string` (no `& any` bivariance
// escape hatch that page.tsx gets from AppPageConfig). We narrow back to Locale via hasLocale.
interface LocaleLayoutProps {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}

export default async function LocaleLayout({ children, params }: LocaleLayoutProps) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  setRequestLocale(locale);
  const dir = getDir(locale);

  return (
    <html
      lang={locale}
      dir={dir}
      className={`${fraunces.variable} ${hankenGrotesk.variable} ${jetbrainsMono.variable}`}
    >
      <head>
        <PlausibleScript />
      </head>
      <body className={cn("text-text-primary antialiased", locale === "ar" && "font-arabic")}>
        <AtmosphereScene />
        <NextIntlClientProvider locale={locale}>
          <Header />
          <main className="min-h-[calc(100vh-4rem)]">{children}</main>
          <Footer />
          <WhatsAppFab />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
