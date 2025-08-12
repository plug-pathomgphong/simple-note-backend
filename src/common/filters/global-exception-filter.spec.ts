import { ArgumentsHost, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { GlobalExceptionFilter } from './global-exception.filter';
import { BaseException, ErrorResponse } from '../exceptions/base.exception';

class MockBaseException extends BaseException {
  readonly statusCode = HttpStatus.BAD_REQUEST;
  readonly error = 'Bad Request';

  constructor(public readonly message: string) {
    super(message);
  }

  toErrorResponse(path: string): ErrorResponse {
    return {
      statusCode: this.statusCode,
      message: this.message,
      error: this.error,
      timestamp: new Date().toISOString(),
      path,
    };
  }
}

describe('GlobalExceptionFilter', () => {
  let filter: GlobalExceptionFilter;
  let mockResponse: any;
  let mockHost: ArgumentsHost;

  beforeEach(() => {
    filter = new GlobalExceptionFilter();
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    mockHost = {
      switchToHttp: () => ({
        getResponse: () => mockResponse,
        getRequest: () => ({ url: '/test-url' }),
      }),
    } as unknown as ArgumentsHost;
    jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => {});
    jest.spyOn(Logger.prototype, 'error').mockImplementation(() => {});
  });

  it('should handle BaseException', () => {
    const exception = new MockBaseException('Custom error');
    filter.catch(exception, mockHost);

    expect(mockResponse.status).toHaveBeenCalledWith(400);
    expect(mockResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 400,
        message: 'Custom error',
        error: 'Bad Request',
        path: '/test-url',
      }),
    );
  });

  it('should handle HttpException', () => {
    const exception = new HttpException('Http error', HttpStatus.NOT_FOUND);
    filter.catch(exception, mockHost);

    expect(mockResponse.status).toHaveBeenCalledWith(404);
    expect(mockResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 404,
        message: 'Http error',
        error: 'HttpException',
        path: '/test-url',
      }),
    );
  });

  it('should handle generic Error', () => {
    const exception = new Error('Something went wrong');
    filter.catch(exception, mockHost);

    expect(mockResponse.status).toHaveBeenCalledWith(500);
    expect(mockResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 500,
        message: 'Something went wrong',
        error: 'Internal Server Error',
      }),
    );
  });

  it('should handle unknown error', () => {
    filter.catch({ unexpected: true }, mockHost);

    expect(mockResponse.status).toHaveBeenCalledWith(500);
    expect(mockResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 500,
        message: 'An unexpected error occurred',
        error: 'Internal Server Error',
      }),
    );
  });
});