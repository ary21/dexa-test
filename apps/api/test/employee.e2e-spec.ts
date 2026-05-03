import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { AuditPrismaService } from '../src/prisma/audit-prisma.service';
import { JwtService } from '@nestjs/jwt';

describe('EmployeeController (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    process.env.DATABASE_URL = 'postgresql://dummy:dummy@localhost:5432/dummy';
    process.env.AUDIT_DATABASE_URL = 'postgresql://dummy:dummy@localhost:5433/dummy';
    process.env.JWT_SECRET = 'testsecret';
    process.env.JWT_EXPIRES_IN = '1h';

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue({
        user: {
          findUnique: jest.fn().mockResolvedValue({
            id: '2',
            email: 'employee@company.com',
            name: 'Employee',
            position: 'Staff',
            role: 'EMPLOYEE',
          }),
          update: jest.fn().mockResolvedValue({
            id: '2',
            phone: '08123456789',
          }),
          findMany: jest.fn().mockResolvedValue([]),
          count: jest.fn().mockResolvedValue(0),
        },
      })
      .overrideProvider(AuditPrismaService)
      .useValue({
        $connect: jest.fn(),
        $disconnect: jest.fn(),
      })
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/employees/me (GET)', () => {
    let token: string;

    beforeAll(() => {
      const jwtService = app.get(JwtService);
      token = jwtService.sign({ sub: '2', email: 'employee@company.com', role: 'EMPLOYEE' });
    });

    it('should return 401 if not authenticated', async () => {
      const res = await request(app.getHttpServer()).get('/employees/me');
      expect(res.status).toBe(401);
    });

    it('should return profile if authenticated', async () => {
      const res = await request(app.getHttpServer())
        .get('/employees/me')
        .set('Authorization', `Bearer ${token}`);
      
      expect(res.status).toBe(200);
      expect(res.body.email).toBe('employee@company.com');
    });
  });
});
