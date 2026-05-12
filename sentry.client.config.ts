import * as Sentry from "@sentry/nextjs";

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;
const hasDsn = Boolean(dsn && !dsn.toLowerCase().includes("your-"));

Sentry.init({
  dsn: hasDsn ? dsn : undefined,
  tracesSampleRate: 0.1,
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
  integrations: [
    Sentry.replayIntegration({
      maskAllText: true,
      blockAllMedia: true,
    }),
  ],
  enabled: process.env.NODE_ENV === "production" && hasDsn,
});
