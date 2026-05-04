import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiBody, ApiResponse, ApiTags, ApiBearerAuth, ApiQuery, ApiParam } from '@nestjs/swagger';
import { UpdatePhoneDto } from './dto/update-phone.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { UpdatePhotoDto } from './dto/update-photo.dto';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';

export function ApiDocsEmployeeGetMe() {
  return applyDecorators(
    ApiOperation({ summary: 'Get current employee profile' }),
    ApiBearerAuth(),
    ApiResponse({ status: 200, description: 'Profile returned successfully' }),
  );
}

export function ApiDocsEmployeeUpdatePhone() {
  return applyDecorators(
    ApiOperation({ summary: 'Update employee phone number' }),
    ApiBearerAuth(),
    ApiBody({ schema: { example: { phone: '081234567890' } } }),
    ApiResponse({ status: 200, description: 'Phone updated successfully' }),
  );
}

export function ApiDocsEmployeeChangePassword() {
  return applyDecorators(
    ApiOperation({ summary: 'Change employee password' }),
    ApiBearerAuth(),
    ApiBody({ schema: { example: { currentPassword: 'oldpassword123', newPassword: 'newpassword123' } } }),
    ApiResponse({ status: 200, description: 'Password changed successfully' }),
    ApiResponse({ status: 401, description: 'Incorrect current password' }),
  );
}

export function ApiDocsEmployeeUpdatePhoto() {
  return applyDecorators(
    ApiOperation({ summary: 'Update employee photo URL' }),
    ApiBearerAuth(),
    ApiBody({ schema: { example: { photoUrl: 'https://example.com/photo.jpg' } } }),
    ApiResponse({ status: 200, description: 'Photo URL updated successfully' }),
  );
}

export function ApiDocsEmployeeFindAll() {
  return applyDecorators(
    ApiOperation({ summary: 'Get all employees (Admin)' }),
    ApiBearerAuth(),
    ApiQuery({ name: 'page', required: false, type: Number, example: 1 }),
    ApiQuery({ name: 'limit', required: false, type: Number, example: 10 }),
    ApiQuery({ name: 'search', required: false, type: String, example: '' }),
    ApiResponse({ status: 200, description: 'List of employees returned' }),
    ApiResponse({ status: 403, description: 'Forbidden - Requires ADMIN role' }),
  );
}

export function ApiDocsEmployeeCreate() {
  return applyDecorators(
    ApiOperation({ summary: 'Create new employee (Admin)' }),
    ApiBearerAuth(),
    ApiBody({ schema: { example: { name: 'John Doe', email: 'john@example.com', position: 'Developer', phone: '081234567890', password: 'password123' } } }),
    ApiResponse({ status: 201, description: 'Employee created successfully' }),
    ApiResponse({ status: 403, description: 'Forbidden' }),
    ApiResponse({ status: 409, description: 'Email already exists' }),
  );
}

export function ApiDocsEmployeeFindById() {
  return applyDecorators(
    ApiOperation({ summary: 'Get employee by ID (Admin)' }),
    ApiBearerAuth(),
    ApiParam({ name: 'id', required: true, description: 'Employee ID' }),
    ApiResponse({ status: 200, description: 'Employee returned successfully' }),
    ApiResponse({ status: 404, description: 'Employee not found' }),
  );
}

export function ApiDocsEmployeeUpdate() {
  return applyDecorators(
    ApiOperation({ summary: 'Update employee details (Admin)' }),
    ApiBearerAuth(),
    ApiParam({ name: 'id', required: true, description: 'Employee ID' }),
    ApiBody({ schema: { example: { name: 'John Updated', position: 'Senior Developer', phone: '0811111111' } } }),
    ApiResponse({ status: 200, description: 'Employee updated successfully' }),
    ApiResponse({ status: 404, description: 'Employee not found' }),
  );
}
