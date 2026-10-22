import { Controller, Post, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { UploadService } from './upload.service';

@Controller('upload')
export class UploadController {
    constructor(private uploadService: UploadService) {}

    @Post('file')
    @UseInterceptors(FileInterceptor('file', {
        storage: memoryStorage(), // ✅ Required for file.buffer to exist
    }))
    async uploadFile(@UploadedFile() file: Express.Multer.File) {
        return this.uploadService.uploadFile(file);
    }

    @Post('multiple')
    @UseInterceptors(FileInterceptor('files', {
        storage: memoryStorage(),
    }))
    async uploadMultipleFiles(@UploadedFile() files: Express.Multer.File[]) {
        return this.uploadService.uploadMultipleFiles(files);
    }
}