// backend/src/users/entities/user.entity.ts
import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    OneToOne,
    OneToMany,
} from 'typeorm';
import { Customer } from '../../customers/entities/customer.entity';
import { Technician } from '../../technicians/entities/technician.entity';
import { ServiceRequest } from '../../jobs/entities/service-request.entity';

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

    @OneToOne(() => Customer, customer => customer.user, { cascade: true })
    customer: Customer;

    @OneToOne(() => Technician, technician => technician.user, { cascade: true })
    technician: Technician;

    @OneToMany(() => ServiceRequest, serviceRequest => serviceRequest.customer)
    customerRequests: ServiceRequest[];

    @OneToMany(() => ServiceRequest, serviceRequest => serviceRequest.technician)
    technicianRequests: ServiceRequest[];

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}