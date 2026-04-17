import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

const base: IconProps = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.75,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "aria-hidden": true,
};

export function MapPinIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M12 21s-7-6.6-7-12a7 7 0 1 1 14 0c0 5.4-7 12-7 12Z" />
      <circle cx="12" cy="9" r="2.5" />
    </svg>
  );
}

export function PhoneIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M4 5c0-.55.45-1 1-1h3.28a1 1 0 0 1 .95.68l1.32 3.96a1 1 0 0 1-.5 1.2l-1.8.9a12 12 0 0 0 5.02 5.01l.9-1.8a1 1 0 0 1 1.2-.5l3.95 1.32a1 1 0 0 1 .68.95V19a1 1 0 0 1-1 1A16 16 0 0 1 4 5Z" />
    </svg>
  );
}

export function PrinterIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M6 9V4h12v5" />
      <rect x="3" y="9" width="18" height="8" rx="1.5" />
      <rect x="7" y="14" width="10" height="6" rx="1" />
      <circle cx="17.5" cy="12" r="0.75" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function EnvelopeIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m4 7 8 6 8-6" />
    </svg>
  );
}

export function ClockIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>
  );
}

export function SmartphoneIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <rect x="7" y="3" width="10" height="18" rx="2" />
      <path d="M11 18h2" />
    </svg>
  );
}
