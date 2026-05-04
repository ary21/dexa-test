import * as Sentry from '@sentry/nestjs';
import { nodeProfilingIntegration } from '@sentry/profiling-node';

// Initialize Sentry BEFORE importing anything else
Sentry.init({
  dsn: process.env.SENTRY_DSN || '',
  integrations: [nodeProfilingIntegration() as any],
  tracesSampleRate: 1.0,
  profilesSampleRate: 1.0,
  enabled: !!process.env.SENTRY_DSN,
});

import { NestFactory, HttpAdapterHost, BaseExceptionFilter } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { Transport } from '@nestjs/microservices';
import * as helmet from 'helmet';
import * as compression from 'compression';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Microservice for RMQ (Audit Logging)
  app.connectMicroservice({
    transport: Transport.RMQ,
    options: {
      urls: [process.env.RABBITMQ_URL || 'amqp://localhost:5672'],
      queue: process.env.RABBITMQ_QUEUE_PROFILE_UPDATE || 'employee.profile.updated',
      queueOptions: { durable: true },
    },
  });

  await app.startAllMicroservices();

  // Security middleware
  app.use(helmet.default());
  app.use(compression());

  // CORS
  app.enableCors({
    origin: true,
    credentials: true,
  });

  // Global prefix
  app.setGlobalPrefix('api');

  // Global validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const { httpAdapter } = app.get(HttpAdapterHost);
  Sentry.setupNestErrorHandler(app, new BaseExceptionFilter(httpAdapter));

  // Swagger integration
  const config = new DocumentBuilder()
    .setTitle('Attendance API')
    .setDescription('The API documentation for the HRD Attendance System')
    .setVersion('1.0.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  console.log(`🚀 API running on http://localhost:${port}/api`);
}

bootstrap();
