import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
    include: ["tests/unit/**/*.{test,spec}.{ts,tsx}"],
    exclude: ["tests/e2e/**"],
    css: true,
    // next-intl v4 is ESM-only and imports `next/navigation` without an
    // extension to avoid a Next.js deopt (vercel/next.js#77200). Vitest's
    // ESM resolver enforces the extension, so we inline next-intl so Vite
    // can transform those imports. See next-intl v4 testing docs.
    server: {
      deps: {
        inline: ["next-intl"],
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./"),
      // server-only throws in client contexts (jsdom); stub it so pure
      // utilities living in RSC-marked modules can still be unit-tested.
      "server-only": path.resolve(__dirname, "./tests/stubs/server-only.ts"),
    },
  },
});
