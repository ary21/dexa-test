import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';

export function ApiDocsAttendanceCheckIn() {
  return applyDecorators(
    ApiOperation({ summary: 'Employee check-in' }),
    ApiBearerAuth(),
    ApiResponse({ status: 201, description: 'Checked in successfully' }),
    ApiResponse({ status: 409, description: 'Already checked in today' }),
  );
}

export function ApiDocsAttendanceCheckOut() {
  return applyDecorators(
    ApiOperation({ summary: 'Employee check-out' }),
    ApiBearerAuth(),
    ApiResponse({ status: 201, description: 'Checked out successfully' }),
    ApiResponse({ status: 409, description: 'Already checked out today, or no check-in record' }),
  );
}

export function ApiDocsAttendanceGetMyAttendance() {
  return applyDecorators(
    ApiOperation({ summary: 'Get current employee attendance records' }),
    ApiBearerAuth(),
    ApiQuery({ name: 'from', required: false, type: String, description: 'Start date YYYY-MM-DD' }),
    ApiQuery({ name: 'to', required: false, type: String, description: 'End date YYYY-MM-DD' }),
    ApiResponse({ status: 200, description: 'List of attendance records for the employee' }),
  );
}

export function ApiDocsAttendanceGetAll() {
  return applyDecorators(
    ApiOperation({ summary: 'Get all attendance records (Admin)' }),
    ApiBearerAuth(),
    ApiQuery({ name: 'page', required: false, type: Number, example: 1 }),
    ApiQuery({ name: 'limit', required: false, type: Number, example: 10 }),
    ApiQuery({ name: 'employeeName', required: false, type: String }),
    ApiQuery({ name: 'from', required: false, type: String, description: 'Start date YYYY-MM-DD' }),
    ApiQuery({ name: 'to', required: false, type: String, description: 'End date YYYY-MM-DD' }),
    ApiResponse({ status: 200, description: 'Paginated list of all attendance records' }),
  );
}
