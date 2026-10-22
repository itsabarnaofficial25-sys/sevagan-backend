import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    ManyToOne,
    JoinColumn,
} from 'typeorm';
import { ServiceRequest } from './service-request.entity';
import { User } from '../../users/entities/user.entity';
import { Technician } from '../../technicians/entities/technician.entity';

@Entity('ratings')
export class Rating {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => ServiceRequest)
    @JoinColumn({ name: 'service_request_id' })
    serviceRequest: ServiceRequest;

    @Column({ name: 'service_request_id' })
    serviceRequestId: string;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'customer_id' })
    customer: User;

    @Column({ name: 'customer_id' })
    customerId: string;

    @ManyToOne(() => Technician)
    @JoinColumn({ name: 'technician_id' })
    technician: Technician;

    @Column({ name: 'technician_id' })
    technicianId: string;

    @Column({ type: 'int' })
    rating: number;

    @Column({ type: 'text', nullable: true })
    comment: string;

    @CreateDateColumn()
    createdAt: Date;
}
