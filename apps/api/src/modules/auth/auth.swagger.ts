import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiBody, ApiResponse, ApiTags } from '@nestjs/swagger';
import { LoginDto } from './dto/login.dto';

export function ApiDocsAuthLogin() {
  return applyDecorators(
    ApiTags('auth'),
    ApiOperation({ summary: 'Login to get an access token' }),
    ApiBody({ type: LoginDto }),
    ApiResponse({
      status: 200,
      description: 'Successfully authenticated',
      schema: {
        example: {
          accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
          user: {
            id: 'cm02abcd...',
            email: 'admin@example.com',
            name: 'Admin User',
            role: 'ADMIN',
            position: 'HR Manager',
            photoUrl: 'https://example.com/photo.jpg',
          },
        },
      },
    }),
    ApiResponse({ status: 401, description: 'Invalid email or password' }),
  );
}
