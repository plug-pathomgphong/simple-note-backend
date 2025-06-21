import {
  DeleteObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { Injectable } from '@nestjs/common';

@Injectable()
export class S3Service {
  private s3: S3Client;
  private bucketName: string;

  constructor() {
    this.bucketName = process.env.S3_BUCKET_NAME as string;
    if (!this.bucketName) {
      throw new Error('S3_BUCKET_NAME environment variable is not set');
    }

    const region = process.env.S3_REGION || 'us-east-1';
    if (!region) {
      throw new Error('S3_REGION environment variable is not set');
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
    const uploadParams = {
      Bucket: this.bucketName,
      Key: key,
      Body: buffer,
      ContentType: contentType,
    };

    const response = await this.s3.send(new PutObjectCommand(uploadParams));
    if (response.$metadata.httpStatusCode !== 200) {
      throw new Error('Failed to upload file to S3');
    }

    return `https://${this.bucketName}.s3.${process.env.S3_REGION}.amazonaws.com/${key}`;
  }

  async deleteFile(fileName: string): Promise<void> {
    const deleteParams = {
      Bucket: this.bucketName,
      Key: fileName,
    };

    const response = await this.s3.send(new DeleteObjectCommand(deleteParams));
    if (response.$metadata.httpStatusCode !== 204) {
      throw new Error('Failed to delete file from S3');
    }
  }
}
