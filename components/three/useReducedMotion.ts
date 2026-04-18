"use client";

import { useEffect, useState } from "react";

export function useShouldReduceMotion(): boolean {
  // Default false: SSR/CSR initial render matches via the dynamic import's loading fallback
  // (SiteBackgroundCanvas is ssr:false). Capability probe in the effect flips true only
  // when the user prefers reduced motion, saveData is on, hardware is weak, or WebGL is absent.
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const mql = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (mql.matches) {
      setReduced(true);
      return;
    }

    type NavConn = { saveData?: boolean };
    const conn = (navigator as Navigator & { connection?: NavConn }).connection;
    if (conn?.saveData) {
      setReduced(true);
      return;
    }

    if (typeof navigator.hardwareConcurrency === "number" && navigator.hardwareConcurrency < 4) {
      setReduced(true);
      return;
    }

    const canvas = document.createElement("canvas");
    const ctx =
      canvas.getContext("webgl2") ||
      canvas.getContext("webgl") ||
      canvas.getContext("experimental-webgl");
    if (!ctx) {
      setReduced(true);
      return;
    }

    setReduced(false);

    const listener = (event: MediaQueryListEvent) => setReduced(event.matches);
    mql.addEventListener("change", listener);
    return () => mql.removeEventListener("change", listener);
  }, []);

  return reduced;
}
