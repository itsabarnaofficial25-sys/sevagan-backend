// backend/src/entities/user.entity.ts
import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
} from 'typeorm';

export enum UserRole {
    CUSTOMER = 'CUSTOMER',
    TECHNICIAN = 'TECHNICIAN',
    ADMIN = 'ADMIN',
}

@Entity('users')
export class User {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ unique: true })
    phone: string;

    @Column({
        type: 'enum',
        enum: UserRole,
        default: UserRole.CUSTOMER,
    })
    role: UserRole;

    @Column({ nullable: true })
    name: string;

    @Column({ nullable: true })
    email: string;

    @Column({ nullable: true, select: false })
    password: string;

    @Column({ default: true })
    isActive: boolean;

    @Column({ nullable: true })
    fcmToken: string;

    @Column({ default: false })
    isProfileComplete: boolean;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}