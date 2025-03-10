import { ExecutionContext, CallHandler } from '@nestjs/common';
import { HttpCacheInterceptor } from '../../../../src/infrastructure/cache/interceptors/http-cache.interceptor';
import { of } from 'rxjs';

describe('HttpCacheInterceptor', () => {
  let interceptor: HttpCacheInterceptor;
  let executionContext: ExecutionContext;
  let callHandler: CallHandler;

  beforeEach(() => {
    interceptor = new HttpCacheInterceptor();

    executionContext = {
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue({
          method: 'GET',
          url: '/api/movies',
        }),
      }),
    } as any;

    callHandler = {
      handle: jest.fn().mockReturnValue(of({ data: 'test-response' })),
    } as any;
  });

  it('should be defined', () => {
    expect(interceptor).toBeDefined();
  });

  it('should bypass caching for non-GET requests', (done) => {
    // Mock a POST request
    jest.spyOn(executionContext.switchToHttp(), 'getRequest').mockReturnValue({
      method: 'POST',
      url: '/api/movies',
    });

    interceptor.intercept(executionContext, callHandler).subscribe({
      next: (data) => {
        expect(data).toEqual({ data: 'test-response' });
        expect(callHandler.handle).toHaveBeenCalled();
        done();
      },
      error: (error) => done(error),
    });
  });

  it('should process GET requests', (done) => {
    // Mock a GET request
    jest.spyOn(executionContext.switchToHttp(), 'getRequest').mockReturnValue({
      method: 'GET',
      url: '/api/movies',
    });

    interceptor.intercept(executionContext, callHandler).subscribe({
      next: (data) => {
        expect(data).toEqual({ data: 'test-response' });
        expect(callHandler.handle).toHaveBeenCalled();
        done();
      },
      error: (error) => done(error),
    });
  });
});
