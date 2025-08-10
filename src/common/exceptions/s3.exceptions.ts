import { HttpStatus } from '@nestjs/common';
import { BaseException } from './base.exception';

export class S3ConfigurationException extends BaseException {
  readonly statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
  readonly error = 'S3 Configuration Error';

  constructor(missingConfig: string) {
    super(`S3 configuration error: ${missingConfig}`, {
      missingConfiguration: missingConfig,
    });
  }
}

export class S3UploadException extends BaseException {
  readonly statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
  readonly error = 'S3 Upload Error';

  constructor(originalError: Error, fileName?: string) {
    super('Failed to upload file to S3', {
      fileName,
      originalError: originalError.message,
    });
  }
}

export class S3DeleteException extends BaseException {
  readonly statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
  readonly error = 'S3 Delete Error';

  constructor(originalError: Error, fileName?: string) {
    super('Failed to delete file from S3', {
      fileName,
      originalError: originalError.message,
    });
  }
}
