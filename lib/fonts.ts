// lib/fonts.ts
//
// Variable Google Fonts for the Refined Industrial (Light) design system.
// Exposed as CSS variables consumed by Tailwind's @theme in app/globals.css:
//   --font-display → Fraunces (serif, display headlines, opsz axis)
//   --font-sans    → Hanken Grotesk (grotesque, body + UI)
//   --font-mono    → JetBrains Mono (numerics + technical labels)
//
// Arabic locale falls back to Noto Sans Arabic (imported separately via
// @fontsource-variable/noto-sans-arabic in the locale layout) because
// Fraunces lacks Arabic script.

import { Fraunces, Hanken_Grotesk, JetBrains_Mono } from "next/font/google";

// NOTE — Cyrillic coverage limitation:
//   Google Fonts exposes Fraunces with subsets: latin | latin-ext | vietnamese.
//   Hanken Grotesk: latin | latin-ext | vietnamese | cyrillic-ext.
//   Neither exposes the base "cyrillic" subset via next/font/google types.
//   Russian (ru) locale body text falls back to "cyrillic-ext" in Hanken (covers
//   basic Russian А-Я range in practice); display headlines in RU fall back to
//   the serif system stack (Iowan / Baskerville / Times). Acceptable for MVP —
//   revisit in a later phase with Noto Serif if RU volume justifies the weight.
//   JetBrains Mono has full "cyrillic" subset in types, kept loaded.

export const fraunces = Fraunces({
  subsets: ["latin", "latin-ext"],
  axes: ["opsz"],
  display: "swap",
  variable: "--font-display",
});

export const hankenGrotesk = Hanken_Grotesk({
  subsets: ["latin", "latin-ext", "cyrillic-ext"],
  display: "swap",
  variable: "--font-sans",
});

export const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin", "latin-ext", "cyrillic"],
  display: "swap",
  variable: "--font-mono",
});
