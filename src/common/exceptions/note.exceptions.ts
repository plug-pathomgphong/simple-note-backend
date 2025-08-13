import { HttpStatus } from '@nestjs/common';
import { BaseException } from './base.exception';

export class NoteNotFoundException extends BaseException {
  readonly statusCode = HttpStatus.NOT_FOUND;
  readonly error = 'Note Not Found';

  constructor(id: number) {
    super(`Note with id ${id} not found`);
  }
}

export class InvalidPageException extends BaseException {
  readonly statusCode = HttpStatus.BAD_REQUEST;
  readonly error = 'Invalid Page';

  constructor(page: number, totalItems: number) {
    super('Page number exceeds total items', {
      requestedPage: page,
      totalItems,
      maxValidPage: Math.ceil(totalItems / 10) || 1,
    });
  }
}

export class FileUploadException extends BaseException {
  readonly statusCode = HttpStatus.BAD_REQUEST;
  readonly error = 'File Upload Error';

  constructor(message: string, details?: unknown) {
    super(message, details);
  }
}

export class FileSizeExceededException extends FileUploadException {
  constructor(maxSize: number, actualSize: number) {
    super(`File size too large. Maximum allowed size is ${maxSize / (1024 * 1024)}MB`, {
      maxSizeBytes: maxSize,
      actualSizeBytes: actualSize,
      maxSizeMB: maxSize / (1024 * 1024),
      actualSizeMB: Math.round((actualSize / (1024 * 1024)) * 100) / 100,
    });
  }
}

export class InvalidFileTypeException extends FileUploadException {
  constructor(allowedTypes: string[], actualType: string) {
    super(`Invalid file type. Allowed types: ${allowedTypes.join(', ')}`, {
      allowedTypes,
      actualType,
    });
  }
}

export class InvalidFileExtensionException extends FileUploadException {
  constructor(allowedExtensions: string[], actualExtension: string) {
    super(`Invalid file extension. Allowed extensions: ${allowedExtensions.join(', ')}`, {
      allowedExtensions,
      actualExtension,
    });
  }
}
