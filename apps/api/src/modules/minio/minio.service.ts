import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as Minio from 'minio';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class MinioService implements OnModuleInit {
  private readonly logger = new Logger(MinioService.name);
  private client: Minio.Client;
  private bucket: string;

  constructor(private readonly config: ConfigService) {
    this.bucket = config.get<string>('MINIO_BUCKET', 'attendance-photos');
    this.client = new Minio.Client({
      endPoint: config.get<string>('MINIO_ENDPOINT', 'localhost'),
      port: config.get<number>('MINIO_PORT', 9000),
      useSSL: config.get<string>('MINIO_USE_SSL', 'false') === 'true',
      accessKey: config.get<string>('MINIO_ACCESS_KEY', 'minioadmin'),
      secretKey: config.get<string>('MINIO_SECRET_KEY', 'minioadmin'),
    });
  }

  async onModuleInit() {
    await this.ensureBucketExists();
  }

  private async ensureBucketExists() {
    try {
      const exists = await this.client.bucketExists(this.bucket);
      if (!exists) {
        await this.client.makeBucket(this.bucket);
        this.logger.log(`Bucket "${this.bucket}" created`);
      }
    } catch (err) {
      this.logger.warn(`MinIO bucket check failed: ${err}`);
    }
  }

  async getPresignedPutUrl(
    filename: string,
    _contentType: string,
  ): Promise<{ uploadUrl: string; fileUrl: string }> {
    const ext = filename.split('.').pop();
    const objectName = `profiles/${uuidv4()}.${ext}`;

    const uploadUrl = await this.client.presignedPutObject(this.bucket, objectName, 60 * 5); // 5 min

    const endpoint = this.config.get<string>('MINIO_ENDPOINT', 'localhost');
    const port = this.config.get<number>('MINIO_PORT', 9000);
    const ssl = this.config.get<string>('MINIO_USE_SSL', 'false') === 'true';
    const protocol = ssl ? 'https' : 'http';

    const fileUrl = `${protocol}://${endpoint}:${port}/${this.bucket}/${objectName}`;

    return { uploadUrl, fileUrl };
  }
}
