import { randomUUID } from 'node:crypto';
import type { NextFunction, Response } from 'express';
import helmet from 'helmet';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import type { RequestWithAuthUser } from './common/types/authenticated-user';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const webOrigin = process.env.WEB_APP_ORIGIN ?? 'http://localhost:5173';

  app.set('trust proxy', 1);
  app.use(helmet());
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

  await app.listen(process.env.PORT ?? 3000);
}
void bootstrap();
