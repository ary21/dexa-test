import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiBody, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';

export function ApiDocsNotificationSaveFcmToken() {
  return applyDecorators(
    ApiOperation({ summary: 'Save Firebase Cloud Messaging token' }),
    ApiBearerAuth(),
    ApiBody({ schema: { example: { token: 'dKjh3...s2d' } } }),
    ApiResponse({ status: 201, description: 'FCM token registered successfully' }),
  );
}
