import {
  Controller,
  Get,
  Patch,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import { EmployeeService } from './employee.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User, UserRole } from '@prisma/client';
import { UpdatePhoneDto } from './dto/update-phone.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { UpdatePhotoDto } from './dto/update-photo.dto';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { ApiTags } from '@nestjs/swagger';
import {
  ApiDocsEmployeeGetMe,
  ApiDocsEmployeeUpdatePhone,
  ApiDocsEmployeeChangePassword,
  ApiDocsEmployeeUpdatePhoto,
  ApiDocsEmployeeFindAll,
  ApiDocsEmployeeCreate,
  ApiDocsEmployeeFindById,
  ApiDocsEmployeeUpdate,
} from './employee.swagger';

@ApiTags('employees')
@Controller('employees')
@UseGuards(JwtAuthGuard, RolesGuard)
export class EmployeeController {
  constructor(private readonly employeeService: EmployeeService) {}

  // ─── Employee self-service routes ──────────────────────────

  @Get('me')
  @ApiDocsEmployeeGetMe()
  async getMe(@CurrentUser() user: User) {
    return this.employeeService.findMe(user.id);
  }

  @Patch('me/phone')
  @ApiDocsEmployeeUpdatePhone()
  async updatePhone(@CurrentUser() user: User, @Body() dto: UpdatePhoneDto) {
    return this.employeeService.updatePhone(user.id, dto);
  }

  @Patch('me/password')
  @ApiDocsEmployeeChangePassword()
  async changePassword(@CurrentUser() user: User, @Body() dto: ChangePasswordDto) {
    return this.employeeService.changePassword(user.id, dto);
  }

  @Patch('me/photo')
  @ApiDocsEmployeeUpdatePhoto()
  async updatePhoto(@CurrentUser() user: User, @Body() dto: UpdatePhotoDto) {
    return this.employeeService.updatePhoto(user.id, dto);
  }

  // ─── Admin-only routes ─────────────────────────────────────

  @Get()
  @ApiDocsEmployeeFindAll()
  @Roles(UserRole.ADMIN)
  async findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @Query('search', new DefaultValuePipe('')) search: string,
  ) {
    return this.employeeService.findAll({ page, limit, search });
  }

  @Post()
  @ApiDocsEmployeeCreate()
  @Roles(UserRole.ADMIN)
  async create(@Body() dto: CreateEmployeeDto) {
    return this.employeeService.create(dto);
  }

  @Get(':id')
  @ApiDocsEmployeeFindById()
  @Roles(UserRole.ADMIN)
  async findById(@Param('id') id: string) {
    return this.employeeService.findById(id);
  }

  @Patch(':id')
  @ApiDocsEmployeeUpdate()
  @Roles(UserRole.ADMIN)
  async update(@Param('id') id: string, @Body() dto: UpdateEmployeeDto) {
    return this.employeeService.update(id, dto);
  }
}
