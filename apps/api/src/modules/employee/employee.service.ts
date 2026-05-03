import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  Inject,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationService } from '../notification/notification.service';
import * as bcrypt from 'bcrypt';
import { UpdatePhoneDto } from './dto/update-phone.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { UpdatePhotoDto } from './dto/update-photo.dto';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { UserRole } from '@prisma/client';

const BCRYPT_ROUNDS = 10;
const PROFILE_EXCHANGE = process.env.RABBITMQ_QUEUE_PROFILE_UPDATE ?? 'employee.profile.updated';

@Injectable()
export class EmployeeService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notification: NotificationService,
    @Inject('AMQP_CONNECTION') private readonly amqp: any,
  ) {}

  // ─── Helper ────────────────────────────────────────────────
  private exclude<T, K extends keyof T>(obj: T, keys: K[]): Omit<T, K> {
    const result = { ...obj };
    keys.forEach((key) => delete result[key]);
    return result;
  }

  private publishAuditEvent(
    employeeId: string,
    employeeName: string,
    fieldChanged: string,
    oldValue: string | null,
    newValue: string | null,
  ) {
    this.amqp.emit(PROFILE_EXCHANGE, {
      employeeId,
      employeeName,
      fieldChanged,
      oldValue,
      newValue,
    });
  }

  // ─── US-04: Get my profile ──────────────────────────────────
  async findMe(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    return this.exclude(user, ['password']);
  }

  // ─── US-06: Update phone ────────────────────────────────────
  async updatePhone(userId: string, dto: UpdatePhoneDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    await this.prisma.user.update({
      where: { id: userId },
      data: { phone: dto.phone },
    });

    // FR-02-5: Publish to RabbitMQ
    this.publishAuditEvent(userId, user.name, 'phone', user.phone, dto.phone);

    // FR-02-6: Send FCM notification
    await this.notification.sendToAdmins(
      'Profile Updated',
      `${user.name} updated their phone number`,
    );

    return { message: 'Phone number updated successfully' };
  }

  // ─── US-07: Change password ─────────────────────────────────
  async changePassword(userId: string, dto: ChangePasswordDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const isValid = await bcrypt.compare(dto.currentPassword, user.password);
    if (!isValid) throw new BadRequestException('Current password is incorrect');

    const hashed = await bcrypt.hash(dto.newPassword, BCRYPT_ROUNDS);
    await this.prisma.user.update({ where: { id: userId }, data: { password: hashed } });

    // FR-08-3: Password events use [REDACTED]
    this.publishAuditEvent(userId, user.name, 'password', '[REDACTED]', '[REDACTED]');

    await this.notification.sendToAdmins(
      'Profile Updated',
      `${user.name} changed their password`,
    );

    return { message: 'Password changed successfully' };
  }

  // ─── US-05: Update photo ────────────────────────────────────
  async updatePhoto(userId: string, dto: UpdatePhotoDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: { photoUrl: dto.photoUrl },
    });

    this.publishAuditEvent(userId, user.name, 'photoUrl', user.photoUrl, dto.photoUrl);

    await this.notification.sendToAdmins(
      'Profile Updated',
      `${user.name} updated their profile photo`,
    );

    return { message: 'Photo updated successfully', photoUrl: updated.photoUrl };
  }

  // ─── US-15: Get all employees (Admin) ──────────────────────
  async findAll(query: { page: number; limit: number; search: string }) {
    const { page, limit, search } = query;
    const skip = (page - 1) * limit;

    const where = search
      ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' as const } },
            { email: { contains: search, mode: 'insensitive' as const } },
          ],
          role: UserRole.EMPLOYEE,
        }
      : { role: UserRole.EMPLOYEE };

    const [data, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: { id: true, name: true, email: true, position: true, phone: true, photoUrl: true },
      }),
      this.prisma.user.count({ where }),
    ]);

    return { data, total, page, limit };
  }

  // ─── US-16: Create employee (Admin) ────────────────────────
  async create(dto: CreateEmployeeDto) {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) throw new ConflictException('This email is already registered');

    const hashedPassword = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);

    const user = await this.prisma.user.create({
      data: {
        name: dto.name,
        email: dto.email,
        position: dto.position,
        phone: dto.phone,
        password: hashedPassword,
        role: UserRole.EMPLOYEE,
      },
    });

    return this.exclude(user, ['password']);
  }

  // ─── US-17: Update employee (Admin) ─────────────────────────
  async update(employeeId: string, dto: UpdateEmployeeDto) {
    const user = await this.prisma.user.findUnique({ where: { id: employeeId } });
    if (!user) throw new NotFoundException('Employee not found');

    // email is intentionally excluded from UpdateEmployeeDto (AC US-17)
    const updated = await this.prisma.user.update({
      where: { id: employeeId },
      data: {
        ...(dto.name && { name: dto.name }),
        ...(dto.position && { position: dto.position }),
        ...(dto.phone && { phone: dto.phone }),
      },
    });

    return this.exclude(updated, ['password']);
  }

  // ─── US-18: Get single employee (Admin) ────────────────────
  async findById(employeeId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: employeeId } });
    if (!user) throw new NotFoundException('Employee not found');
    return this.exclude(user, ['password']);
  }
}
