import {
  IsString,
  IsNotEmpty,
  MaxLength,
  MinLength,
  IsOptional,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateNoteDto {
  @IsString({ message: 'Title must be a string' })
  @IsNotEmpty({ message: 'Title is required' })
  @MinLength(1, { message: 'Title must be at least 1 character long' })
  @MaxLength(255, { message: 'Title must not exceed 255 characters' })
  @Transform(({ value }: { value: string }) => value?.trim())
  title: string;

  @IsString({ message: 'Content must be a string' })
  @IsNotEmpty({ message: 'Content is required' })
  @MinLength(1, { message: 'Content must be at least 1 character long' })
  @MaxLength(1000, { message: 'Content must not exceed 1,000 characters' })
  @Transform(({ value }: { value: string }) => value?.trim())
  content: string;

  @IsOptional()
  @IsString({ message: 'Attachment URL must be a string' })
  @MaxLength(2048, {
    message: 'Attachment URL must not exceed 2048 characters',
  })
  attachmentUrl?: string;
}
