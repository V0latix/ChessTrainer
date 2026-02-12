import { randomUUID } from 'node:crypto';
import type { NextFunction, Response } from 'express';
import helmet from 'helmet';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import type { RequestWithAuthUser } from './common/types/authenticated-user';
import { AppModule } from './app.module';
import { ExceptionCaptureInterceptor } from './observability/exception-capture.interceptor';
import { initApiSentry } from './observability/sentry';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const webOrigin = process.env.WEB_APP_ORIGIN ?? 'http://localhost:5173';
  const sentryEnabled = initApiSentry();

  app.set('trust proxy', 1);
  app.use(helmet());
  app.useGlobalInterceptors(new ExceptionCaptureInterceptor());
  app.enableCors({
    origin: [webOrigin],
    credentials: true,
  });

  app.use(
    (request: RequestWithAuthUser, response: Response, next: NextFunction) => {
      const incomingTraceId = request.headers['x-trace-id'];
      const traceId =
        typeof incomingTraceId === 'string' && incomingTraceId.length > 0
          ? incomingTraceId
          : randomUUID();

      request.traceId = traceId;
      response.setHeader('x-trace-id', traceId);
      next();
    },
  );

  app.use(
    (request: RequestWithAuthUser, response: Response, next: NextFunction) => {
      const startedAt = Date.now();

      response.on('finish', () => {
        const durationMs = Date.now() - startedAt;
        const logPayload = {
          level: response.statusCode >= 500 ? 'error' : 'info',
          event: 'api_request_completed',
          trace_id: request.traceId ?? 'missing-trace-id',
          method: request.method,
          path: request.originalUrl ?? request.url,
          status_code: response.statusCode,
          duration_ms: durationMs,
          user_id: request.authUser?.local_user_id ?? null,
          timestamp: new Date().toISOString(),
        };

        const serialized = JSON.stringify(logPayload);
        if (response.statusCode >= 500) {
          console.error(serialized);
        } else {
          console.log(serialized);
        }
      });

      next();
    },
  );

  if (process.env.NODE_ENV === 'production') {
    app.use(
      (
        request: RequestWithAuthUser,
        response: Response,
        next: NextFunction,
      ) => {
        const forwardedProto = request.headers['x-forwarded-proto']
          ?.split(',')[0]
          ?.trim();
        if (request.secure || forwardedProto === 'https') {
          next();
          return;
        }

        response.status(426).json({
          error: {
            code: 'HTTPS_REQUIRED',
            message: 'HTTPS is required for all external traffic.',
          },
          meta: {
            trace_id: request.traceId ?? 'missing-trace-id',
          },
        });
      },
    );
  }

  const port = Number(process.env.PORT ?? process.env.API_PORT ?? 3000);
  await app.listen(port, '0.0.0.0');
  console.log(
    JSON.stringify({
      level: 'info',
      event: 'api_bootstrap',
      port,
      sentry_enabled: sentryEnabled,
      timestamp: new Date().toISOString(),
    }),
  );
}
void bootstrap();
