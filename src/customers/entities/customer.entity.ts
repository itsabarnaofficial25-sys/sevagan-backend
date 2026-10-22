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

@Entity('customers')
export class Customer {

    @PrimaryGeneratedColumn('uuid')
    id: string;

    // User Relation
    @ManyToOne(() => User)
    @JoinColumn({
        name: 'user_id',
    })
    user: User;

    // Foreign Key Column
    @Column({
        name: 'user_id',
    })
    userId: string;

    @Column()
    name: string;

    @Column({
        type: 'text',
    })
    address: string;

    @Column()
    phone: string;

    // Firebase Cloud Messaging Token
    @Column({
        name: 'fcm_token',
        type: 'text',
        nullable: true,
    })
    fcmToken: string;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

}