import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';
import { FileValidationOptions, COMMON_FILE_VALIDATION } from '../../notes/dto/file-upload.dto';

@Injectable()
export class FileValidationPipe implements PipeTransform {
  constructor(private readonly options: FileValidationOptions = COMMON_FILE_VALIDATION) {}

  transform(file: Express.Multer.File): Express.Multer.File {
    if (!file) {
      return file; // Allow no file if it's optional
    }

    // Validate file size
    if (this.options.maxFileSize && file.size > this.options.maxFileSize) {
      throw new BadRequestException(
        `File size too large. Maximum allowed size is ${this.options.maxFileSize / (1024 * 1024)}MB`
      );
    }

    // Validate MIME type
    if (this.options.allowedMimeTypes && !this.options.allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        `Invalid file type. Allowed types: ${this.options.allowedMimeTypes.join(', ')}`
      );
    }

    // Validate file extension
    if (this.options.allowedExtensions) {
      const fileExtension = this.getFileExtension(file.originalname);
      if (!this.options.allowedExtensions.includes(fileExtension)) {
        throw new BadRequestException(
          `Invalid file extension. Allowed extensions: ${this.options.allowedExtensions.join(', ')}`
        );
      }
    }

    return file;
  }

  private getFileExtension(filename: string): string {
    return '.' + filename.split('.').pop()?.toLowerCase() || '';
  }
}
