interface LegalDisclaimerProps {
  publishedLabel: string;
  publishedDate: string;
  updatedLabel: string;
  lastUpdated: string;
  text: string;
}

export function LegalDisclaimer({
  publishedLabel,
  publishedDate,
  updatedLabel,
  lastUpdated,
  text,
}: LegalDisclaimerProps) {
  return (
    <small
      data-testid="legal-disclaimer"
      className="text-text-tertiary mt-12 block border-t border-[var(--color-border-hairline)] pt-6 text-[12px] leading-[1.6] italic"
    >
      {publishedLabel}: {publishedDate} · {updatedLabel}: {lastUpdated} · {text}
    </small>
  );
}
