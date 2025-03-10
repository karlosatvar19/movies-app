import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class HttpCacheInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();

    // Skip caching for specific routes or methods
    const isGetRequest = request.method === 'GET';

    if (!isGetRequest) {
      return next.handle();
    }

    // Continue with the handler
    return next.handle().pipe(
      tap(() => {
        // Additional logic after request is handled
      }),
    );
  }
}
