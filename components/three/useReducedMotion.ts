"use client";

import { useEffect, useState } from "react";

/**
 * Returns `true` when ambient motion should be suppressed.
 *
 * Criteria (any match → reduced=true):
 *   - prefers-reduced-motion: reduce
 *   - navigator.connection.saveData
 *   - navigator.hardwareConcurrency < 4
 *   - WebGL2 context not obtainable
 *
 * Initial value is `false` so the animated path is selected during the
 * first client render; the effect flips to `true` only for explicit
 * accessibility / capability signals. SSR is safe because the caller
 * uses `dynamic(..., { ssr: false })` — nothing renders until after
 * hydration.
 */
export function useShouldReduceMotion(): boolean {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const mql = window.matchMedia("(prefers-reduced-motion: reduce)");
    const evaluate = () => {
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
      const ctx = canvas.getContext("webgl2") || canvas.getContext("webgl");
      if (!ctx) {
        setReduced(true);
        return;
      }

      setReduced(false);
    };

    evaluate();
    const listener = () => evaluate();
    mql.addEventListener("change", listener);
    return () => mql.removeEventListener("change", listener);
  }, []);

  return reduced;
}
