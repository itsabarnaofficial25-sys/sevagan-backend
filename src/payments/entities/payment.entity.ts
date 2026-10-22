//backend/src/payments/payment.entity.ts
import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne,
    JoinColumn,
} from 'typeorm';
import { ServiceRequest } from '../../jobs/entities/service-request.entity';

export enum PaymentMethod {
    CASH = 'CASH',
    UPI = 'UPI',
    MOCK = 'MOCK',  // ✅ ADD THIS LINE
}

export enum PaymentStatus {
    PENDING = 'PENDING',
    PROCESSING = 'PROCESSING',
    COMPLETED = 'COMPLETED',
    FAILED = 'FAILED',
    REFUNDED = 'REFUNDED',
}

@Entity('payments')
export class Payment {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => ServiceRequest)
    @JoinColumn({ name: 'service_request_id' })
    serviceRequest: ServiceRequest;

    @Column({ name: 'service_request_id' })
    serviceRequestId: string;

    @Column({ type: 'float' })
    amount: number;

    @Column({ type: 'float' })
    platformFee: number;

    @Column({ type: 'float' })
    commissionAmount: number;

    @Column({ type: 'float' })
    technicianAmount: number;

    @Column({
        type: 'enum',
        enum: PaymentMethod,
    })
    method: PaymentMethod;

    @Column({
        type: 'enum',
        enum: PaymentStatus,
        default: PaymentStatus.PENDING,
    })
    status: PaymentStatus;

    @Column({ nullable: true })
    razorpayOrderId: string;

    @Column({ nullable: true })
    razorpayPaymentId: string;

    @Column({ nullable: true })
    razorpaySignature: string;

    @Column({ type: 'text', nullable: true })
    metadata: string;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
