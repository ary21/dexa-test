import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { MinioService } from './minio.service';
import * as Minio from 'minio';

jest.mock('minio');
jest.mock('uuid', () => ({ v4: () => '1234-5678' }));

describe('MinioService', () => {
  let service: MinioService;
  let clientMock: jest.Mocked<Minio.Client>;

  beforeEach(async () => {
    clientMock = {
      bucketExists: jest.fn(),
      makeBucket: jest.fn(),
      presignedPutObject: jest.fn(),
    } as any;

    (Minio.Client as jest.Mock).mockImplementation(() => clientMock);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MinioService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockImplementation((key: string, defaultVal: any) => {
              const mocks: Record<string, any> = {
                MINIO_BUCKET: 'test-bucket',
                MINIO_ENDPOINT: 'localhost',
                MINIO_PORT: 9000,
                MINIO_USE_SSL: 'false',
              };
              return mocks[key] !== undefined ? mocks[key] : defaultVal;
            }),
          },
        },
      ],
    }).compile();

    service = module.get<MinioService>(MinioService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('onModuleInit', () => {
    it('should create bucket if it does not exist', async () => {
      clientMock.bucketExists.mockResolvedValue(false);
      await service.onModuleInit();
      expect(clientMock.bucketExists).toHaveBeenCalledWith('test-bucket');
      expect(clientMock.makeBucket).toHaveBeenCalledWith('test-bucket');
    });

    it('should not create bucket if it exists', async () => {
      clientMock.bucketExists.mockResolvedValue(true);
      await service.onModuleInit();
      expect(clientMock.makeBucket).not.toHaveBeenCalled();
    });
  });

  describe('getPresignedPutUrl', () => {
    it('should return uploadUrl and fileUrl', async () => {
      clientMock.presignedPutObject.mockResolvedValue('http://presigned-url');
      const result = await service.getPresignedPutUrl('photo.jpg', 'image/jpeg');

      expect(clientMock.presignedPutObject).toHaveBeenCalledWith(
        'test-bucket',
        'profiles/1234-5678.jpg',
        300,
      );

      expect(result).toEqual({
        uploadUrl: 'http://presigned-url',
        fileUrl: 'http://localhost:9000/test-bucket/profiles/1234-5678.jpg',
      });
    });
  });
});
