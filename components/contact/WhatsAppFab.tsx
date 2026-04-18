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
        "bg-[#25D366] text-white",
        "shadow-[var(--shadow-float)] ring-1 ring-black/5",
        "transition-colors duration-200 ease-out hover:bg-[#128C7E]",
        "focus-visible:shadow-[0_0_0_2px_var(--color-bg-primary),0_0_0_4px_#25D366] focus-visible:outline-none",
        "print:hidden",
        isRtl ? "left-6" : "right-6",
      )}
    >
      <WhatsAppGlyph className="h-7 w-7" />
    </a>
  );
}
