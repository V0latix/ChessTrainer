import * as Sentry from '@sentry/react';
import { env } from '../config/env';

let isSentryEnabled = false;

export function initWebObservability() {
  if (!env.sentryDsn || import.meta.env.MODE === 'test') {
    isSentryEnabled = false;
    logWebEvent('web_bootstrap', { sentry_enabled: false });
    return false;
  }

  Sentry.init({
    dsn: env.sentryDsn,
    environment: env.sentryEnvironment,
    release: env.sentryRelease,
    tracesSampleRate: 0,
  });

  isSentryEnabled = true;
  logWebEvent('web_bootstrap', { sentry_enabled: true });

  window.addEventListener('error', (event) => {
    captureWebException(event.error ?? new Error(event.message), {
      event: 'window_error',
    });
  });
  window.addEventListener('unhandledrejection', (event) => {
    captureWebException(
      event.reason instanceof Error ? event.reason : new Error(String(event.reason)),
      { event: 'window_unhandled_rejection' },
    );
  });

  return true;
}

export function captureWebException(
  error: unknown,
  context: {
    event: string;
    route?: string;
  },
) {
  logWebEvent(context.event, {
    route: context.route ?? null,
    error_name: error instanceof Error ? error.name : 'UnknownError',
    error_message: error instanceof Error ? error.message : String(error),
  });

  if (!isSentryEnabled) {
    return;
  }

  Sentry.withScope((scope) => {
    scope.setTag('service', 'web');
    scope.setTag('event', context.event);
    if (context.route) {
      scope.setTag('route', context.route);
    }

    Sentry.captureException(
      error instanceof Error ? error : new Error(String(error)),
    );
  });
}

function logWebEvent(event: string, data: Record<string, unknown>) {
  const payload = {
    level: 'info',
    service: 'web',
    event,
    ...data,
    timestamp: new Date().toISOString(),
  };

  console.log(JSON.stringify(payload));
}
