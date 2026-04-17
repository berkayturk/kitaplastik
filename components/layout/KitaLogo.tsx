interface KitaLogoProps {
  className?: string;
}

export function KitaLogo({ className }: KitaLogoProps) {
  return (
    <svg viewBox="0 0 120 32" className={className} role="img" aria-label="Kıta Plastik">
      <g fill="currentColor">
        <path
          d="M4 4 L26 4 L30 8 L30 28 L8 28 L4 24 Z"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
        />
        <path
          d="M11 10 L11 22 M11 16 L18 10 M11 16 L19 22"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="square"
          fill="none"
        />
      </g>
      <text
        x="38"
        y="22"
        fontFamily="var(--font-inter), system-ui, sans-serif"
        fontSize="18"
        fontWeight="600"
        letterSpacing="-0.02em"
        fill="currentColor"
      >
        kıta
      </text>
      <text
        x="38"
        y="31"
        fontFamily="var(--font-jetbrains-mono), monospace"
        fontSize="7"
        fontWeight="500"
        letterSpacing="0.15em"
        fill="currentColor"
        opacity="0.6"
      >
        PLASTİK · 1989
      </text>
    </svg>
  );
}
