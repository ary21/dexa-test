import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException } from '@nestjs/common';
import { AttendanceService } from './attendance.service';
import { PrismaService } from '../../prisma/prisma.service';
import { AttendanceStatus } from '@prisma/client';

const mockPrisma = {
  attendance: {
    findFirst: jest.fn(),
    create: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
  },
  user: {
    findMany: jest.fn(),
  },
};

const mockCheckIn = {
  id: 'att-uuid-1',
  userId: 'emp-uuid-1',
  status: AttendanceStatus.CHECK_IN,
  timestamp: new Date('2025-01-15T08:32:00Z'),
  createdAt: new Date(),
};

describe('AttendanceService', () => {
  let service: AttendanceService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AttendanceService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<AttendanceService>(AttendanceService);
    jest.clearAllMocks();
  });

  // ── US-09 / FR-03-1: Check In ────────────────────────────────
  describe('checkIn()', () => {
    it('should create a CHECK_IN record with current timestamp', async () => {
      mockPrisma.attendance.findFirst.mockResolvedValue(null); // no existing check-in
      mockPrisma.attendance.create.mockResolvedValue(mockCheckIn);

      const result = await service.checkIn('emp-uuid-1');

      expect(result.status).toBe(AttendanceStatus.CHECK_IN);
      expect(mockPrisma.attendance.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: AttendanceStatus.CHECK_IN }),
        }),
      );
    });

    // ── FR-03-3 / AC US-11: Duplicate check-in blocked ──────────
    it('should throw 409 "You have already checked in today" on duplicate', async () => {
      mockPrisma.attendance.findFirst.mockResolvedValue(mockCheckIn);

      await expect(service.checkIn('emp-uuid-1')).rejects.toThrow(
        new ConflictException('You have already checked in today'),
      );
    });
  });

  // ── US-10 / FR-03-2: Check Out ──────────────────────────────
  describe('checkOut()', () => {
    it('should create a CHECK_OUT record', async () => {
      // First call: check for check-in → found
      // Second call: check for check-out → not found
      mockPrisma.attendance.findFirst
        .mockResolvedValueOnce(mockCheckIn)
        .mockResolvedValueOnce(null);
      mockPrisma.attendance.create.mockResolvedValue({
        ...mockCheckIn,
        id: 'att-uuid-2',
        status: AttendanceStatus.CHECK_OUT,
        timestamp: new Date('2025-01-15T17:05:00Z'),
      });

      const result = await service.checkOut('emp-uuid-1');
      expect(result.status).toBe(AttendanceStatus.CHECK_OUT);
    });

    // ── FR-03-4 / AC US-11: No check-in → blocked ────────────────
    it('should throw 409 "You must check in before checking out" if no check-in today', async () => {
      mockPrisma.attendance.findFirst.mockResolvedValue(null);

      await expect(service.checkOut('emp-uuid-1')).rejects.toThrow(
        new ConflictException('You must check in before checking out'),
      );
    });

    it('should throw 409 if already checked out today', async () => {
      // check-in found, check-out also found
      mockPrisma.attendance.findFirst
        .mockResolvedValueOnce(mockCheckIn)
        .mockResolvedValueOnce({ ...mockCheckIn, status: AttendanceStatus.CHECK_OUT });

      await expect(service.checkOut('emp-uuid-1')).rejects.toThrow(ConflictException);
    });
  });

  // ── US-12 / FR-04: Get my attendance ────────────────────────
  describe('getMyAttendance()', () => {
    it('should return paired check-in/check-out records sorted by date desc', async () => {
      const checkIn = { ...mockCheckIn, status: AttendanceStatus.CHECK_IN };
      const checkOut = {
        ...mockCheckIn,
        id: 'att-uuid-2',
        status: AttendanceStatus.CHECK_OUT,
        timestamp: new Date('2025-01-15T17:05:00Z'),
      };
      mockPrisma.attendance.findMany.mockResolvedValue([checkIn, checkOut]);

      const result = await service.getMyAttendance('emp-uuid-1', {
        from: new Date('2025-01-01'),
        to: new Date('2025-01-31'),
      });

      expect(result.data).toHaveLength(1);
      expect(result.data[0].checkIn).toBeDefined();
      expect(result.data[0].checkOut).toBeDefined();
    });

    it('should set checkOut=null for days with only check-in (AC US-12)', async () => {
      mockPrisma.attendance.findMany.mockResolvedValue([mockCheckIn]);
      const result = await service.getMyAttendance('emp-uuid-1', {
        from: new Date('2025-01-01'),
        to: new Date('2025-01-31'),
      });
      expect(result.data[0].checkOut).toBeNull();
    });

    it('should return empty array if no records (AC US-12)', async () => {
      mockPrisma.attendance.findMany.mockResolvedValue([]);
      const result = await service.getMyAttendance('emp-uuid-1', {
        from: new Date('2025-01-01'),
        to: new Date('2025-01-31'),
      });
      expect(result.data).toHaveLength(0);
    });
  });
});
