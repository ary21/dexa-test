import { Injectable, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AttendanceStatus, UserRole } from '@prisma/client';

@Injectable()
export class AttendanceService {
  constructor(private readonly prisma: PrismaService) {}

  private getTodayRange() {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
    const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
    return { start, end };
  }

  // ─── US-09 / FR-03-1: Check In ──────────────────────────────
  async checkIn(userId: string) {
    const { start, end } = this.getTodayRange();

    // FR-03-3: prevent duplicate check-in
    const existingCheckIn = await this.prisma.attendance.findFirst({
      where: {
        userId,
        status: AttendanceStatus.CHECK_IN,
        timestamp: { gte: start, lte: end },
      },
    });

    if (existingCheckIn) {
      throw new ConflictException('You have already checked in today');
    }

    return this.prisma.attendance.create({
      data: { userId, status: AttendanceStatus.CHECK_IN },
    });
  }

  // ─── US-10 / FR-03-2: Check Out ─────────────────────────────
  async checkOut(userId: string) {
    const { start, end } = this.getTodayRange();

    // FR-03-4: must have checked in first
    const checkIn = await this.prisma.attendance.findFirst({
      where: {
        userId,
        status: AttendanceStatus.CHECK_IN,
        timestamp: { gte: start, lte: end },
      },
    });

    if (!checkIn) {
      throw new ConflictException('You must check in before checking out');
    }

    // Prevent duplicate check-out
    const existingCheckOut = await this.prisma.attendance.findFirst({
      where: {
        userId,
        status: AttendanceStatus.CHECK_OUT,
        timestamp: { gte: start, lte: end },
      },
    });

    if (existingCheckOut) {
      throw new ConflictException('You have already checked out today');
    }

    return this.prisma.attendance.create({
      data: { userId, status: AttendanceStatus.CHECK_OUT },
    });
  }

  // ─── US-12 / FR-04: My attendance summary ───────────────────
  async getMyAttendance(userId: string, range: { from: Date; to: Date }) {
    const records = await this.prisma.attendance.findMany({
      where: {
        userId,
        timestamp: { gte: range.from, lte: range.to },
      },
      orderBy: { timestamp: 'asc' },
    });

    // Pair CHECK_IN + CHECK_OUT by date (FR-04-2)
    const paired: Record<
      string,
      { date: string; checkIn: Date | null; checkOut: Date | null }
    > = {};

    for (const record of records) {
      const dateKey = record.timestamp.toISOString().split('T')[0];
      if (!paired[dateKey]) {
        paired[dateKey] = { date: dateKey, checkIn: null, checkOut: null };
      }
      if (record.status === AttendanceStatus.CHECK_IN) {
        paired[dateKey].checkIn = record.timestamp;
      } else {
        paired[dateKey].checkOut = record.timestamp;
      }
    }

    // Sort descending by date (AC US-12)
    const data = Object.values(paired).sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    );

    return { data };
  }

  // ─── US-19 / FR-06: All attendance (Admin) ──────────────────
  async getAllAttendance(query: {
    page: number;
    limit: number;
    employeeName?: string;
    from?: Date;
    to?: Date;
  }) {
    const { page, limit, employeeName, from, to } = query;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (from || to) {
      where['timestamp'] = {
        ...(from && { gte: from }),
        ...(to && { lte: to }),
      };
    }
    if (employeeName) {
      where['user'] = {
        name: { contains: employeeName, mode: 'insensitive' },
      };
    }

    const [records, total] = await Promise.all([
      this.prisma.attendance.findMany({
        where,
        skip,
        take: limit,
        orderBy: { timestamp: 'desc' },
        include: { user: { select: { id: true, name: true } } },
      }),
      this.prisma.attendance.count({ where }),
    ]);

    // Pair records by employee+date
    const paired: Record<
      string,
      { employeeId: string; employeeName: string; date: string; checkIn: Date | null; checkOut: Date | null }
    > = {};

    for (const r of records) {
      const dateKey = `${r.userId}_${r.timestamp.toISOString().split('T')[0]}`;
      if (!paired[dateKey]) {
        paired[dateKey] = {
          employeeId: r.userId,
          employeeName: r.user.name,
          date: r.timestamp.toISOString().split('T')[0],
          checkIn: null,
          checkOut: null,
        };
      }
      if (r.status === AttendanceStatus.CHECK_IN) paired[dateKey].checkIn = r.timestamp;
      else paired[dateKey].checkOut = r.timestamp;
    }

    return { data: Object.values(paired), total, page, limit };
  }
}
