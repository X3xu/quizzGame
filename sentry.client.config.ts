import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  // Only capture errors in production
  enabled: process.env.NODE_ENV === 'production',
  tracesSampleRate: 0.1,
  // Capture replay for 10% of sessions, 100% of sessions with errors
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
});
