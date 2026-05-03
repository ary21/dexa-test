import { Controller, Logger } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { AuditPrismaService } from '../../prisma/audit-prisma.service';

export interface ProfileUpdatedEvent {
  employeeId: string;
  employeeName: string;
  fieldChanged: string;
  oldValue: string | null;
  newValue: string | null;
}

@Controller()
export class AuditConsumer {
  private readonly logger = new Logger(AuditConsumer.name);

  constructor(private readonly auditPrisma: AuditPrismaService) {}

  @EventPattern('employee.profile.updated')
  async handleProfileUpdated(@Payload() event: ProfileUpdatedEvent) {
    try {
      await this.auditPrisma.$executeRaw`
        INSERT INTO audit_logs (id, "employeeId", "employeeName", "fieldChanged", "oldValue", "newValue", "changedAt")
        VALUES (gen_random_uuid(), ${event.employeeId}, ${event.employeeName}, ${event.fieldChanged}, ${event.oldValue}, ${event.newValue}, NOW())
      `;
      this.logger.log(
        `Audit recorded: ${event.employeeName} changed ${event.fieldChanged}`,
      );
    } catch (err) {
      this.logger.error(`Failed to write audit log: ${err}`);
    }
  }
}
