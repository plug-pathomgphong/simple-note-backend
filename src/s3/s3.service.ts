import {
  DeleteObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { Injectable, Logger } from '@nestjs/common';
import {
  S3ConfigurationException,
  S3UploadException,
  S3DeleteException,
} from '../common/exceptions';

@Injectable()
export class S3Service {
  private s3: S3Client;
  private bucketName: string;
  private readonly logger = new Logger(S3Service.name);

  constructor() {
    this.bucketName = process.env.S3_BUCKET_NAME as string;
    if (!this.bucketName) {
      throw new S3ConfigurationException(
        'S3_BUCKET_NAME environment variable is not set',
      );
    }

    const region = process.env.S3_REGION || 'us-east-1';
    if (!region) {
      throw new S3ConfigurationException(
        'S3_REGION environment variable is not set',
      );
    }

    this.s3 = new S3Client({
      region,
      credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || '',
      },
    });
  }

  async uploadFile(
    buffer: Buffer,
    key: string,
    contentType: string,
  ): Promise<string> {
    try {
      const uploadParams = {
        Bucket: this.bucketName,
        Key: key,
        Body: buffer,
        ContentType: contentType,
      };

      const response = await this.s3.send(new PutObjectCommand(uploadParams));
      if (response.$metadata.httpStatusCode !== 200) {
        throw new S3UploadException(
          new Error('S3 response status not 200'),
          key,
        );
      }

      return `https://${this.bucketName}.s3.${process.env.S3_REGION}.amazonaws.com/${key}`;
    } catch (error) {
      this.logger.error(
        `S3 Upload Error: ${(error as Error).message}`,
        (error as Error).stack,
      );
      if (error instanceof S3UploadException) {
        throw error;
      }
      throw new S3UploadException(error as Error, key);
    }
  }

  async deleteFile(fileName: string): Promise<void> {
    try {
      const deleteParams = {
        Bucket: this.bucketName,
        Key: fileName,
      };

      const response = await this.s3.send(
        new DeleteObjectCommand(deleteParams),
      );
      if (response.$metadata.httpStatusCode !== 204) {
        throw new S3DeleteException(
          new Error('S3 response status not 204'),
          fileName,
        );
      }
    } catch (error) {
      this.logger.error(
        `S3 Delete Error: ${(error as Error).message}`,
        (error as Error).stack,
      );
      if (error instanceof S3DeleteException) {
        throw error;
      }
      throw new S3DeleteException(error as Error, fileName);
    }
  }
}
