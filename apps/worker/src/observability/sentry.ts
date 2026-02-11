import * as Sentry from '@sentry/node';

let isSentryEnabled = false;

export function initWorkerSentry() {
  const dsn =
    process.env.WORKER_SENTRY_DSN?.trim() || process.env.SENTRY_DSN?.trim();
  const environment = process.env.SENTRY_ENVIRONMENT?.trim() || process.env.NODE_ENV;
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

export function captureWorkerException(
  error: unknown,
  context: {
    event: string;
    analysis_job_id?: string;
  },
) {
  if (!isSentryEnabled) {
    return;
  }

  Sentry.withScope((scope) => {
    scope.setTag('service', 'worker');
    scope.setTag('event', context.event);
    if (context.analysis_job_id) {
      scope.setTag('analysis_job_id', context.analysis_job_id);
    }

    Sentry.captureException(
      error instanceof Error ? error : new Error(String(error)),
    );
  });
}
