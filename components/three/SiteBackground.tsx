"use client";

import dynamic from "next/dynamic";
import { HeroFallback } from "@/components/three/HeroFallback";
import { useShouldReduceMotion } from "@/components/three/useReducedMotion";

const SiteBackgroundCanvas = dynamic(
  () => import("@/components/three/SiteBackgroundCanvas").then((m) => m.SiteBackgroundCanvas),
  { ssr: false, loading: () => <SiteBackgroundFallback /> },
);

function SiteBackgroundFallback() {
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10">
      <HeroFallback />
    </div>
  );
}

export function SiteBackground() {
  const reduced = useShouldReduceMotion();
  return reduced ? <SiteBackgroundFallback /> : <SiteBackgroundCanvas reduced={false} />;
}
