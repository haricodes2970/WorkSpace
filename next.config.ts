import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const hasValue = (value: string | undefined) =>
  Boolean(value && !value.toLowerCase().includes("your-"));

const hasSentryReleaseConfig =
  hasValue(process.env.SENTRY_ORG) &&
  hasValue(process.env.SENTRY_PROJECT) &&
  hasValue(process.env.SENTRY_AUTH_TOKEN);

const nextConfig: NextConfig = {
  typedRoutes: true,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
      },
    ],
  },
  headers: async () => [
    {
      source: "/(.*)",
      headers: [
        { key: "X-Frame-Options", value: "DENY" },
        { key: "X-Content-Type-Options", value: "nosniff" },
        { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        {
          key: "Permissions-Policy",
          value: "camera=(), microphone=(), geolocation=()",
        },
        {
          key: "Content-Security-Policy",
          value: [
            "default-src 'self'",
            "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://*.vercel-scripts.com",
            "style-src 'self' 'unsafe-inline'",
            "img-src 'self' blob: data: https://*.supabase.co",
            "font-src 'self'",
            "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://sentry.io",
          ].join("; "),
        },
      ],
    },
  ],
};

export default withSentryConfig(nextConfig, {
  silent: true,
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,
  widenClientFileUpload: true,
  hideSourceMaps: true,
  disableLogger: true,
  automaticVercelMonitors: hasSentryReleaseConfig,
  sourcemaps: {
    disable: !hasSentryReleaseConfig,
    deleteSourcemapsAfterUpload: true,
  },
  release: {
    create: hasSentryReleaseConfig,
    finalize: hasSentryReleaseConfig,
  },
});
