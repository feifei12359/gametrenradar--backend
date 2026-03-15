import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { RESPONSE_MESSAGE_KEY } from './response-message.decorator';

@Injectable()
export class ApiResponseInterceptor implements NestInterceptor {
  private readonly reflector = new Reflector();

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const defaultMessage =
      this.reflector.get<string>(RESPONSE_MESSAGE_KEY, context.getHandler()) ?? 'ok';

    return next.handle().pipe(
      map((data) => {
        if (data && typeof data === 'object' && '__responseMessage' in (data as object)) {
          const { __responseMessage, ...rest } = data as Record<string, unknown>;

          return {
            success: true,
            data: rest,
            message:
              typeof __responseMessage === 'string' && __responseMessage
                ? __responseMessage
                : defaultMessage,
          };
        }

        return {
          success: true,
          data,
          message: defaultMessage,
        };
      }),
    );
  }
}
