import { Test, TestingModule } from '@nestjs/testing';
import { AuditConsumer } from './audit.consumer';
import { AuditPrismaService } from '../../prisma/audit-prisma.service';

const mockAuditPrisma = {
  $executeRaw: jest.fn().mockResolvedValue(1),
};

describe('AuditConsumer', () => {
  let consumer: AuditConsumer;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuditConsumer,
        { provide: AuditPrismaService, useValue: mockAuditPrisma },
      ],
    }).compile();

    consumer = module.get<AuditConsumer>(AuditConsumer);
    jest.clearAllMocks();
  });

  // ── FR-08-2: Writes to audit_db on message received ──────────
  it('should write audit log to audit_db on message (FR-08-2)', async () => {
    await consumer.handleProfileUpdated({
      employeeId: 'emp-1',
      employeeName: 'John Doe',
      fieldChanged: 'phone',
      oldValue: '08111111111',
      newValue: '08199998888',
    });

    expect(mockAuditPrisma.$executeRaw).toHaveBeenCalledTimes(1);
  });

  // ── AC US-23: Password events have [REDACTED] ────────────────
  it('should store [REDACTED] for password change events (AC US-23)', async () => {
    await consumer.handleProfileUpdated({
      employeeId: 'emp-1',
      employeeName: 'John Doe',
      fieldChanged: 'password',
      oldValue: '[REDACTED]',
      newValue: '[REDACTED]',
    });

    const call = mockAuditPrisma.$executeRaw.mock.calls[0];
    const callArgs = mockAuditPrisma.$executeRaw.mock.calls[0];
    expect(callArgs).toContain('[REDACTED]');
  });
});
