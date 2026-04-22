// sentry.edge.config.ts
// Edge runtime Sentry init (middleware, edge API routes).
import * as Sentry from "@sentry/nextjs";

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    tracesSampleRate: 0,
    beforeSend(event) {
      return process.env.NODE_ENV === "production" ? event : null;
    },
  });
}
