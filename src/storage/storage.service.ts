import { Injectable, OnModuleInit } from '@nestjs/common';
import * as Minio from 'minio';
import { ConfigService } from '@nestjs/config';
import { createHash } from 'crypto';
import { promises as fs } from 'fs';
import * as path from 'path';

@Injectable()
export class StorageService implements OnModuleInit {
    private client: Minio.Client;
    private bucket: string;

    constructor(private config: ConfigService) {
        this.client = new Minio.Client({
            endPoint: config.get('MINIO_ENDPOINT'),
            port: config.get('MINIO_PORT'),
            useSSL: false,
            accessKey: config.get('MINIO_ACCESS_KEY'),
            secretKey: config.get('MINIO_SECRET_KEY'),
        });
        this.bucket = config.get('MINIO_BUCKET') || 'models';
    }

    async onModuleInit() {
        const exists = await this.client.bucketExists(this.bucket);
        if (!exists) {
            await this.client.makeBucket(this.bucket, 'us-east-1');
        }
    }

    async uploadModel(file): Promise<string> {
        const hash = this.calculateHash(file.buffer);
        const ext = path.extname(file.originalname);
        const fileName = `${hash}${ext}`;

        await this.client.putObject(
            this.bucket,
            fileName,
            file.buffer,
            file.size,
            {
                'Content-Type': 'application/octet-stream',
                'X-Hash': hash,
            }
        );

        return fileName;
    }

    async getModelStream(fileName: string) {
        return this.client.getObject(this.bucket, fileName);
    }

    private calculateHash(buffer: Buffer): string {
        return createHash('sha256').update(buffer).digest('hex');
    }

    async getModelFile(fileName: string): Promise<Buffer> {
        return (await this.client.getObject(this.bucket, fileName)).read()
    }
}