interface LegalDisclaimerProps {
  publishedDate: string;
  lastUpdated: string;
  text: string;
}

export function LegalDisclaimer({ publishedDate, lastUpdated, text }: LegalDisclaimerProps) {
  return (
    <small
      data-testid="legal-disclaimer"
      className="text-text-tertiary mt-12 block border-t border-[var(--color-border-hairline)] pt-6 text-[12px] leading-[1.6] italic"
    >
      Yayın tarihi: {publishedDate} · Son güncelleme: {lastUpdated} · {text}
    </small>
  );
}
