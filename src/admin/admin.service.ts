import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole } from '../users/entities/user.entity';
import { ServiceRequest, ServiceRequestStatus } from '../jobs/entities/service-request.entity';
import { Technician, TechnicianStatus } from '../technicians/entities/technician.entity';
import { Payment, PaymentStatus } from '../payments/entities/payment.entity';
import { Customer } from '../customers/entities/customer.entity';
import { ServicesService } from '../services/services.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AdminService {
    constructor(
        @InjectRepository(User)
        private userRepository: Repository<User>,
        @InjectRepository(ServiceRequest)
        private serviceRequestRepository: Repository<ServiceRequest>,
        @InjectRepository(Technician)
        private technicianRepository: Repository<Technician>,
        @InjectRepository(Payment)
        private paymentRepository: Repository<Payment>,
        private servicesService: ServicesService,
    ) { }

    // ==================== ADMIN AUTHENTICATION ====================

    async adminLogin(email: string, password: string) {
        console.log('AdminService.login called:', email);

        // ✅ Add select to explicitly include password column
        const admin = await this.userRepository.findOne({
            where: { email: email, role: UserRole.ADMIN },
            select: ['id', 'email', 'name', 'role', 'password']  // ← ADD THIS LINE
        });

        console.log('Admin found:', admin ? 'Yes' : 'No');
        console.log('Stored password:', admin?.password);  // ← This will now show the password

        if (!admin) {
            throw new UnauthorizedException('Invalid credentials');
        }

     const isPasswordValid = await bcrypt.compare(password, admin.password);

if (!isPasswordValid) {
    console.log('Password mismatch');
    throw new UnauthorizedException('Invalid credentials');
}

        console.log('✅ Login successful!');
        return admin;
    }

    // ==================== DASHBOARD STATS ====================

    async getDashboardStats() {
        const totalUsers = await this.userRepository.count();
        const totalCustomers = await this.userRepository.count({ where: { role: UserRole.CUSTOMER } });
        const totalTechnicians = await this.technicianRepository.count();
        const pendingTechnicians = await this.technicianRepository.count({ where: { status: TechnicianStatus.PENDING } });

        const totalJobs = await this.serviceRequestRepository.count();
        const completedJobs = await this.serviceRequestRepository.count({ where: { status: ServiceRequestStatus.COMPLETED } });

        const totalRevenueResult = await this.paymentRepository
            .createQueryBuilder('payment')
            .select('SUM(payment.amount)', 'sum')
            .where('payment.status = :status', { status: PaymentStatus.COMPLETED })
            .getRawOne();

        const totalRevenue = totalRevenueResult ? parseFloat(totalRevenueResult.sum) || 0 : 0;

        return {
            users: {
                total: totalUsers,
                customers: totalCustomers,
                technicians: totalTechnicians,
                pendingTechnicians,
            },
            jobs: {
                total: totalJobs,
                completed: completedJobs,
            },
            revenue: {
                total: totalRevenue,
            },
        };
    }

    // ==================== TECHNICIAN MANAGEMENT ====================

    async approveTechnician(technicianId: string) {
        const technician = await this.technicianRepository.findOne({ where: { id: technicianId } });
        if (!technician) {
            throw new NotFoundException('Technician not found');
        }

        technician.status = TechnicianStatus.APPROVED;
        return this.technicianRepository.save(technician);
    }

    async rejectTechnician(technicianId: string) {
        const technician = await this.technicianRepository.findOne({ where: { id: technicianId } });
        if (!technician) {
            throw new NotFoundException('Technician not found');
        }

        technician.status = TechnicianStatus.REJECTED;
        return this.technicianRepository.save(technician);
    }

    async getAllTechnicians(status?: string) {
        const where = status ? { status: status as TechnicianStatus } : {};
        return this.technicianRepository.find({
            where,
            relations: ['user'],
            order: { createdAt: 'DESC' },
        });
    }

    async getPendingTechnicians() {
        return this.technicianRepository.find({
            where: { status: TechnicianStatus.PENDING },
            relations: ['user'],
        });
    }

    async getAnalytics() {
        const stats = await this.getDashboardStats();

        const activeJobs = await this.serviceRequestRepository.count({
            where: { status: ServiceRequestStatus.JOB_STARTED }
        });

        const onlineTechnicians = await this.technicianRepository.count({
            where: { isOnline: true, status: TechnicianStatus.APPROVED }
        });

        return {
            totalJobs: stats.jobs.total,
            completedJobs: stats.jobs.completed,
            activeJobs: activeJobs,
            activeTechnicians: onlineTechnicians,
            totalTechnicians: stats.users.technicians,
            pendingTechnicians: stats.users.pendingTechnicians,
            revenue: stats.revenue.total,
            topCategories: [],
        };
    }

    async getAllCustomers() {
        const customers = await this.userRepository.find({
            where: { role: UserRole.CUSTOMER },
            relations: ['customer'],
            order: { createdAt: 'DESC' },
        });

        return customers.map(user => ({
            id: user.id,
            phone: user.phone,
            name: user.customer?.name || 'N/A',
            address: user.customer?.address || 'N/A',
            createdAt: user.createdAt,
            isActive: user.isActive,
        }));
    }

    // ==================== TECHNICIAN CRUD ====================

    async createTechnician(data: any) {
        const user = this.userRepository.create({
            phone: data.phone,
            role: UserRole.TECHNICIAN,
            isActive: true,
        });
        const savedUser = await this.userRepository.save(user);

        const technician = this.technicianRepository.create({
            userId: savedUser.id,
            name: data.name,
            skills: data.skills || [],
            experience: data.experience || 0,
            serviceRadiusKm: data.serviceRadiusKm || 5.0,
            status: TechnicianStatus.APPROVED,
            aadhaarImageUrl: data.aadhaarImageUrl,
        });

        return this.technicianRepository.save(technician);
    }

    async updateTechnician(technicianId: string, data: any) {
        const technician = await this.technicianRepository.findOne({
            where: { id: technicianId },
        });

        if (!technician) {
            throw new NotFoundException('Technician not found');
        }

        if (data.name) technician.name = data.name;
        if (data.skills) technician.skills = data.skills;
        if (data.experience !== undefined) technician.experience = data.experience;
        if (data.serviceRadiusKm !== undefined) technician.serviceRadiusKm = data.serviceRadiusKm;
        if (data.aadhaarImageUrl) technician.aadhaarImageUrl = data.aadhaarImageUrl;

        return this.technicianRepository.save(technician);
    }

    async deleteTechnician(technicianId: string) {
        const technician = await this.technicianRepository.findOne({
            where: { id: technicianId },
            relations: ['user'],
        });

        if (!technician) {
            throw new NotFoundException('Technician not found');
        }

        await this.technicianRepository.remove(technician);

        if (technician.user) {
            await this.userRepository.remove(technician.user);
        }

        return { message: 'Technician deleted successfully' };
    }

    async toggleTechnicianStatus(technicianId: string, isActive: boolean) {
        const technician = await this.technicianRepository.findOne({
            where: { id: technicianId },
            relations: ['user'],
        });

        if (!technician) {
            throw new NotFoundException('Technician not found');
        }

        if (technician.user) {
            technician.user.isActive = isActive;
            await this.userRepository.save(technician.user);
        }

        return this.technicianRepository.findOne({
            where: { id: technicianId },
            relations: ['user'],
        });
    }

    // ==================== SERVICE CATEGORIES ====================

    async getServiceCategories() {
        return this.servicesService.findAll();
    }

    async createServiceCategory(data: any) {
        return this.servicesService.create(data);
    }

    async updateServiceCategory(id: string, data: any) {
        return this.servicesService.update(id, data);
    }

    async deleteServiceCategory(id: string) {
        return this.servicesService.delete(id);
    }

    // ==================== JOBS MANAGEMENT ====================

    async getAllJobs(filters: any) {
        const { status, city, technicianId, page, limit } = filters;
        const query = this.serviceRequestRepository
            .createQueryBuilder('request')
            .leftJoinAndSelect('request.customer', 'customer')
            .leftJoinAndSelect('customer.customer', 'customerProfile')
            .leftJoinAndSelect('request.technician', 'technician')
            .leftJoinAndSelect('request.serviceCategory', 'category')
            .leftJoinAndSelect('request.payment', 'payment')
            .orderBy('request.createdAt', 'DESC')
            .skip((page - 1) * limit)
            .take(limit);

        if (status) {
            query.andWhere('request.status = :status', { status });
        }
        if (city) {
            query.andWhere('request.locationAddress LIKE :city', { city: `%${city}%` });
        }
        if (technicianId) {
            query.andWhere('request.technicianId = :technicianId', { technicianId });
        }

        const [jobs, total] = await query.getManyAndCount();

        return {
            data: jobs,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        };
    }

    async getJobDetails(jobId: string) {
        const job = await this.serviceRequestRepository.findOne({
            where: { id: jobId },
            relations: ['customer', 'technician', 'serviceCategory', 'payment', 'rating'],
        });

        if (!job) {
            throw new NotFoundException('Job not found');
        }

        return {
            ...job,
            timeline: [
                { status: 'PENDING', timestamp: job.createdAt, label: 'Job Created' },
                job.assignedAt && { status: 'ASSIGNED', timestamp: job.assignedAt, label: 'Assigned to Technician' },
                job.startedAt && { status: 'STARTED', timestamp: job.startedAt, label: 'Work Started' },
                job.completedAt && { status: 'COMPLETED', timestamp: job.completedAt, label: 'Work Completed' },
            ].filter(Boolean),
        };
    }

    async manuallyAssignTechnician(jobId: string, technicianId: string) {
        const job = await this.serviceRequestRepository.findOne({
            where: { id: jobId },
            relations: ['customer', 'technician', 'serviceCategory'],
        });

        if (!job) {
            throw new NotFoundException('Job not found');
        }

        const validStatuses = [
            ServiceRequestStatus.REQUESTED,
            ServiceRequestStatus.TECHNICIAN_ASSIGNED,
        ];
        if (!validStatuses.includes(job.status)) {
            throw new NotFoundException(
                `Job cannot be assigned in status: ${job.status}. Only REQUESTED or TECHNICIAN_ASSIGNED jobs can be manually assigned.`,
            );
        }

        const technician = await this.technicianRepository.findOne({
            where: { id: technicianId },
        });

        if (!technician) {
            throw new NotFoundException('Technician not found');
        }

        if (technician.status !== TechnicianStatus.APPROVED) {
            throw new NotFoundException(
                `Technician must be APPROVED to be assigned jobs. Current status: ${technician.status}`,
            );
        }

        const startJobOtp = Math.floor(1000 + Math.random() * 9000).toString();

        await this.serviceRequestRepository.update(jobId, {
            technicianId,
            status: ServiceRequestStatus.TECHNICIAN_ASSIGNED,
            assignedAt: new Date(),
            startJobOtp,
        });

        const updatedJob = await this.serviceRequestRepository.findOne({
            where: { id: jobId },
            relations: ['customer', 'technician', 'serviceCategory'],
        });

        console.log(`[Manual Assignment] Admin assigned technician ${technicianId} to job ${jobId}`);

        return updatedJob;
    }

    // ==================== PAYMENTS MANAGEMENT ====================

    async getAllPayments(filters: any) {
        const { status, technicianId, startDate, endDate, page, limit } = filters;

        const applyFilters = (qb: any) => {
            if (status) qb.andWhere('payment.status = :status', { status });
            if (technicianId) qb.andWhere('request.technicianId = :technicianId', { technicianId });
            if (startDate) qb.andWhere('payment.createdAt >= :startDate', { startDate: new Date(startDate) });
            if (endDate) qb.andWhere('payment.createdAt <= :endDate', { endDate: new Date(endDate) });
        };

        const listQuery = this.paymentRepository
            .createQueryBuilder('payment')
            .leftJoinAndSelect('payment.serviceRequest', 'request')
            .leftJoinAndSelect('request.technician', 'technician')
            .leftJoinAndSelect('request.customer', 'customer')
            .leftJoinAndSelect('customer.customer', 'customerProfile')
            .leftJoinAndSelect('request.serviceCategory', 'category')
            .orderBy('payment.createdAt', 'DESC')
            .skip((page - 1) * limit)
            .take(limit);

        applyFilters(listQuery);
        const [payments, total] = await listQuery.getManyAndCount();

        const aggQuery = this.paymentRepository
            .createQueryBuilder('payment')
            .leftJoin('payment.serviceRequest', 'request')
            .select('SUM(payment.amount)', 'totalAmount')
            .addSelect('SUM(payment.commissionAmount)', 'totalCommission');

        applyFilters(aggQuery);
        const aggResult = await aggQuery.getRawOne();

        return {
            data: payments,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
            summary: {
                totalAmount: parseFloat(aggResult?.totalAmount) || 0,
                totalCommission: parseFloat(aggResult?.totalCommission) || 0,
            },
        };
    }

    async generatePaymentCSV(filters: any) {
        const { startDate, endDate } = filters;
        const query = this.paymentRepository
            .createQueryBuilder('payment')
            .leftJoinAndSelect('payment.serviceRequest', 'request')
            .leftJoinAndSelect('request.technician', 'technician')
            .leftJoinAndSelect('request.customer', 'customer')
            .leftJoinAndSelect('customer.customer', 'customerProfile')
            .leftJoinAndSelect('request.serviceCategory', 'category')
            .orderBy('payment.createdAt', 'DESC');

        if (startDate) {
            query.andWhere('payment.createdAt >= :startDate', { startDate: new Date(startDate) });
        }
        if (endDate) {
            query.andWhere('payment.createdAt <= :endDate', { endDate: new Date(endDate) });
        }

        const payments = await query.getMany();

        const headers = ['Date', 'Job ID', 'Customer', 'Technician', 'Service', 'Amount', 'Commission', 'Net Amount', 'Status', 'Payment Method'];
        const rows = payments.map(p => [
            new Date(p.createdAt).toLocaleDateString(),
            p.serviceRequest?.id || '',
            p.serviceRequest?.customer?.customer?.name || p.serviceRequest?.customer?.name || '',
            p.serviceRequest?.technician?.name || '',
            p.serviceRequest?.serviceCategory?.nameEn || '',
            p.amount,
            p.commissionAmount,
            p.amount - p.commissionAmount,
            p.status,
            p.method,
        ]);

        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.join(',')),
        ].join('\n');

        return csvContent;
    }
}