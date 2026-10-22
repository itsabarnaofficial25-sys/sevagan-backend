import {
    Injectable,
    NotFoundException,
    BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { ServiceRequest, ServiceRequestStatus } from './entities/service-request.entity';
import { Rating } from './entities/rating.entity';
import { JobMatchingService } from './job-matching.service';
import { ServicesService } from '../services/services.service';
import { TechniciansService } from '../technicians/technicians.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CustomersService } from '../customers/customers.service';  // ✅ ADD

@Injectable()
export class JobsService {
    constructor(
        @InjectRepository(ServiceRequest)
        private serviceRequestRepository: Repository<ServiceRequest>,
        @InjectRepository(Rating)
        private ratingRepository: Repository<Rating>,
        private jobMatchingService: JobMatchingService,
        private servicesService: ServicesService,
        private techniciansService: TechniciansService,
        private notificationsService: NotificationsService,
        private customersService: CustomersService,  // ✅ ADD
    ) { }

    async createServiceRequest(
        userId: string,
        data: Partial<ServiceRequest>,
    ): Promise<ServiceRequest> {
        // Don't fetch customer, use userId directly!
        const category = await this.servicesService.findById(data.serviceCategoryId);

        const serviceRequest = this.serviceRequestRepository.create({
            ...data,
            customerId: userId,  // ✅ Use userId directly (not customer.id)
            estimatedPrice: category.basePrice,
            status: ServiceRequestStatus.REQUESTED,
            schedulingStatus: data.preferredDateTime ? 'PENDING' : null,
        });

        const saved = await this.serviceRequestRepository.save(serviceRequest);

        // Find and notify nearby technicians
        await this.jobMatchingService.findAndNotifyTechnicians(
            saved.id,
            saved.locationLat,
            saved.locationLng,
            [category.name],
        );

        return saved;
    }

    async findById(id: string): Promise<ServiceRequest> {
        const request = await this.serviceRequestRepository.findOne({
            where: { id },
            relations: ['technician', 'serviceCategory'],  // ✅ Remove 'customer' from relations
        });

        if (!request) {
            throw new NotFoundException('Service request not found');
        }

        // ✅ Manually fetch customer data through user ID
        if (request.customerId) {
            try {
                const customer = await this.customersService.findByUserId(request.customerId);
                (request as any).customer = customer;
            } catch (e) {
                // Customer profile might not exist yet
                (request as any).customer = null;
            }
        }

        return request;
    }

    async getTechnicianLocation(jobId: string): Promise<{
        hasLocation: boolean;
        latitude?: number;
        longitude?: number;
        technicianName?: string;
        rating?: number;
        status: string;
    }> {
        const request = await this.serviceRequestRepository.findOne({
            where: { id: jobId },
            relations: ['technician'],
        });

        if (!request) {
            throw new NotFoundException('Service request not found');
        }

        const tech = request.technician;
        const hasLocation = !!(tech?.latitude && tech?.longitude);

        return {
            hasLocation,
            latitude: tech?.latitude ?? undefined,
            longitude: tech?.longitude ?? undefined,
            technicianName: tech?.name ?? 'Technician',
            rating: tech?.rating ?? 0,
            status: request.status,
        };
    }


    async findByCustomerId(customerId: string): Promise<ServiceRequest[]> {
        return this.serviceRequestRepository.find({
            where: { customerId },
            relations: ['technician', 'serviceCategory'],
            order: { createdAt: 'DESC' },
        });
    }
    async findByTechnicianId(technicianId: string): Promise<ServiceRequest[]> {
        const jobs = await this.serviceRequestRepository.find({
            where: { technicianId },
            relations: ['serviceCategory'],  // ✅ Remove 'customer'
            order: { createdAt: 'DESC' },
        });

        // ✅ Manually fetch customer data
        for (const job of jobs) {
            if (job.customerId) {
                try {
                    const customer = await this.customersService.findByUserId(job.customerId);
                    (job as any).customer = customer;
                } catch (e) {
                    (job as any).customer = null;
                }
            }
        }

        return jobs;
    }

    async findAll(): Promise<ServiceRequest[]> {
        const jobs = await this.serviceRequestRepository.find({
            relations: ['technician', 'serviceCategory'],  // ✅ Remove 'customer'
            order: { createdAt: 'DESC' },
        });

        // ✅ Manually fetch customer data
        for (const job of jobs) {
            if (job.customerId) {
                try {
                    const customer = await this.customersService.findByUserId(job.customerId);
                    (job as any).customer = customer;
                } catch (e) {
                    (job as any).customer = null;
                }
            }
        }

        return jobs;
    }

    async acceptJob(
        serviceRequestId: string,
        technicianId: string,
    ): Promise<ServiceRequest> {
        // Try to accept job using Redis lock
        const accepted = await this.jobMatchingService.acceptJob(
            serviceRequestId,
            technicianId,
        );

        if (!accepted) {
            throw new BadRequestException('Job already assigned to another technician');
        }

        // Generate Start Job OTP
        const startJobOtp = Math.floor(1000 + Math.random() * 9000).toString();

        // Update service request
        await this.serviceRequestRepository.update(serviceRequestId, {
            technicianId,
            status: ServiceRequestStatus.TECHNICIAN_ASSIGNED,
            assignedAt: new Date(),
            startJobOtp,
        });

        const request = await this.findById(serviceRequestId);

        // Notify customer
        await this.notificationsService.sendTechnicianAssigned(
            request.customerId,
            serviceRequestId,
            technicianId,
        );

        return request;
    }

    async rejectJob(
        serviceRequestId: string,
        technicianId: string,
    ): Promise<{ message: string }> {
        const request = await this.findById(serviceRequestId);

        // Validate that job is available
        if (request.status !== ServiceRequestStatus.REQUESTED) {
            throw new BadRequestException('Job is not available for rejection');
        }

        // Log the rejection (optional - could track which technicians rejected which jobs)
        console.log(`Technician ${technicianId} rejected job ${serviceRequestId}`);

        // For now, we just return success - the job stays available for other technicians
        // In the future, you could track rejections in a separate table
        return { message: 'Job rejected successfully' };
    }

    async startJob(
        serviceRequestId: string,
        technicianId: string,
        otp: string,
    ): Promise<ServiceRequest> {
        const request = await this.findById(serviceRequestId);

        if (request.technicianId !== technicianId) {
            throw new BadRequestException('Unauthorized');
        }

        if (request.status !== ServiceRequestStatus.TECHNICIAN_ASSIGNED) {
            throw new BadRequestException('Job cannot be started in current status');
        }

        if (request.startJobOtp !== otp) {
            throw new BadRequestException('Invalid OTP');
        }

        await this.serviceRequestRepository.update(serviceRequestId, {
            status: ServiceRequestStatus.JOB_STARTED,
            startedAt: new Date(),
        });

        // Notify customer
        await this.notificationsService.sendJobStarted(
            request.customerId,
            serviceRequestId,
        );

        return this.findById(serviceRequestId);
    }

    async completeJob(
        serviceRequestId: string,
        technicianId: string,
        finalPrice: number,
    ): Promise<ServiceRequest> {
        const request = await this.findById(serviceRequestId);

        if (request.technicianId !== technicianId) {
            throw new BadRequestException('Unauthorized');
        }

        await this.serviceRequestRepository.update(serviceRequestId, {
            status: ServiceRequestStatus.JOB_COMPLETED,
            completedAt: new Date(),
            finalPrice,
        });

        // Increment technician's completed jobs count
        await this.techniciansService.incrementCompletedJobs(technicianId);

        // Notify customer
        await this.notificationsService.sendJobCompleted(
            request.customerId,
            serviceRequestId,
        );

        return this.findById(serviceRequestId);
    }

    async cancelJob(
        serviceRequestId: string,
        userId: string,
        reason: string,
    ): Promise<ServiceRequest> {
        const request = await this.findById(serviceRequestId);

        if (request.customerId !== userId && request.technician?.userId !== userId) {
            throw new BadRequestException('Unauthorized');
        }

        await this.serviceRequestRepository.update(serviceRequestId, {
            status: ServiceRequestStatus.CANCELLED,
            cancelledAt: new Date(),
            cancellationReason: reason,
        });

        // Cancel job matching
        await this.jobMatchingService.cancelJobMatching(serviceRequestId);

        return this.findById(serviceRequestId);
    }

    async rateJob(
        serviceRequestId: string,
        customerId: string,
        rating: number,
        comment?: string,
    ): Promise<Rating> {
        const request = await this.findById(serviceRequestId);

        if (request.customerId !== customerId) {
            throw new BadRequestException('Unauthorized');
        }

        if (request.status !== ServiceRequestStatus.COMPLETED) {
            throw new BadRequestException('Can only rate completed jobs');
        }

        // Check if already rated
        const existingRating = await this.ratingRepository.findOne({
            where: { serviceRequestId, customerId },
        });

        if (existingRating) {
            throw new BadRequestException('Job already rated');
        }

        const newRating = this.ratingRepository.create({
            serviceRequestId,
            customerId,
            technicianId: request.technicianId,
            rating,
            comment,
        });

        await this.ratingRepository.save(newRating);

        // Update technician's average rating
        await this.techniciansService.updateRating(request.technicianId, rating);

        return newRating;
    }
    async markAsPaid(serviceRequestId: string): Promise<ServiceRequest> {
        await this.serviceRequestRepository.update(serviceRequestId, {
            status: ServiceRequestStatus.COMPLETED,
        });

        return this.findById(serviceRequestId);
    }

    async findAvailableJobs(): Promise<ServiceRequest[]> {
        const jobs = await this.serviceRequestRepository.find({
            where: {
                status: ServiceRequestStatus.REQUESTED,
                technicianId: IsNull(),
            },
            relations: ['serviceCategory'],  // ✅ Remove 'customer' from relations
            order: { createdAt: 'DESC' },
        });

        // ✅ Manually fetch customer data for each job
        for (const job of jobs) {
            if (job.customerId) {
                try {
                    const customer = await this.customersService.findByUserId(job.customerId);
                    (job as any).customer = customer;
                } catch (e) {
                    (job as any).customer = null;
                }
            }
        }

        return jobs;
    }

    async acceptScheduledTime(
        serviceRequestId: string,
        technicianId: string,
    ): Promise<ServiceRequest> {
        const request = await this.findById(serviceRequestId);

        if (request.technicianId !== technicianId) {
            throw new BadRequestException('Not authorized for this job');
        }

        await this.serviceRequestRepository.update(serviceRequestId, {
            schedulingStatus: 'ACCEPTED',
        });

        return this.findById(serviceRequestId);
    }

    async proposeAlternativeTime(
        serviceRequestId: string,
        technicianId: string,
        proposedDateTime: Date,
        note?: string,
    ): Promise<ServiceRequest> {
        const request = await this.findById(serviceRequestId);

        if (request.technicianId !== technicianId) {
            throw new BadRequestException('Not authorized for this job');
        }

        // Validate proposed time is in future
        if (new Date(proposedDateTime) <= new Date()) {
            throw new BadRequestException('Proposed time must be in the future');
        }

        await this.serviceRequestRepository.update(serviceRequestId, {
            proposedDateTime: new Date(proposedDateTime),
            schedulingStatus: 'PROPOSED',
            schedulingNote: note,
        });

        return this.findById(serviceRequestId);
    }

    async confirmProposedTime(
        serviceRequestId: string,
        customerId: string,
    ): Promise<ServiceRequest> {
        const request = await this.findById(serviceRequestId);

        if (request.customerId !== customerId) {
            throw new BadRequestException('Not authorized for this job');
        }

        if (request.schedulingStatus !== 'PROPOSED') {
            throw new BadRequestException('No proposed time to confirm');
        }

        await this.serviceRequestRepository.update(serviceRequestId, {
            schedulingStatus: 'CONFIRMED',
            preferredDateTime: request.proposedDateTime,
        });

        return this.findById(serviceRequestId);
    }
}
