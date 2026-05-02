import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { EmployeeService } from './employee.service';
import { EmployeeController } from './employee.controller';
import { MinioModule } from '../minio/minio.module';
import { NotificationModule } from '../notification/notification.module';

@Module({
  imports: [
    MinioModule,
    NotificationModule,
    ClientsModule.registerAsync([
      {
        name: 'AMQP_CONNECTION',
        imports: [ConfigModule],
        useFactory: (config: ConfigService) => ({
          transport: Transport.RMQ,
          options: {
            urls: [config.get<string>('RABBITMQ_URL', 'amqp://localhost:5672')],
            queue: config.get<string>('RABBITMQ_QUEUE_PROFILE_UPDATE', 'employee.profile.updated'),
            queueOptions: { durable: true },
          },
        }),
        inject: [ConfigService],
      },
    ]),
  ],
  providers: [EmployeeService],
  controllers: [EmployeeController],
  exports: [EmployeeService],
})
export class EmployeeModule {}
