import {
  Controller, Post, Get, Query, UseGuards,
  ParseIntPipe, DefaultValuePipe, Optional,
} from '@nestjs/common';
import { AttendanceService } from './attendance.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User, UserRole } from '@prisma/client';

@Controller('attendances')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  @Post('check-in')
  async checkIn(@CurrentUser() user: User) {
    return this.attendanceService.checkIn(user.id);
  }

  @Post('check-out')
  async checkOut(@CurrentUser() user: User) {
    return this.attendanceService.checkOut(user.id);
  }

  @Get('me')
  async getMyAttendance(
    @CurrentUser() user: User,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    // Default: 1st of current month to today (FR-04-1)
    const now = new Date();
    const defaultFrom = new Date(now.getFullYear(), now.getMonth(), 1);
    const fromDate = from ? new Date(`${from}T00:00:00`) : defaultFrom;
    const toDate = to ? new Date(`${to}T23:59:59.999`) : now;
    return this.attendanceService.getMyAttendance(user.id, { from: fromDate, to: toDate });
  }

  @Get()
  @Roles(UserRole.ADMIN)
  async getAllAttendance(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @Query('employeeName') employeeName?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.attendanceService.getAllAttendance({
      page,
      limit,
      employeeName,
      from: from ? new Date(`${from}T00:00:00`) : undefined,
      to: to ? new Date(`${to}T23:59:59.999`) : undefined,
    });
  }
}
