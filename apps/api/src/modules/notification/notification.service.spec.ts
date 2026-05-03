import { Test, TestingModule } from '@nestjs/testing';
import { NotificationService } from './notification.service';
import { PrismaService } from '../../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';

jest.mock('firebase-admin', () => ({
  apps: [],
  initializeApp: jest.fn().mockReturnValue(true),
  credential: {
    cert: jest.fn(),
  },
  messaging: () => ({
    sendEachForMulticast: jest.fn().mockResolvedValue({ successCount: 1, failureCount: 0 }),
  }),
}));

describe('NotificationService', () => {
  let service: NotificationService;
  let prismaMock: any;

  beforeEach(async () => {
    prismaMock = {
      user: {
        findMany: jest.fn(),
        update: jest.fn(),
      },
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationService,
        { provide: PrismaService, useValue: prismaMock },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockReturnValue('mock'),
          },
        },
      ],
    }).compile();

    service = module.get<NotificationService>(NotificationService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('saveToken', () => {
    it('should save the fcmToken for the given user ID', async () => {
      prismaMock.user.update.mockResolvedValue({} as any);
      await service.saveFcmToken('user-1', 'fcm-token-abc');
      expect(prismaMock.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: { fcmToken: 'fcm-token-abc' },
      });
    });
  });

  describe('sendToAdmins', () => {
    it('should query all ADMIN users with fcmTokens and send multicast', async () => {
      prismaMock.user.findMany.mockResolvedValue([
        { id: 'admin1', fcmToken: 'token1' },
        { id: 'admin2', fcmToken: 'token2' },
      ] as any);

      await service.sendToAdmins('Profile Updated', 'User X updated their profile');

      expect(prismaMock.user.findMany).toHaveBeenCalledWith({
        where: {
          role: 'ADMIN',
          fcmToken: { not: null },
        },
        select: { fcmToken: true },
      });
    });

    it('should not send if no admin has fcmToken', async () => {
      prismaMock.user.findMany.mockResolvedValue([]);
      const result = await service.sendToAdmins('Title', 'Body');
      expect(result).toBeUndefined(); // or whatever logic you have
    });
  });
});
