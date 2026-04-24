import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

interface WhatsAppButtonProps {
  wa: string;
  className?: string;
}

export function WhatsAppButton({ wa, className }: WhatsAppButtonProps) {
  const t = useTranslations("pages.contact.whatsapp");
  const href = `https://wa.me/${wa}?text=${encodeURIComponent(t("prefill"))}`;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={t("fabLabel")}
      className={cn(
        "inline-flex items-center gap-3 rounded-sm bg-[#25D366] px-6 py-3",
        "text-sm font-semibold text-white shadow-sm",
        "transition hover:bg-[#128C7E] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white",
        className,
      )}
    >
      <WhatsAppGlyph className="h-5 w-5" />
      <span>{t("cta")}</span>
    </a>
  );
}

export function WhatsAppGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
      <path
        fill="currentColor"
        d="M16.04 3C9.4 3 4.04 8.36 4.04 14.99c0 2.5.77 4.82 2.08 6.73L4 29l7.5-1.97a12.9 12.9 0 0 0 4.55.82c6.64 0 12.01-5.37 12.01-12.01S22.67 3 16.03 3Zm0 21.77a9.8 9.8 0 0 1-4.97-1.36l-.36-.21-4.45 1.17 1.19-4.34-.23-.37a9.76 9.76 0 0 1-1.52-5.27c0-5.4 4.4-9.8 9.81-9.8 2.62 0 5.08 1.02 6.93 2.88a9.76 9.76 0 0 1 2.87 6.93c0 5.4-4.4 9.8-9.81 9.8Zm5.38-7.36c-.3-.15-1.75-.86-2.02-.96-.27-.1-.47-.15-.66.15-.2.3-.77.96-.94 1.15-.17.2-.35.22-.65.07-.3-.15-1.25-.46-2.38-1.47-.88-.78-1.47-1.75-1.64-2.05-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.07-.15-.66-1.6-.9-2.2-.24-.58-.48-.5-.66-.5h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48s1.06 2.88 1.21 3.08c.15.2 2.1 3.2 5.08 4.49.71.3 1.26.49 1.69.63.71.22 1.36.19 1.87.12.57-.09 1.75-.72 2-1.4.25-.69.25-1.28.18-1.4-.07-.13-.27-.2-.57-.35Z"
      />
    </svg>
  );
}

export function TelegramGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path
        fill="currentColor"
        d="m9.78 18.65.28-4.23 7.68-6.92c.34-.31-.07-.46-.52-.19L7.74 13.3 3.64 12c-.88-.25-.89-.86.2-1.3l15.97-6.16c.73-.33 1.43.18 1.15 1.3l-2.72 12.81c-.19.91-.74 1.13-1.5.71L12.6 16.3l-1.99 1.93c-.23.23-.42.42-.83.42Z"
      />
    </svg>
  );
}
