type LogLevel = 'info' | 'error';

type LogPayload = {
  event: string;
  [key: string]: unknown;
};

function write(level: LogLevel, payload: LogPayload) {
  const enriched = {
    level,
    service: 'worker',
    ...payload,
    timestamp: new Date().toISOString(),
  };

  const serialized = JSON.stringify(enriched);
  if (level === 'error') {
    console.error(serialized);
    return;
  }

  console.log(serialized);
}

export function logInfo(payload: LogPayload) {
  write('info', payload);
}

export function logError(payload: LogPayload) {
  write('error', payload);
}
