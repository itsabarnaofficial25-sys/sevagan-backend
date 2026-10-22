import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Technician, TechnicianStatus } from './entities/technician.entity';
import {
    ServiceRequest,
    ServiceRequestStatus,
} from '../jobs/entities/service-request.entity';
import { Rating } from '../jobs/entities/rating.entity';

@Injectable()
export class TechniciansService {
    constructor(
        @InjectRepository(Technician)
        private technicianRepository: Repository<Technician>,

        @InjectRepository(ServiceRequest)
        private serviceRequestRepository: Repository<ServiceRequest>,

        @InjectRepository(Rating)
        private ratingRepository: Repository<Rating>,
    ) {}

    async findByUserId(userId: string): Promise<Technician> {
        return this.technicianRepository.findOne({
            where: { userId },
            relations: ['user'],
        });
    }

    async findById(id: string): Promise<Technician> {
        const technician = await this.technicianRepository.findOne({
            where: { id },
            relations: ['user'],
        });

        if (!technician) {
            throw new NotFoundException('Technician not found');
        }

        return technician;
    }

    async create(
        userId: string,
        data: Partial<Technician>,
    ): Promise<Technician> {
        const technician = this.technicianRepository.create({
            ...data,
            userId,
            status: TechnicianStatus.PENDING,
        });

        return this.technicianRepository.save(technician);
    }

    async updateProfile(
        technicianId: string,
        data: Partial<Technician>,
    ): Promise<Technician> {
        await this.technicianRepository.update(technicianId, data);
        return this.findById(technicianId);
    }

    async updateLocation(
        technicianId: string,
        latitude: number,
        longitude: number,
    ): Promise<void> {
        await this.technicianRepository.update(technicianId, {
            latitude,
            longitude,
        });
    }

    async toggleOnlineStatus(
        technicianId: string,
        isOnline: boolean,
    ): Promise<Technician> {
        await this.technicianRepository.update(technicianId, {
            isOnline,
        });

        return this.findById(technicianId);
    }

    // ✅ NEW - Update FCM Token
    async updateFcmToken(
        technicianId: string,
        fcmToken: string,
    ): Promise<Technician> {
        await this.technicianRepository.update(technicianId, {
            fcmToken,
        });

        return this.findById(technicianId);
    }

    async findNearbyTechnicians(
        latitude: number,
        longitude: number,
        radiusKm: number,
        skills: string[],
    ): Promise<Technician[]> {
        const query = this.technicianRepository
            .createQueryBuilder('technician')
            .where('technician.isOnline = :isOnline', {
                isOnline: true,
            })
            .andWhere('technician.status = :status', {
                status: TechnicianStatus.APPROVED,
            })
            .andWhere('technician.skills && :skills', {
                skills,
            })
            .andWhere(
                `(6371 * acos(cos(radians(:lat)) * cos(radians(technician.latitude)) * cos(radians(technician.longitude) - radians(:lng)) + sin(radians(:lat)) * sin(radians(technician.latitude)))) <= :radius`,
                {
                    lat: latitude,
                    lng: longitude,
                    radius: radiusKm,
                },
            )
            .orderBy(
                `(6371 * acos(cos(radians(:lat)) * cos(radians(technician.latitude)) * cos(radians(technician.longitude) - radians(:lng)) + sin(radians(:lat)) * sin(radians(technician.latitude))))`,
            )
            .limit(10);

        return query.getMany();
    }

    async updateRating(
        technicianId: string,
        newRating: number,
    ): Promise<void> {
        const technician = await this.findById(technicianId);

        const totalRatings = technician.totalRatings + 1;

        const rating =
            (technician.rating * technician.totalRatings + newRating) /
            totalRatings;

        await this.technicianRepository.update(technicianId, {
            rating,
            totalRatings,
        });
    }

    async incrementCompletedJobs(
        technicianId: string,
    ): Promise<void> {
        await this.technicianRepository.increment(
            { id: technicianId },
            'completedJobs',
            1,
        );
    }

    async updateWalletBalance(
        technicianId: string,
        amount: number,
    ): Promise<void> {
        await this.technicianRepository.increment(
            { id: technicianId },
            'walletBalance',
            amount,
        );
    }

    async getEarnings(technicianId: string) {
        const technician = await this.findById(technicianId);

        const completedJobs =
            await this.serviceRequestRepository.find({
                where: {
                    technician: { id: technicianId },
                    status: ServiceRequestStatus.COMPLETED,
                },
                relations: ['serviceCategory', 'payment'],
            });

        let totalEarnings = 0;
        let totalCommission = 0;

        const jobsWithEarnings = completedJobs
            .filter(job => job.payment != null)
            .map(job => {
                const serviceCharge = job.finalPrice || 0;
                const commission =
                    job.payment?.commissionAmount || 0;

                totalEarnings += serviceCharge;
                totalCommission += commission;

                return {
                    id: job.id,
                    serviceCategory: job.serviceCategory,
                    description: job.description,
                    finalPrice: serviceCharge,
                    commission,
                };
            });

        return {
            walletBalance: technician.walletBalance,
            totalEarnings,
            totalCommission,
            netEarnings: totalEarnings - totalCommission,
            completedJobs: jobsWithEarnings,
        };
    }

    async getReviews(
        technicianId: string,
    ): Promise<Rating[]> {
        return this.ratingRepository.find({
            where: {
                technicianId,
            },
            relations: [
                'customer',
                'serviceRequest',
                'serviceRequest.serviceCategory',
            ],
            order: {
                createdAt: 'DESC',
            },
        });
    }
}