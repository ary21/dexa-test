import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as admin from 'firebase-admin';
import { PrismaService } from '../../prisma/prisma.service';
import { UserRole } from '@prisma/client';

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);
  private firebaseApp: admin.app.App | null = null;

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {
    this.initFirebase();
  }

  private initFirebase() {
    try {
      const projectId = this.config.get<string>('FIREBASE_PROJECT_ID');
      const privateKey = this.config.get<string>('FIREBASE_PRIVATE_KEY')?.replace(/\\n/g, '\n');
      const clientEmail = this.config.get<string>('FIREBASE_CLIENT_EMAIL');

      if (!projectId || !privateKey || !clientEmail) {
        this.logger.warn('Firebase credentials not configured — notifications disabled');
        return;
      }

      this.firebaseApp = admin.initializeApp({
        credential: admin.credential.cert({ projectId, privateKey, clientEmail }),
      });
    } catch (err) {
      this.logger.warn(`Firebase init failed: ${err}`);
    }
  }

  // ─── FR-07: Send notification to all admins with FCM token ──
  async sendToAdmins(title: string, body: string): Promise<void> {
    if (!this.firebaseApp) return;

    const admins = await this.prisma.user.findMany({
      where: { role: UserRole.ADMIN, fcmToken: { not: null } },
      select: { fcmToken: true },
    });

    const tokens = admins.map((a) => a.fcmToken!).filter(Boolean);
    if (tokens.length === 0) return;

    try {
      await admin.messaging().sendEachForMulticast({
        tokens,
        notification: { title, body },
        webpush: { notification: { title, body, icon: '/icon.png' } },
      });
    } catch (err) {
      this.logger.error(`FCM send failed: ${err}`);
    }
  }

  // ─── Save FCM token for current user ────────────────────────
  async saveFcmToken(userId: string, token: string): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: { fcmToken: token },
    });
  }
}
