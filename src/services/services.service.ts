import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ServiceCategory } from './entities/service-category.entity';

@Injectable()
export class ServicesService implements OnModuleInit {
    constructor(
        @InjectRepository(ServiceCategory)
        private serviceCategoryRepository: Repository<ServiceCategory>,
    ) { }

    async onModuleInit() {
        await this.seed();
    }

    async seed() {
        const count = await this.serviceCategoryRepository.count();
        if (count > 0) return;

        const categories = [
            {
                name: 'Plumbing',
                nameEn: 'Plumbing',
                nameTa: 'குழாய் வேலை',
                description: 'Pipe repair, tap leakage, bathroom fitting',
                basePrice: 150,
                minPrice: 100,
                maxPrice: 5000,
                commissionPercent: 15,
                iconUrl: 'https://cdn-icons-png.flaticon.com/512/307/307873.png',
            },
            {
                name: 'Electrical',
                nameEn: 'Electrical',
                nameTa: 'மின்வேலை',
                description: 'Wiring, fan repair, switch replacement',
                basePrice: 200,
                minPrice: 150,
                maxPrice: 10000,
                commissionPercent: 15,
                iconUrl: 'https://cdn-icons-png.flaticon.com/512/2910/2910795.png',
            },
            {
                name: 'AC Service',
                nameEn: 'AC Service',
                nameTa: 'ஏசி சர்வீஸ்',
                description: 'AC cleaning, gas filling, installation',
                basePrice: 500,
                minPrice: 400,
                maxPrice: 15000,
                commissionPercent: 20,
                iconUrl: 'https://cdn-icons-png.flaticon.com/512/900/900618.png',
            },
            {
                name: 'Cleaning',
                nameEn: 'Cleaning',
                nameTa: 'சுத்தம் செய்தல்',
                description: 'House cleaning, tank cleaning, sofa cleaning',
                basePrice: 300,
                minPrice: 200,
                maxPrice: 8000,
                commissionPercent: 15,
                iconUrl: 'https://cdn-icons-png.flaticon.com/512/995/995053.png',
            },
            {
                name: 'Carpentry',
                nameEn: 'Carpentry',
                nameTa: 'தச்சு வேலை',
                description: 'Furniture repair, door fixing, new furniture',
                basePrice: 250,
                minPrice: 200,
                maxPrice: 20000,
                commissionPercent: 15,
                iconUrl: 'https://cdn-icons-png.flaticon.com/512/2055/2055272.png',
            },
        ];

        for (const data of categories) {
            const category = this.serviceCategoryRepository.create(data);
            await this.serviceCategoryRepository.save(category);
        }
        console.log(`[Services] Seeded ${categories.length} categories`);
    }

    async findAll(): Promise<ServiceCategory[]> {
        return this.serviceCategoryRepository.find({
            where: { isActive: true },
        });
    }

    async findById(id: string): Promise<ServiceCategory> {
        return this.serviceCategoryRepository.findOne({ where: { id } });
    }

    async create(data: Partial<ServiceCategory>): Promise<ServiceCategory> {
        const category = this.serviceCategoryRepository.create(data);
        return this.serviceCategoryRepository.save(category);
    }

    async update(
        id: string,
        data: Partial<ServiceCategory>,
    ): Promise<ServiceCategory> {
        await this.serviceCategoryRepository.update(id, data);
        return this.findById(id);
    }

    async delete(id: string): Promise<void> {
        await this.serviceCategoryRepository.update(id, { isActive: false });
    }
}
