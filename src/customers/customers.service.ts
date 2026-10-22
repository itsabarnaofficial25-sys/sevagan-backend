import {
    Injectable,
    NotFoundException,
    HttpException,
    HttpStatus,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Customer } from './entities/customer.entity';


@Injectable()
export class CustomersService {
    constructor(
        @InjectRepository(Customer)
        private customerRepository: Repository<Customer>,
    ) { }

    // ================= GET CUSTOMER PROFILE =================
    async findByUserId(userId: string): Promise<Customer> {

        const customer = await this.customerRepository.findOne({
            where: {
                userId,
            },
            relations: ['user'],
        });

        if (!customer) {
            throw new NotFoundException(
                'Customer profile not found'
            );
        }
        return customer;
    }



    // ================= CREATE CUSTOMER PROFILE =================
    async createProfile(
        userId: string,
        data: Partial<Customer>
    ): Promise<Customer> {

        const customer =
            this.customerRepository.create({
                ...data,
                userId,
            });
        return this.customerRepository.save(customer);
    }

    // ================= UPDATE FCM TOKEN =================
    async updateFcmToken(
        userId: string,
        fcmToken: string,
        ) {
        const customer =
            await this.customerRepository.findOne({
                where: {
                    userId,
                },
            });



        if (!customer) {
            throw new HttpException(
                'Customer not found',
                HttpStatus.NOT_FOUND

            );
        }

        customer.fcmToken = fcmToken;
        await this.customerRepository.save(customer);
        return {
            success: true,
            message: 'FCM Token updated successfully',
        };
    }

    // ================= UPDATE PROFILE =================
    async updateProfile(
        userId: string,
        data: Partial<Customer>
    ): Promise<Customer> {

        const customer =
            await this.findByUserId(userId);
       Object.assign(
            customer,
            data
        );

        return this.customerRepository.save(customer);

    }

    // ================= CHECK PROFILE EXISTS =================
    async profileExists(
        userId: string
    ): Promise<boolean> {
        const count =
            await this.customerRepository.count({
                where: {
                    userId,
                },
            });
        return count > 0;
    }
}