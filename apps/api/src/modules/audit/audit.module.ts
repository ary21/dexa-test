import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuditConsumer } from './audit.consumer';

@Module({
  imports: [
    ClientsModule.registerAsync([
      {
        name: 'AUDIT_CONSUMER',
        imports: [ConfigModule],
        useFactory: (config: ConfigService) => ({
          transport: Transport.RMQ,
          options: {
            urls: [config.get<string>('RABBITMQ_URL', 'amqp://localhost:5672')],
            queue: config.get<string>('RABBITMQ_QUEUE_PROFILE_UPDATE', 'employee.profile.updated'),
            queueOptions: { durable: true },
            noAck: false,
          },
        }),
        inject: [ConfigService],
      },
    ]),
  ],
  controllers: [AuditConsumer],
  providers: [],
})
export class AuditModule {}
