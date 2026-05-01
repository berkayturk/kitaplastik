"use client";

import { useLocale, useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { TelegramGlyph } from "./WhatsAppButton";

interface TelegramFabProps {
  handle: string;
}

export function TelegramFab({ handle }: TelegramFabProps) {
  const t = useTranslations("pages.contact.telegram");
  const locale = useLocale();
  const isRtl = locale === "ar";
  const href = `https://t.me/${handle}?text=${encodeURIComponent(t("prefill"))}`;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={t("fabLabel")}
      className={cn(
        "fixed bottom-24 z-40 flex h-14 w-14 items-center justify-center rounded-full",
        "bg-[#229ED9] text-white",
        "shadow-[var(--shadow-float)] ring-1 ring-black/5",
        "transition-colors duration-200 ease-out hover:bg-[#1A85B8]",
        "focus-visible:shadow-[0_0_0_2px_var(--color-bg-primary),0_0_0_4px_#229ED9] focus-visible:outline-none",
        "print:hidden",
        isRtl ? "left-6" : "right-6",
      )}
    >
      <TelegramGlyph className="h-7 w-7" />
    </a>
  );
}
