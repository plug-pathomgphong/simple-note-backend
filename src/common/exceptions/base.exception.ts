import { HttpStatus } from '@nestjs/common';

export interface ErrorResponse {
  statusCode: number;
  message: string;
  error: string;
  timestamp: string;
  path?: string;
  details?: unknown;
}

export abstract class BaseException extends Error {
  abstract readonly statusCode: HttpStatus;
  abstract readonly error: string;
  public readonly details?: unknown;

  constructor(message: string, details?: unknown) {
    super(message);
    this.name = this.constructor.name;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }

  public toErrorResponse(path?: string): ErrorResponse {
    const response: ErrorResponse = {
      statusCode: this.statusCode,
      message: this.message,
      error: this.error,
      timestamp: new Date().toISOString(),
      path,
    };

    if (this.details) {
      response.details = this.details;
    }

    return response;
  }
}
