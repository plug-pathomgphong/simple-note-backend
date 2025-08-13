import { PipeTransform, Injectable } from '@nestjs/common';
import { FileValidationOptions, COMMON_FILE_VALIDATION } from '../../notes/dto/file-upload.dto';
import { FileSizeExceededException, InvalidFileTypeException, InvalidFileExtensionException } from '../exceptions';

@Injectable()
export class FileValidationPipe implements PipeTransform {
  constructor(private readonly options: FileValidationOptions = COMMON_FILE_VALIDATION) {}

  transform(file: Express.Multer.File): Express.Multer.File {
    if (!file) {
      return file; // Allow no file if it's optional
    }

    // Validate file size
    if (this.options.maxFileSize && file.size > this.options.maxFileSize) {
      throw new FileSizeExceededException(this.options.maxFileSize, file.size);
    }

    // Validate MIME type
    if (this.options.allowedMimeTypes && !this.options.allowedMimeTypes.includes(file.mimetype)) {
      throw new InvalidFileTypeException(this.options.allowedMimeTypes, file.mimetype);
    }

    // Validate file extension
    if (this.options.allowedExtensions) {
      const fileExtension = this.getFileExtension(file.originalname);
      if (!this.options.allowedExtensions.includes(fileExtension)) {
        throw new InvalidFileExtensionException(this.options.allowedExtensions, fileExtension);
      }
    }

    return file;
  }

  private getFileExtension(filename: string): string {
    return '.' + filename.split('.').pop()?.toLowerCase() || '';
  }
}
