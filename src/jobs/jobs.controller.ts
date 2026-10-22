import {
    Controller,
    Get,
    Post,
    Put,
    Body,
    Param,
    UseGuards,
    UseInterceptors,
    UploadedFiles,
    NotFoundException,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JobsService } from './jobs.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { GetUser } from '../common/decorators/get-user.decorator';
import { User, UserRole } from '../users/entities/user.entity';
import { UploadService } from '../upload/upload.service';
import { TechniciansService } from '../technicians/technicians.service';


@ApiTags('jobs')
@Controller('jobs')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class JobsController {
    constructor(
        private jobsService: JobsService,
        private uploadService: UploadService,
        private techniciansService: TechniciansService,
    ) { }

    @Post()
    @Roles(UserRole.CUSTOMER)
    @UseInterceptors(FilesInterceptor('images', 3))
    @ApiOperation({ summary: 'Create service request' })
    async createServiceRequest(
        @GetUser() user: User,
        @Body() data: any,
        @UploadedFiles() images: any[],  // ✅ Simple fix
    ) {
        let imageUrls: string[] = [];
        if (images && images.length > 0) {
            imageUrls = await this.uploadService.uploadMultipleFiles(images, 'service-requests');
        }

        return this.jobsService.createServiceRequest(user.id, {
            ...data,
            imageUrls,
        });
    }

    @Get('my-requests')
    @Roles(UserRole.CUSTOMER)
    @ApiOperation({ summary: 'Get customer service requests' })
    async getMyRequests(@GetUser() user: User) {
        return this.jobsService.findByCustomerId(user.id);
    }

    @Get('my-jobs')
    @Roles(UserRole.TECHNICIAN)
    @ApiOperation({ summary: 'Get technician jobs' })
    async getMyJobs(@GetUser() user: User) {
        const technician = await this.techniciansService.findByUserId(user.id);
        return this.jobsService.findByTechnicianId(technician.id);
    }

    @Get('available')
    @Roles(UserRole.TECHNICIAN)
    @ApiOperation({ summary: 'Get available jobs for technicians' })
    async getAvailableJobs() {
        return this.jobsService.findAvailableJobs();
    }

    @Get()
    @Roles(UserRole.ADMIN)
    @ApiOperation({ summary: 'Get all jobs (Admin only)' })
    async getAllJobs() {
        return this.jobsService.findAll();
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get service request details' })
    async getServiceRequest(@Param('id') id: string) {
        return this.jobsService.findById(id);
    }

    @Get(':id/technician-location')
    @ApiOperation({ summary: 'Get technician live location for a job' })
    async getTechnicianLocation(@Param('id') id: string) {
        return this.jobsService.getTechnicianLocation(id);
    }

    @Post(':id/accept')
    @Roles(UserRole.TECHNICIAN)
    @ApiOperation({ summary: 'Accept service request' })
    async acceptJob(@Param('id') id: string, @GetUser() user: User) {
        const technician = await this.techniciansService.findByUserId(user.id);
        if (!technician) {
            throw new NotFoundException('Technician profile not found');
        }
        return this.jobsService.acceptJob(id, technician.id);
    }

    @Post(':id/reject')
    @Roles(UserRole.TECHNICIAN)
    @ApiOperation({ summary: 'Reject service request' })
    async rejectJob(@Param('id') id: string, @GetUser() user: User) {
        const technician = await this.techniciansService.findByUserId(user.id);
        if (!technician) {
            throw new NotFoundException('Technician profile not found');
        }
        return this.jobsService.rejectJob(id, technician.id);
    }

    @Post(':id/start')
    @Roles(UserRole.TECHNICIAN)
    @ApiOperation({ summary: 'Start job with OTP' })
    async startJob(
        @Param('id') id: string,
        @GetUser() user: User,
        @Body() data: { otp: string },
    ) {
        const technician = await this.techniciansService.findByUserId(user.id);
        return this.jobsService.startJob(id, technician.id, data.otp);
    }

    @Post(':id/complete')
    @Roles(UserRole.TECHNICIAN)
    @ApiOperation({ summary: 'Complete job' })
    async completeJob(
        @Param('id') id: string,
        @GetUser() user: User,
        @Body() data: { finalPrice: number },
    ) {
        const technician = await this.techniciansService.findByUserId(user.id);
        return this.jobsService.completeJob(id, technician.id, data.finalPrice);
    }

    @Post(':id/cancel')
    @ApiOperation({ summary: 'Cancel service request' })
    async cancelJob(
        @Param('id') id: string,
        @GetUser() user: User,
        @Body() data: { reason: string },
    ) {
        return this.jobsService.cancelJob(id, user.id, data.reason);
    }

    @Post(':id/rate')
    @Roles(UserRole.CUSTOMER)
    @ApiOperation({ summary: 'Rate completed job' })
    async rateJob(
        @Param('id') id: string,
        @GetUser() user: User,
        @Body() data: { rating: number; comment?: string },
    ) {
        return this.jobsService.rateJob(id, user.id, data.rating, data.comment);
    }

    @Post(':id/accept-time')
    @Roles(UserRole.TECHNICIAN)
    @ApiOperation({ summary: 'Accept customer preferred time' })
    async acceptScheduledTime(@Param('id') id: string, @GetUser() user: User) {
        const technician = await this.techniciansService.findByUserId(user.id);
        return this.jobsService.acceptScheduledTime(id, technician.id);
    }

    @Post(':id/propose-time')
    @Roles(UserRole.TECHNICIAN)
    @ApiOperation({ summary: 'Propose alternative time' })
    async proposeAlternativeTime(
        @Param('id') id: string,
        @GetUser() user: User,
        @Body() data: { proposedDateTime: string; note?: string },
    ) {
        const technician = await this.techniciansService.findByUserId(user.id);
        return this.jobsService.proposeAlternativeTime(
            id,
            technician.id,
            new Date(data.proposedDateTime),
            data.note,
        );
    }

    @Post(':id/confirm-time')
    @Roles(UserRole.CUSTOMER)
    @ApiOperation({ summary: 'Confirm proposed time' })
    async confirmProposedTime(@Param('id') id: string, @GetUser() user: User) {
        return this.jobsService.confirmProposedTime(id, user.id);
    }
}
