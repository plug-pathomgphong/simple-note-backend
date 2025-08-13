# Notes DTOs with Validation

This directory contains Data Transfer Objects (DTOs) with comprehensive validation for the Notes API.

## DTOs Overview

### CreateNoteDto
- **Purpose**: Validates data for creating new notes
- **Validations**:
  - `title`: Required string, 1-255 characters, automatically trimmed
  - `content`: Required string, 1-10,000 characters, automatically trimmed
  - `attachmentUrl`: Optional string, max 2048 characters

### UpdateNoteDto
- **Purpose**: Validates data for updating existing notes
- **Inheritance**: Extends `CreateNoteDto` with `PartialType`
- **Validations**: All fields are optional but follow the same validation rules as CreateNoteDto

### FileUploadDto
- **Purpose**: Validates file upload metadata
- **Includes**: Common file validation options and constraints
- **Supported Types**: Images (JPEG, PNG, GIF, WebP), PDF, Text, Word documents
- **Size Limit**: 10MB maximum

### PaginationDto
- **Purpose**: Validates pagination parameters for listing notes
- **Validations**:
  - `page`: Optional integer, 1-1000, defaults to 1
  - `limit`: Optional integer, 1-100, defaults to 10

## Validation Features

- **Type Safety**: All DTOs use TypeScript for compile-time type checking
- **Runtime Validation**: Uses `class-validator` decorators for runtime validation
- **Data Transformation**: Uses `class-transformer` for automatic data transformation
- **Error Messages**: Custom error messages for better user experience
- **Security**: Input sanitization through trimming and length constraints

## Usage

Import DTOs from the index file:

```typescript
import { CreateNoteDto, UpdateNoteDto, PaginationDto } from './dto';
```

## Validation Pipeline

1. **Transform**: Input data is transformed (trimmed, type converted)
2. **Validate**: Each field is validated against its constraints
3. **Error Handling**: Validation errors return detailed messages
4. **Type Safety**: TypeScript ensures correct usage at compile time

