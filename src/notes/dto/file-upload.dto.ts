import { IsOptional, IsString, MaxLength } from 'class-validator';

export class FileUploadDto {
  @IsOptional()
  @IsString({ message: 'Filename must be a string' })
  @MaxLength(255, { message: 'Filename must not exceed 255 characters' })
  filename?: string;

  @IsOptional()
  @IsString({ message: 'Mimetype must be a string' })
  @MaxLength(100, { message: 'Mimetype must not exceed 100 characters' })
  mimetype?: string;
}

export interface FileValidationOptions {
  allowedMimeTypes?: string[];
  maxFileSize?: number; // in bytes
  allowedExtensions?: string[];
}

// File validation helper for common file types
export const COMMON_FILE_VALIDATION: FileValidationOptions = {
  allowedMimeTypes: ['image/jpeg', 'image/png'],
  //   'image/gif',
  //   'image/webp',
  //   'application/pdf',
  //   'text/plain',
  //   'application/msword',
  //   'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  maxFileSize: 2 * 1024 * 1024, // 2MB
  allowedExtensions: ['.jpg', '.jpeg', '.png'], //'.gif', '.webp', '.pdf', '.txt', '.doc', '.docx'
};
