import { BaseException } from './base.exception';
import { HttpStatus } from '@nestjs/common';

class MockException extends BaseException {
  readonly statusCode = HttpStatus.BAD_REQUEST;
  readonly error = 'MockError';
}

describe('BaseException', () => {
  it('should set name, message, and details correctly', () => {
    const ex = new MockException('Test message', { foo: 'bar' });
    expect(ex.name).toBe('MockException');
    expect(ex.message).toBe('Test message');
    expect(ex.details).toEqual({ foo: 'bar' });
    expect(ex.statusCode).toBe(HttpStatus.BAD_REQUEST);
    expect(ex.error).toBe('MockError');
  });

  it('should create ErrorResponse without details', () => {
    const ex = new MockException('No details');
    const res = ex.toErrorResponse('/test-path');
    expect(res).toEqual({
      statusCode: HttpStatus.BAD_REQUEST,
      message: 'No details',
      error: 'MockError',
      timestamp: expect.any(String),
      path: '/test-path',
    });
    expect(res.details).toBeUndefined();
  });

  it('should create ErrorResponse with details', () => {
    const ex = new MockException('With details', { extra: true });
    const res = ex.toErrorResponse();
    expect(res.details).toEqual({ extra: true });
  });
});