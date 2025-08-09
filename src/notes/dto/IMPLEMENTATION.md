# DTO Implementation Guide

## FileUploadDto Implementation

### Current Implementation
The `FileUploadDto` is now implemented with a custom validation pipe that provides comprehensive file validation.

### Features
- **File size validation**: Maximum 10MB
- **MIME type validation**: Images, PDFs, text files, Word documents
- **File extension validation**: Comprehensive extension checking
- **Custom error messages**: Clear validation feedback

### Usage in Controller
```typescript
@Post()
@UseInterceptors(FileInterceptor('file', { storage: memoryStorage() }))
create(
  @Body() createNoteDto: CreateNoteDto,
  @UploadedFile(new FileValidationPipe()) file: Express.Multer.File,
) {
  return this.notesService.create(createNoteDto, file);
}
```

### Custom Validation Options
You can customize file validation by passing options to the pipe:

```typescript
@UploadedFile(new FileValidationPipe({
  allowedMimeTypes: ['image/jpeg', 'image/png'],
  maxFileSize: 5 * 1024 * 1024, // 5MB
  allowedExtensions: ['.jpg', '.png']
})) file: Express.Multer.File
```

### API Example
```bash
POST /notes
Content-Type: multipart/form-data

title: "My Note"
content: "Note content"
file: [binary file data]
```

## PaginationDto Implementation

### Current Implementation
The `PaginationDto` is now properly integrated with automatic validation and transformation.

### Features
- **Automatic type conversion**: String query params → numbers
- **Default values**: page=1, limit=10
- **Validation constraints**: page (1-1000), limit (1-100)
- **Enhanced response**: Includes navigation metadata

### Usage in Controller
```typescript
@Get()
async findAll(@Query() paginationDto: PaginationDto) {
  return this.notesService.findAll(paginationDto.page, paginationDto.limit);
}
```

### API Examples
```bash
# Default pagination
GET /notes
# Returns: page=1, limit=10

# Custom pagination
GET /notes?page=2&limit=20

# Validation errors
GET /notes?page=0      # Error: Page must be at least 1
GET /notes?limit=150   # Error: Limit must not exceed 100
GET /notes?page=abc    # Error: Page must be an integer
```

### Response Structure
```json
{
  "items": [...],
  "meta": {
    "page": 2,
    "limit": 10,
    "totalItems": 45,
    "totalPages": 5,
    "hasNextPage": true,
    "hasPreviousPage": true
  }
}
```

## Global Validation Configuration

The application now uses global validation with these settings:
- **transform**: Automatically convert types
- **whitelist**: Strip unknown properties
- **forbidNonWhitelisted**: Reject requests with unknown properties

This ensures all DTOs work consistently across the application.

## Error Handling

### File Upload Errors
- File too large: "File size too large. Maximum allowed size is 10MB"
- Invalid type: "Invalid file type. Allowed types: image/jpeg, image/png, ..."
- Invalid extension: "Invalid file extension. Allowed extensions: .jpg, .png, ..."

### Pagination Errors
- Invalid page: "Page must be an integer"
- Page out of range: "Page must be at least 1"
- Limit too high: "Limit must not exceed 100"

## Best Practices

1. **Always use DTOs** for request validation
2. **Leverage type transformation** for query parameters
3. **Provide clear error messages** for better UX
4. **Use the file validation pipe** for all file uploads
5. **Return structured responses** with metadata for pagination
