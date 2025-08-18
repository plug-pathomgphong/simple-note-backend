import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { BaseException, ErrorResponse } from '../exceptions/base.exception';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let errorResponse: ErrorResponse;

    if (exception instanceof BaseException) {
      // Handle our custom exceptions
      errorResponse = exception.toErrorResponse(request.url);
      this.logger.warn(
        `Custom Exception: ${exception.constructor.name} - ${exception.message}`,
        exception.stack,
      );
    } else if (exception instanceof HttpException) {
      // Handle NestJS HTTP exceptions
      const status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      errorResponse = {
        statusCode: status,
        message:
          typeof exceptionResponse === 'string'
            ? exceptionResponse
            : (exceptionResponse as any).message || exception.message,
        error: exception.name,
        timestamp: new Date().toISOString(),
        path: request.url,
      };

      this.logger.warn(
        `HTTP Exception: ${exception.constructor.name} - ${exception.message}`,
        exception.stack,
      );
    } else if (exception instanceof Error) {
      // Handle generic errors
      errorResponse = {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: exception.message || 'Internal server error',
        error: 'Internal Server Error',
        timestamp: new Date().toISOString(),
        path: request.url,
      };

      this.logger.error(
        `Unhandled Exception: ${exception.constructor.name} - ${exception.message}`,
        exception.stack,
      );
    } else {
      // Handle unknown exceptions
      errorResponse = {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'An unexpected error occurred',
        error: 'Internal Server Error',
        timestamp: new Date().toISOString(),
        path: request.url,
      };

      this.logger.error('Unknown Exception:', exception);
    }

    response.status(errorResponse.statusCode).json(errorResponse);
  }
}
