import { notFound } from "next/navigation";

// Catch-all segment: any path under /[locale]/ that doesn't match a known
// page falls here. Calling notFound() renders app/[locale]/not-found.tsx
// with full layout (html/body + NextIntlClientProvider), so the locale-aware
// 404 page renders correctly instead of falling back to the root
// app/not-found.tsx which has no translation context.
export default function CatchAll() {
  notFound();
}
