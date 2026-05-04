import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiResponse, ApiBearerAuth, ApiTags } from '@nestjs/swagger';

export function ApiDocsMinioGetUploadUrl() {
  return applyDecorators(
    ApiOperation({ summary: 'Get pre-signed URL for MinIO upload' }),
    ApiBearerAuth(),
    ApiQuery({ name: 'filename', required: true, type: String, description: 'File name to upload' }),
    ApiQuery({ name: 'contentType', required: true, type: String, description: 'MIME type of the file' }),
    ApiResponse({
      status: 200,
      description: 'Pre-signed URL generated successfully',
      schema: {
        example: {
          uploadUrl: 'http://localhost:9000/attendance-bucket/123-photo.jpg?X-Amz-Algorithm=AWS4-HMAC-SHA256...',
          fileUrl: 'http://localhost:9000/attendance-bucket/123-photo.jpg',
        },
      },
    }),
  );
}
