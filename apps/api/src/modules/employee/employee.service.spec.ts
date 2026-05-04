import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { EmployeeService } from './employee.service';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationService } from '../notification/notification.service';
import * as bcrypt from 'bcrypt';

// ─── Mocks ───────────────────────────────────────────────────
const mockEmployee = {
  id: 'emp-uuid-1',
  email: 'john@company.com',
  password: '$2b$10$hashedpassword',
  name: 'John Doe',
  position: 'Software Engineer',
  phone: '08111111111',
  photoUrl: null,
  role: 'EMPLOYEE',
  fcmToken: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockPrisma = {
  user: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
    update: jest.fn(),
    create: jest.fn(),
  },
};

const mockNotification = {
  sendToAdmins: jest.fn(),
};

const mockAmqpConnection = {
  emit: jest.fn(),
};

describe('EmployeeService', () => {
  let service: EmployeeService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmployeeService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: NotificationService, useValue: mockNotification },
        { provide: 'AMQP_CONNECTION', useValue: mockAmqpConnection },
      ],
    }).compile();

    service = module.get<EmployeeService>(EmployeeService);
    jest.clearAllMocks();
  });

  // ── US-04: View profile ──────────────────────────────────────
  describe('findMe()', () => {
    it('should return user profile without password', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockEmployee);
      const result = await service.findMe('emp-uuid-1');
      expect(result.id).toBe(mockEmployee.id);
      expect(result).not.toHaveProperty('password');
    });

    it('should throw NotFoundException if user not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      await expect(service.findMe('bad-id')).rejects.toThrow(NotFoundException);
    });
  });

  // ── US-06: Update phone ──────────────────────────────────────
  describe('updatePhone()', () => {
    it('should update phone number successfully', async () => {
      mockPrisma.user.update.mockResolvedValue({ ...mockEmployee, phone: '08199998888' });
      mockPrisma.user.findUnique.mockResolvedValue(mockEmployee);
      const result = await service.updatePhone('emp-uuid-1', { phone: '08199998888' });
      expect(result.message).toBe('Phone number updated successfully');
    });

    it('should publish RabbitMQ event after phone update (FR-02-5)', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockEmployee);
      mockPrisma.user.update.mockResolvedValue({ ...mockEmployee, phone: '08199998888' });
      await service.updatePhone('emp-uuid-1', { phone: '08199998888' });
      expect(mockAmqpConnection.emit).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ fieldChanged: 'phone' }),
      );
    });

    it('should send FCM notification after phone update (FR-02-6)', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockEmployee);
      mockPrisma.user.update.mockResolvedValue({ ...mockEmployee, phone: '08199998888' });
      await service.updatePhone('emp-uuid-1', { phone: '08199998888' });
      expect(mockNotification.sendToAdmins).toHaveBeenCalled();
    });
  });

  // ── US-07: Change password ───────────────────────────────────
  describe('changePassword()', () => {
    it('should throw BadRequestException if current password is wrong', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockEmployee);
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(false as never);

      await expect(
        service.changePassword('emp-uuid-1', {
          currentPassword: 'wrong',
          newPassword: 'newpass123',
        }),
      ).rejects.toThrow(new BadRequestException('Current password is incorrect'));
    });

    it('should hash new password with bcrypt (NFR-08)', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockEmployee);
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(true as never);
      const hashSpy = jest.spyOn(bcrypt, 'hash').mockResolvedValue('$2b$10$newhash' as never);
      mockPrisma.user.update.mockResolvedValue({ ...mockEmployee });

      await service.changePassword('emp-uuid-1', {
        currentPassword: 'oldpass',
        newPassword: 'newpass123',
      });

      expect(hashSpy).toHaveBeenCalledWith('newpass123', 10);
    });

    it('should publish event with [REDACTED] for password change (AC US-23)', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockEmployee);
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(true as never);
      jest.spyOn(bcrypt, 'hash').mockResolvedValue('$2b$10$newhash' as never);
      mockPrisma.user.update.mockResolvedValue({ ...mockEmployee });

      await service.changePassword('emp-uuid-1', {
        currentPassword: 'oldpass',
        newPassword: 'newpass123',
      });

      expect(mockAmqpConnection.emit).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ oldValue: '[REDACTED]', newValue: '[REDACTED]' }),
      );
    });
  });

  // ── US-05: Update photo ──────────────────────────────────────
  describe('updatePhoto()', () => {
    it('should save photoUrl to user record', async () => {
      const newUrl = 'https://minio.example.com/photos/avatar.jpg';
      mockPrisma.user.findUnique.mockResolvedValue(mockEmployee);
      mockPrisma.user.update.mockResolvedValue({ ...mockEmployee, photoUrl: newUrl });

      const result = await service.updatePhoto('emp-uuid-1', { photoUrl: newUrl });
      expect(result.photoUrl).toBe(newUrl);
    });
  });

  // ── US-15: Paginated employee list ───────────────────────────
  describe('findAll()', () => {
    it('should return paginated employee list with total count', async () => {
      mockPrisma.user.findMany.mockResolvedValue([mockEmployee]);
      mockPrisma.user.count.mockResolvedValue(1);

      const result = await service.findAll({ page: 1, limit: 10, search: '' });
      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
    });
  });

  // ── US-16: Create employee ───────────────────────────────────
  describe('create()', () => {
    it('should throw ConflictException if email already exists', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockEmployee);

      await expect(
        service.create({
          name: 'Jane',
          email: 'john@company.com',
          position: 'Designer',
          password: 'Pass@1234',
        }),
      ).rejects.toThrow(new ConflictException('This email is already registered'));
    });

    it('should hash password before saving (NFR-08)', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      const hashSpy = jest.spyOn(bcrypt, 'hash').mockResolvedValue('$2b$10$hashed' as never);
      mockPrisma.user.create.mockResolvedValue({ ...mockEmployee, email: 'jane@company.com' });

      await service.create({
        name: 'Jane',
        email: 'jane@company.com',
        position: 'Designer',
        password: 'Pass@1234',
      });

      expect(hashSpy).toHaveBeenCalledWith('Pass@1234', 10);
    });
  });

  // ── US-17: Email cannot be updated ──────────────────────────
  describe('update()', () => {
    it('should update name/position/phone but not email', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockEmployee);
      mockPrisma.user.update.mockResolvedValue({
        ...mockEmployee,
        name: 'John Updated',
        position: 'Senior Engineer',
      });

      const result = await service.update('emp-uuid-1', {
        name: 'John Updated',
        position: 'Senior Engineer',
      });

      // email in updateData must not be passed to prisma.user.update
      const updateCall = mockPrisma.user.update.mock.calls[0][0];
      expect(updateCall.data).not.toHaveProperty('email');
      expect(result.name).toBe('John Updated');
    });
  });
});
