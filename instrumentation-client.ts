// instrumentation-client.ts
// Browser-side Sentry init. DSN read at runtime (env injected by Coolify).
// Filename required by Turbopack (v10 convention); webpack build also picks it up.
// tracesSampleRate 0 = errors only (no performance). See spec §2 karar A.
import * as Sentry from "@sentry/nextjs";

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    tracesSampleRate: 0,
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: 0,
    beforeSend(event) {
      return process.env.NODE_ENV === "production" ? event : null;
    },
  });
}
