export async function register() {
  const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;
  const hasDsn = Boolean(dsn && !dsn.toLowerCase().includes("your-"));

  if (process.env.NEXT_RUNTIME === "nodejs") {
    const Sentry = await import("@sentry/nextjs");

    Sentry.init({
      dsn: hasDsn ? dsn : undefined,
      tracesSampleRate: 0.1,
      enabled: process.env.NODE_ENV === "production" && hasDsn,
    });
  }

  if (process.env.NEXT_RUNTIME === "edge") {
    const Sentry = await import("@sentry/nextjs");

    Sentry.init({
      dsn: hasDsn ? dsn : undefined,
      tracesSampleRate: 0.1,
      enabled: process.env.NODE_ENV === "production" && hasDsn,
    });
  }
}
