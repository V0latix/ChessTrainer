import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { HttpException } from '@nestjs/common/exceptions/http.exception';
import { Observable, catchError, throwError } from 'rxjs';
import type { RequestWithAuthUser } from '../common/types/authenticated-user';
import { captureApiException } from './sentry';

@Injectable()
export class ExceptionCaptureInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const http = context.switchToHttp();
    const request = http.getRequest<RequestWithAuthUser>();

    return next.handle().pipe(
      catchError((error: unknown) => {
        const traceId = request?.traceId ?? 'missing-trace-id';
        const method = request?.method ?? 'UNKNOWN';
        const path = request?.originalUrl ?? request?.url ?? 'unknown';
        const statusCode =
          error instanceof HttpException ? error.getStatus() : undefined;

        const logPayload = {
          level: 'error',
          event: 'api_exception',
          trace_id: traceId,
          method,
          path,
          status_code: statusCode,
          error_name: error instanceof Error ? error.name : 'UnknownError',
          error_message:
            error instanceof Error ? error.message : 'Unknown exception',
          timestamp: new Date().toISOString(),
        };

        console.error(JSON.stringify(logPayload));
        captureApiException(error, {
          trace_id: traceId,
          method,
          path,
          status_code: statusCode,
        });

        return throwError(() => error);
      }),
    );
  }
}
