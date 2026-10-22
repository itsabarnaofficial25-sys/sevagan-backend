import {
    Controller,
    Get,
    Post,
    Put,
    Body,
    UseGuards,
    UseInterceptors,
    UploadedFile,
    NotFoundException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { TechniciansService } from './technicians.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';  // ✅ CHANGED
import { RolesGuard } from '../common/guards/roles.guard';  // ✅ KEPT
import { Roles } from '../common/decorators/roles.decorator';
import { GetUser } from '../common/decorators/get-user.decorator';
import { User, UserRole } from '../users/entities/user.entity';
import { UploadService } from '../upload/upload.service';

@ApiTags('technicians')
@Controller('technicians')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class TechniciansController {
    constructor(
        private techniciansService: TechniciansService,
        private uploadService: UploadService,
    ) { }

    @Get('profile')
    @Roles(UserRole.TECHNICIAN)
    @ApiOperation({ summary: 'Get technician profile' })
    async getProfile(@GetUser() user: User) {

        const profile = await this.techniciansService.findByUserId(user.id);

        // Profile exists but setup not completed
        if (
            !profile ||
            !profile.name ||
            !profile.skills ||
            profile.skills.length === 0
        ) {
            throw new NotFoundException(
                'Technician profile not completed'
            );
        }

        return profile;
    }
    
    @Post('update-fcm-token')
    @Roles(UserRole.TECHNICIAN)
    @ApiOperation({ summary: 'Update Technician FCM Token' })
    async updateFcmToken(
        @GetUser() user: User,
        @Body() data: { fcmToken: string },
    ) {
        const technician = await this.techniciansService.findByUserId(user.id);

        return this.techniciansService.updateFcmToken(
            technician.id,
            data.fcmToken,
        );
    }

    @Post('profile')
    @Roles(UserRole.TECHNICIAN)
    @ApiOperation({ summary: 'Create or Complete technician profile' })
    async createProfile(@GetUser() user: User, @Body() data: any) {

        const technician = await this.techniciansService.findByUserId(user.id);

        if (technician) {
            return this.techniciansService.updateProfile(
                technician.id,
                data,
            );
        }

        return this.techniciansService.create(user.id, data);
    }
    @Put('profile')
    @Roles(UserRole.TECHNICIAN)
    @ApiOperation({ summary: 'Update technician profile' })
    async updateProfile(@GetUser() user: User, @Body() data: any) {
        const technician = await this.techniciansService.findByUserId(user.id);
        return this.techniciansService.updateProfile(technician.id, data);
    }

    @Post('upload-aadhaar')
    @Roles(UserRole.TECHNICIAN)
    @UseInterceptors(FileInterceptor('file'))
    @ApiOperation({ summary: 'Upload Aadhaar document' })
    async uploadAadhaar(
        @GetUser() user: User,
        @UploadedFile() file: Express.Multer.File,
    ) {
        const url = await this.uploadService.uploadFile(file, 'documents');
        const technician = await this.techniciansService.findByUserId(user.id);
        await this.techniciansService.updateProfile(technician.id, {
            aadhaarImageUrl: url,
        });
        return { url };
    }

    @Post('toggle-online')
    @Roles(UserRole.TECHNICIAN)
    @ApiOperation({ summary: 'Toggle online/offline status' })
    async toggleOnline(@GetUser() user: User, @Body() data: { isOnline: boolean }) {
        const technician = await this.techniciansService.findByUserId(user.id);
        return this.techniciansService.toggleOnlineStatus(
            technician.id,
            data.isOnline,
        );
    }

    @Get('earnings')
    @Roles(UserRole.TECHNICIAN)
    @ApiOperation({ summary: 'Get technician earnings and wallet balance' })
    async getEarnings(@GetUser() user: User) {
        const technician = await this.techniciansService.findByUserId(user.id);
        return this.techniciansService.getEarnings(technician.id);
    }

    @Post('update-location')
    @Roles(UserRole.TECHNICIAN)
    @ApiOperation({ summary: 'Update current location' })
    async updateLocation(
        @GetUser() user: User,
        @Body() data: { latitude: number; longitude: number },
    ) {
        const technician = await this.techniciansService.findByUserId(user.id);
        await this.techniciansService.updateLocation(
            technician.id,
            data.latitude,
            data.longitude,
        );
        return { message: 'Location updated successfully' };
    }

    @Get('reviews')
    @Roles(UserRole.TECHNICIAN)
    @ApiOperation({ summary: 'Get technician reviews' })
    async getReviews(@GetUser() user: User) {
        const technician = await this.techniciansService.findByUserId(user.id);
        return this.techniciansService.getReviews(technician.id);
    }
}