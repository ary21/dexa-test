import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { MinioService } from './minio.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

import { ApiTags } from '@nestjs/swagger';
import { ApiDocsMinioGetUploadUrl } from './minio.swagger';

@ApiTags('uploads')
@Controller('employees/me')
@UseGuards(JwtAuthGuard)
export class MinioController {
  constructor(private readonly minioService: MinioService) {}

  @Get('upload-url')
  @ApiDocsMinioGetUploadUrl()
  async getUploadUrl(
    @Query('filename') filename: string,
    @Query('contentType') contentType: string,
  ) {
    return this.minioService.getPresignedPutUrl(filename, contentType);
  }
}
