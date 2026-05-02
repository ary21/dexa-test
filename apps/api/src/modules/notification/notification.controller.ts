import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User } from '@prisma/client';
import { IsString } from 'class-validator';

class SaveFcmTokenDto {
  @IsString()
  token: string;
}

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Post('fcm-token')
  async saveFcmToken(@CurrentUser() user: User, @Body() dto: SaveFcmTokenDto) {
    await this.notificationService.saveFcmToken(user.id, dto.token);
    return { message: 'FCM token registered' };
  }
}
