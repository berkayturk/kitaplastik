"use client";

import { useLocale, useTranslations } from "next-intl";
import { COMPANY } from "@/lib/company";
import { cn } from "@/lib/utils";
import { WhatsAppGlyph } from "./WhatsAppButton";

export function WhatsAppFab() {
  const t = useTranslations("pages.contact.whatsapp");
  const locale = useLocale();
  const isRtl = locale === "ar";
  const href = `https://wa.me/${COMPANY.whatsapp.wa}?text=${encodeURIComponent(t("prefill"))}`;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={t("fabLabel")}
      className={cn(
        "fixed bottom-6 z-40 flex h-14 w-14 items-center justify-center rounded-full",
        "bg-[#25D366] text-white shadow-lg ring-1 ring-black/10",
        "transition hover:scale-105 hover:bg-[#128C7E]",
        "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white",
        "print:hidden",
        isRtl ? "left-6" : "right-6",
      )}
    >
      <WhatsAppGlyph className="h-7 w-7" />
    </a>
  );
}
