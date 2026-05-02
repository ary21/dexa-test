import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { AuditPrismaService } from './audit-prisma.service';

@Global()
@Module({
  providers: [PrismaService, AuditPrismaService],
  exports: [PrismaService, AuditPrismaService],
})
export class PrismaModule {}
