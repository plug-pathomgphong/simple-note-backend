import { TimeoutInterceptor } from './timeout.interceptor';
import { RequestTimeoutException } from '@nestjs/common';
import { TimeoutError, of, throwError as throwRxError } from 'rxjs';
import { ExecutionContext, CallHandler } from '@nestjs/common';

describe('TimeoutInterceptor', () => {
  let interceptor: TimeoutInterceptor;
  let mockExecutionContext: ExecutionContext;
  let mockCallHandler: CallHandler;

  beforeEach(async () => {
    interceptor = new TimeoutInterceptor(10); // 10ms for faster test

    mockExecutionContext = {} as ExecutionContext;
    mockCallHandler = {
      handle: jest.fn(),
    } as unknown as CallHandler;
  });

  it('should pass through if no timeout occurs', (done) => {
    mockCallHandler.handle = jest.fn(() => of('ok'));

    interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe({
      next: (value) => {
        expect(value).toBe('ok');
        done();
      },
    });
  });

  it('should throw RequestTimeoutException on TimeoutError', (done) => {
    mockCallHandler.handle = jest.fn(() =>
      throwRxError(() => new TimeoutError()),
    );

    interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe({
      error: (err) => {
        expect(err).toBeInstanceOf(RequestTimeoutException);
        done();
      },
    });
  });

  it('should rethrow non-timeout errors', (done) => {
    const customError = new Error('Other error');
    mockCallHandler.handle = jest.fn(() => throwRxError(() => customError));

    interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe({
      error: (err) => {
        expect(err).toBe(customError);
        done();
      },
    });
  });
});
