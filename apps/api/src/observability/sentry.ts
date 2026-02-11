import * as Sentry from '@sentry/node';

let isSentryEnabled = false;

export function initApiSentry() {
  const dsn = process.env.SENTRY_DSN?.trim();
  const environment =
    process.env.SENTRY_ENVIRONMENT?.trim() || process.env.NODE_ENV;
  const release = process.env.SENTRY_RELEASE?.trim();

  if (!dsn || process.env.NODE_ENV === 'test') {
    isSentryEnabled = false;
    return false;
  }

  Sentry.init({
    dsn,
    environment,
    release: release || undefined,
    tracesSampleRate: 0,
  });

  isSentryEnabled = true;
  return true;
}

export function captureApiException(
  error: unknown,
  context: {
    trace_id: string;
    method: string;
    path: string;
    status_code?: number;
  },
) {
  if (!isSentryEnabled) {
    return;
  }

  Sentry.withScope((scope) => {
    scope.setTag('service', 'api');
    scope.setTag('trace_id', context.trace_id);
    scope.setContext('http', {
      method: context.method,
      path: context.path,
      status_code: context.status_code,
    });
    Sentry.captureException(
      error instanceof Error ? error : new Error(String(error)),
    );
  });
}
