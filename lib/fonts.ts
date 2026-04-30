// lib/fonts.ts
//
// Self-hosted font classes for the Refined Industrial (Light) design system.
// Exposed as CSS variables consumed by Tailwind's @theme in app/globals.css:
//   --font-display → IBM Plex Serif (display headlines)
//   --font-sans    → IBM Plex Sans (body + UI)
//   --font-mono    → IBM Plex Mono (numerics + technical labels)
//
// Arabic locale falls back to Noto Sans Arabic (imported separately via
// @fontsource-variable/noto-sans-arabic in the locale layout).

export const fraunces = { variable: "font-display-ibm-plex-serif" };
export const hankenGrotesk = { variable: "font-sans-ibm-plex-sans" };
export const jetbrainsMono = { variable: "font-mono-ibm-plex-mono" };
