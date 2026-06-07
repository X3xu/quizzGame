import type { NextConfig } from 'next';
import { withSentryConfig } from '@sentry/nextjs';

const nextConfig: NextConfig = {
  // Silence Sentry telemetry in CI
  env: {
    NEXT_PUBLIC_SENTRY_DSN: process.env.NEXT_PUBLIC_SENTRY_DSN ?? '',
  },
};

export default withSentryConfig(nextConfig, {
  // Sentry organisation/project (fill in after creating a Sentry project)
  org:     process.env.SENTRY_ORG     ?? '',
  project: process.env.SENTRY_PROJECT ?? '',
  // Disable source map upload unless SENTRY_AUTH_TOKEN is set
  authToken: process.env.SENTRY_AUTH_TOKEN,
  silent: !process.env.SENTRY_AUTH_TOKEN,
  widenClientFileUpload: true,
  // Tree-shake Sentry debug logging from production bundles
  webpack: { treeshake: { removeDebugLogging: true } },
});
