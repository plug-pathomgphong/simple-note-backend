import { Test, TestingModule } from '@nestjs/testing';
import { S3Service } from './s3.service';
import { DeleteObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';

jest.mock('@aws-sdk/client-s3', () => {
  const originalModule = jest.requireActual('@aws-sdk/client-s3');
  return {
    ...originalModule,
    S3Client: jest.fn().mockImplementation(() => ({
      send: jest.fn(),
    })),
  };
});

describe('S3Service', () => {
  let service: S3Service;
  let mockSend: jest.Mock;
  const OLD_ENV = process.env;

  beforeEach(async () => {
    jest.resetModules();
    process.env = {
      ...OLD_ENV,
      S3_BUCKET_NAME: 'test-bucket',
      S3_REGION: 'us-east-1',
      S3_ACCESS_KEY_ID: 'test-access-key',
      S3_SECRET_ACCESS_KEY: 'test-secret-key',
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [S3Service],
    }).compile();

    service = module.get<S3Service>(S3Service);
    mockSend = service['s3'].send as jest.Mock;
  });

  afterAll(() => {
    process.env = OLD_ENV;
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('uploadFile', () => {
    it('should upload file and return URL', async () => {
      mockSend.mockResolvedValueOnce({
        $metadata: { httpStatusCode: 200 },
      });

      const buffer = Buffer.from('test file');
      const key = 'uploads/test.txt';
      const contentType = 'text/plain';

      const url = await service.uploadFile(buffer, key, contentType);

      expect(mockSend).toHaveBeenCalledWith(expect.any(PutObjectCommand));
      expect(url).toContain(
        'https://test-bucket.s3.us-east-1.amazonaws.com/uploads/test.txt',
      );
    });

    it('should throw error when upload fails', async () => {
      mockSend.mockResolvedValueOnce({
        $metadata: { httpStatusCode: 500 },
      });

      const buffer = Buffer.from('fail file');
      const key = 'fail/test.txt';
      const contentType = 'text/plain';

      await expect(
        service.uploadFile(buffer, key, contentType),
      ).rejects.toThrow('Failed to upload file to S3');
    });
  });

  describe('deleteFile', () => {
    it('should delete file successfully', async () => {
      mockSend.mockResolvedValueOnce({
        $metadata: { httpStatusCode: 204 },
      });

      await expect(
        service.deleteFile('uploads/test.txt'),
      ).resolves.not.toThrow();
      expect(mockSend).toHaveBeenCalledWith(expect.any(DeleteObjectCommand));
    });

    it('should throw error when delete fails', async () => {
      mockSend.mockResolvedValueOnce({
        $metadata: { httpStatusCode: 400 },
      });

      await expect(service.deleteFile('uploads/fail.txt')).rejects.toThrow(
        'Failed to delete file from S3',
      );
    });
  });
});
