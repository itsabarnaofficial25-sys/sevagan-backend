import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne,
    JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

export enum TechnicianStatus {
    PENDING = 'PENDING',
    APPROVED = 'APPROVED',
    REJECTED = 'REJECTED',
    SUSPENDED = 'SUSPENDED',
}

@Entity('technicians')
export class Technician {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'user_id' })
    user: User;

    @Column({ name: 'user_id' })
    userId: string;

    @Column()
    name: string;

    @Column('text', { array: true })
    skills: string[];

    @Column({ type: 'int' })
    experience: number;

    @Column({ type: 'float', default: 5.0 })
    serviceRadiusKm: number;

    @Column({
        type: 'enum',
        enum: TechnicianStatus,
        default: TechnicianStatus.PENDING,
    })
    status: TechnicianStatus;

    @Column({ type: 'float', default: 0 })
    rating: number;

    @Column({ type: 'int', default: 0 })
    totalRatings: number;

    @Column({ type: 'float', nullable: true })
    latitude: number;

    @Column({ type: 'float', nullable: true })
    longitude: number;

    @Column({ default: false })
    isOnline: boolean;

    @Column({ nullable: true })
    aadhaarImageUrl: string;

    @Column({ nullable: true })
    profileImageUrl: string;

    // ✅ Firebase Cloud Messaging Token
    @Column({
        type: 'text',
        nullable: true,
    })
    fcmToken: string;

    @Column({ type: 'float', default: 0 })
    walletBalance: number;

    @Column({ type: 'int', default: 0 })
    completedJobs: number;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}