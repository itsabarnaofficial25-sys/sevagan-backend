import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class UploadService {
    private s3Client: S3Client;
    private bucketName: string;

    constructor(private configService: ConfigService) {
        // Only initialize S3 if AWS credentials are provided
        const accessKeyId = this.configService.get('AWS_S3_ACCESS_KEY_ID');
        const secretAccessKey = this.configService.get('AWS_S3_SECRET_ACCESS_KEY');
        const region = this.configService.get('AWS_S3_REGION');
        this.bucketName = this.configService.get('AWS_S3_BUCKET_NAME');

        if (accessKeyId && secretAccessKey && accessKeyId !== 'your_aws_access_key') {
            this.s3Client = new S3Client({
                region: region,
                credentials: {
                    accessKeyId: accessKeyId,
                    secretAccessKey: secretAccessKey,
                },
            });
        }
    }

    async uploadFile(
        file: Express.Multer.File,
        folder: string = 'uploads',
    ): Promise<string> {
        // Mock upload for development (no AWS credentials)
        const accessKey = this.configService.get('AWS_S3_ACCESS_KEY_ID');

        if (!accessKey ||
            accessKey === 'your_aws_access_key' ||
            accessKey.includes('test') ||
            accessKey.includes('mock') ||
            !this.s3Client) {

            console.log(`[Upload] Mocking upload for ${file.originalname}`);
            return `https://via.placeholder.com/300?text=${encodeURIComponent(file.originalname)}`;
        }

        try {
            const key = `${folder}/${uuidv4()}-${file.originalname}`;

            // Get file buffer (works with memoryStorage)
            const fileBuffer = file.buffer || Buffer.from(file.path || '');

            const command = new PutObjectCommand({
                Bucket: this.bucketName,
                Key: key,
                Body: fileBuffer,
                ContentType: file.mimetype,
                ACL: 'public-read',
            });

            await this.s3Client.send(command);

            // ✅ FIXED: Correct template literal syntax
            const region = this.configService.get('AWS_S3_REGION');
            return `https://${this.bucketName}.s3.${region}.amazonaws.com/${key}`;

        } catch (error) {
            // ✅ FIXED: Safely handle error message
            const errorMessage = error instanceof Error ? error.message : String(error);
            console.error(`[Upload] Error uploading to S3: ${errorMessage}`);
            // Fallback to mock upload on error
            return `https://via.placeholder.com/300?text=${encodeURIComponent(file.originalname)}`;
        }
    }

    async uploadMultipleFiles(
        files: Express.Multer.File[],
        folder: string = 'uploads',
    ): Promise<string[]> {
        const uploadPromises = files.map((file) => this.uploadFile(file, folder));
        return Promise.all(uploadPromises);
    }
}