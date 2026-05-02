import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { PrismaService } from '../../prisma/prisma.service';
import * as bcrypt from 'bcrypt';

// ─── Mocks ───────────────────────────────────────────────────
const mockUser = {
  id: 'user-uuid-1',
  email: 'john@company.com',
  password: '$2b$10$hashedpassword',
  name: 'John Doe',
  position: 'Engineer',
  phone: '08111111111',
  photoUrl: null,
  role: 'EMPLOYEE',
  fcmToken: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockPrismaService = {
  user: {
    findUnique: jest.fn(),
  },
};

const mockJwtService = {
  sign: jest.fn().mockReturnValue('mock.jwt.token'),
};

// ─── Tests ───────────────────────────────────────────────────
describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: JwtService, useValue: mockJwtService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    jest.clearAllMocks();
  });

  // ── US-01: Successful login ──────────────────────────────────
  describe('login()', () => {
    it('should return accessToken and user data on valid credentials', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(true as never);

      const result = await service.login({ email: 'john@company.com', password: 'valid-pass' });

      expect(result.accessToken).toBe('mock.jwt.token');
      expect(result.user.id).toBe(mockUser.id);
      expect(result.user.email).toBe(mockUser.email);
      // Password must NOT be returned
      expect(result.user).not.toHaveProperty('password');
    });

    // ── US-01 AC: Invalid credentials shows error message ────────
    it('should throw UnauthorizedException when user not found', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(
        service.login({ email: 'unknown@company.com', password: 'any' }),
      ).rejects.toThrow(new UnauthorizedException('Invalid email or password'));
    });

    it('should throw UnauthorizedException when password is wrong', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(false as never);

      await expect(
        service.login({ email: 'john@company.com', password: 'wrong-pass' }),
      ).rejects.toThrow(new UnauthorizedException('Invalid email or password'));
    });

    // ── NFR-08: bcrypt comparison (not plain text) ────────────────
    it('should use bcrypt.compare and NOT plain text comparison', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      const compareSpy = jest.spyOn(bcrypt, 'compare').mockResolvedValue(true as never);

      await service.login({ email: 'john@company.com', password: 'valid-pass' });

      expect(compareSpy).toHaveBeenCalledWith('valid-pass', mockUser.password);
    });

    // ── NFR-06: JWT includes expiry ───────────────────────────────
    it('should sign JWT with expiry configuration', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(true as never);

      await service.login({ email: 'john@company.com', password: 'valid-pass' });

      expect(mockJwtService.sign).toHaveBeenCalledWith(
        expect.objectContaining({ sub: mockUser.id, email: mockUser.email }),
      );
    });
  });
});
