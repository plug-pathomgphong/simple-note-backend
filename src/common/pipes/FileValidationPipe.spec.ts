import { FileValidationPipe } from './file-validation.pipe';
import {
  FileSizeExceededException,
  InvalidFileTypeException,
  InvalidFileExtensionException,
} from '../exceptions';
import { FileValidationOptions } from '../../notes/dto/file-upload.dto';

describe('FileValidationPipe', () => {
  let pipe: FileValidationPipe;
  const defaultOptions: FileValidationOptions = {
    maxFileSize: 2 * 1024 * 1024, // 2MB
    allowedMimeTypes: ['image/png', 'image/jpeg'],
    allowedExtensions: ['.png', '.jpg', '.jpeg'],
  };

  beforeEach(() => {
    pipe = new FileValidationPipe(defaultOptions);
  });

  it('should return file as-is if valid', () => {
    const file = {
      originalname: 'test.png',
      mimetype: 'image/png',
      size: 1024,
    } as Express.Multer.File;

    const result = pipe.transform(file);
    expect(result).toBe(file);
  });

  it('should allow no file if optional', () => {
    expect(pipe.transform(undefined as any)).toBeUndefined();
  });

  it('should throw FileSizeExceededException for large files', () => {
    const file = {
      originalname: 'bigfile.png',
      mimetype: 'image/png',
      size: defaultOptions.maxFileSize! + 1,
    } as Express.Multer.File;

    expect(() => pipe.transform(file)).toThrow(FileSizeExceededException);
  });

  it('should throw InvalidFileTypeException for invalid MIME type', () => {
    const file = {
      originalname: 'test.png',
      mimetype: 'application/pdf',
      size: 1024,
    } as Express.Multer.File;

    expect(() => pipe.transform(file)).toThrow(InvalidFileTypeException);
  });

  it('should throw InvalidFileExtensionException for invalid extension', () => {
    const file = {
      originalname: 'test.gif',
      mimetype: 'image/gif',
      size: 1024,
    } as Express.Multer.File;

    const customPipe = new FileValidationPipe({
      allowedExtensions: ['.png', '.jpg'],
      allowedMimeTypes: ['image/gif'],
      maxFileSize: 1024 * 1024,
    });

    expect(() => customPipe.transform(file)).toThrow(
      InvalidFileExtensionException,
    );
  });
});
