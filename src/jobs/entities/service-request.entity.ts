import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne,
    JoinColumn,
    OneToMany,
    OneToOne,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Technician } from '../../technicians/entities/technician.entity';
import { ServiceCategory } from '../../services/entities/service-category.entity';
import { Payment } from '../../payments/entities/payment.entity';

export enum ServiceRequestStatus {
    REQUESTED = 'REQUESTED',
    TECHNICIAN_ASSIGNED = 'TECHNICIAN_ASSIGNED',
    TECHNICIAN_ON_THE_WAY = 'TECHNICIAN_ON_THE_WAY',
    JOB_STARTED = 'JOB_STARTED',
    JOB_COMPLETED = 'JOB_COMPLETED',
    PAYMENT_PENDING = 'PAYMENT_PENDING',
    COMPLETED = 'COMPLETED',
    CANCELLED = 'CANCELLED',
}

@Entity('service_requests')
export class ServiceRequest {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'customer_id' })
    customer: User;

    @Column({ name: 'customer_id' })
    customerId: string;

    @ManyToOne(() => Technician, { nullable: true })
    @JoinColumn({ name: 'technician_id' })
    technician: Technician;

    @Column({ name: 'technician_id', nullable: true })
    technicianId: string;

    @ManyToOne(() => ServiceCategory)
    @JoinColumn({ name: 'service_category_id' })
    serviceCategory: ServiceCategory;

    @Column({ name: 'service_category_id' })
    serviceCategoryId: string;

    @Column({
        type: 'enum',
        enum: ServiceRequestStatus,
        default: ServiceRequestStatus.REQUESTED,
    })
    status: ServiceRequestStatus;

    @Column({ type: 'text' })
    description: string;

    @Column('text', { array: true, default: '{}' })
    imageUrls: string[];

    @Column({ nullable: true })
    voiceNoteUrl: string;

    @Column({ type: 'float' })
    estimatedPrice: number;

    @Column({ type: 'float', nullable: true })
    finalPrice: number;

    @Column({ type: 'float' })
    locationLat: number;

    @Column({ type: 'float' })
    locationLng: number;

    @Column({ nullable: true })
    locationAddress: string;

    @Column({ nullable: true })
    customerName: string;

    @Column({ nullable: true })
    customerPhone: string;

    @Column({ type: 'timestamp', nullable: true })
    assignedAt: Date;

    @Column({ type: 'timestamp', nullable: true })
    startedAt: Date;

    @Column({ type: 'timestamp', nullable: true })
    completedAt: Date;

    @Column({ type: 'timestamp', nullable: true })
    cancelledAt: Date;

    @Column({ nullable: true })
    cancellationReason: string;

    @Column({ nullable: true })
    startJobOtp: string;

    @Column({ type: 'timestamp', nullable: true })
    preferredDateTime: Date;

    @Column({ type: 'timestamp', nullable: true })
    proposedDateTime: Date;

    @Column({ type: 'varchar', length: 20, nullable: true })
    schedulingStatus: string; // 'PENDING' | 'ACCEPTED' | 'PROPOSED' | 'CONFIRMED'

    @Column({ type: 'text', nullable: true })
    schedulingNote: string;

    @OneToOne(() => Payment, payment => payment.serviceRequest, { nullable: true })
    payment: Payment;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
