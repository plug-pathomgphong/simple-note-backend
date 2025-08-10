# Custom Exception System

This custom exception system provides structured error handling for the NestJS application with consistent error responses and proper HTTP status codes.

## Architecture

### Base Exception (`base.exception.ts`)
- Abstract base class that all custom exceptions extend
- Provides consistent error response structure
- Includes error details and metadata
- Supports proper error serialization

### Exception Types

#### Note Exceptions (`note.exceptions.ts`)
- **NoteNotFoundException**: Thrown when a note is not found (404)
- **InvalidPageException**: Thrown when pagination parameters are invalid (400)
- **FileUploadException**: Base class for file upload errors (400)
- **FileSizeExceededException**: File size exceeds limit
- **InvalidFileTypeException**: File MIME type not allowed
- **InvalidFileExtensionException**: File extension not allowed

#### S3 Exceptions (`s3.exceptions.ts`)
- **S3ConfigurationException**: S3 configuration errors (500)
- **S3UploadException**: File upload to S3 failed (500)
- **S3DeleteException**: File deletion from S3 failed (500)

### Global Exception Filter (`global-exception.filter.ts`)
- Catches all exceptions globally
- Handles custom exceptions, NestJS HTTP exceptions, and generic errors
- Provides consistent error response format
- Includes proper logging

## Error Response Format

```json
{
  "statusCode": 404,
  "message": "Note with id 123 not found",
  "error": "Note Not Found",
  "timestamp": "2023-06-17T10:30:00.000Z",
  "path": "/notes/123",
  "details": {
    "noteId": 123
  }
}
```

## Usage Examples

### Throwing Custom Exceptions

```typescript
// In service
if (!note) {
  throw new NoteNotFoundException(id);
}

// File validation
if (file.size > maxSize) {
  throw new FileSizeExceededException(maxSize, file.size);
}

// S3 operations
if (uploadFailed) {
  throw new S3UploadException(originalError, fileName);
}
```

### Exception Details

Custom exceptions can include additional details:

```typescript
throw new InvalidPageException(page, totalItems);
// Results in:
{
  "statusCode": 400,
  "message": "Page number exceeds total items",
  "error": "Invalid Page",
  "details": {
    "requestedPage": 5,
    "totalItems": 45,
    "maxValidPage": 5
  }
}
```

## Implementation Notes

1. **Type Safety**: All exceptions use TypeScript for type safety
2. **Logging**: Exceptions are properly logged with appropriate levels
3. **HTTP Status Codes**: Each exception has the correct HTTP status code
4. **Error Context**: Detailed error information helps with debugging
5. **Consistency**: All errors follow the same response structure

## Registration

The global exception filter is registered in `main.ts`:

```typescript
app.useGlobalFilters(new GlobalExceptionFilter());
```

## Benefits

1. **Consistent Error Handling**: All errors follow the same structure
2. **Better Debugging**: Rich error details and proper logging
3. **Type Safety**: TypeScript ensures correct usage
4. **HTTP Compliance**: Proper status codes for different error types
5. **Maintainability**: Easy to add new exception types
6. **Client-Friendly**: Structured responses are easy for clients to parse
