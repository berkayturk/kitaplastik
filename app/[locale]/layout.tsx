import type { Metadata } from "next";
import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import localFont from "next/font/local";
import { NextIntlClientProvider } from "next-intl";
import { setRequestLocale, getMessages, getTranslations } from "next-intl/server";
import { routing, type Locale } from "@/i18n/routing";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { SiteBackground } from "@/components/three/SiteBackground";
import { WhatsAppFab } from "@/components/contact/WhatsAppFab";
import { getDir } from "@/lib/rtl";
import { cn } from "@/lib/utils";
import "@fontsource-variable/noto-sans-arabic/wght.css";
import "@/app/globals.css";

const inter = localFont({
  src: "../../public/fonts/Inter-Variable.woff2",
  variable: "--font-inter",
  display: "swap",
  weight: "100 900",
});

const jetbrainsMono = localFont({
  src: "../../public/fonts/JetBrainsMono-Variable.woff2",
  variable: "--font-jetbrains-mono",
  display: "swap",
  weight: "100 800",
});

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isValidLocale(locale)) return {};
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
// escape hatch that page.tsx gets from AppPageConfig). We narrow back to Locale via isValidLocale.
interface LocaleLayoutProps {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}

// v3-compatible locale guard (hasLocale is v4-only; Task 1 established this pattern in i18n/request.ts).
function isValidLocale(value: string): value is Locale {
  return (routing.locales as readonly string[]).includes(value);
}

export default async function LocaleLayout({ children, params }: LocaleLayoutProps) {
  const { locale } = await params;
  if (!isValidLocale(locale)) {
    notFound();
  }

  setRequestLocale(locale);
  const messages = await getMessages();
  const dir = getDir(locale);

  return (
    <html lang={locale} dir={dir} className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <body className={cn("text-text-primary antialiased", locale === "ar" && "font-arabic")}>
        <SiteBackground />
        <NextIntlClientProvider locale={locale} messages={messages}>
          <Header />
          <main className="min-h-[calc(100vh-4rem)]">{children}</main>
          <Footer />
          <WhatsAppFab />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
