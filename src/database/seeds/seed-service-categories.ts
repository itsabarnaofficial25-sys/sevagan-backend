// Change from import { AppDataSource } to import AppDataSource
import AppDataSource from '../data-source';
import { ServiceCategory } from '../../services/entities/service-category.entity';

async function seed() {
    try {
        // Initialize if not already initialized
        if (!AppDataSource.isInitialized) {
            await AppDataSource.initialize();
        }
        console.log('✅ DataSource initialized');

        const categories = [
            {
                name: 'electrician',
                nameEn: 'Electrician',
                nameTa: 'மின்வேலை',
                description: 'Expert electricians for all electrical needs',
                basePrice: 150,
                minPrice: 100,
                maxPrice: 2000,
                commissionPercent: 15,
                iconUrl: 'https://cdn-icons-png.flaticon.com/512/2932/2932943.png'
            },
            {
                name: 'plumber',
                nameEn: 'Plumber',
                nameTa: 'குழாய் வேலை',
                description: 'Expert plumbers for all pipe and water needs',
                basePrice: 150,
                minPrice: 100,
                maxPrice: 2000,
                commissionPercent: 15,
                iconUrl: 'https://cdn-icons-png.flaticon.com/512/307/307883.png'
            },
            {
                name: 'ac_service',
                nameEn: 'AC Service',
                nameTa: 'ஏசி சர்வீஸ்',
                description: 'AC repair, installation, and service',
                basePrice: 350,
                minPrice: 300,
                maxPrice: 5000,
                commissionPercent: 15,
                iconUrl: 'https://cdn-icons-png.flaticon.com/512/911/911409.png'
            },
            {
                name: 'washing_machine',
                nameEn: 'Washing Machine',
                nameTa: 'வாஷிங் மெஷின்',
                description: 'Washing machine repair and service',
                basePrice: 300,
                minPrice: 200,
                maxPrice: 4000,
                commissionPercent: 15,
                iconUrl: 'https://cdn-icons-png.flaticon.com/512/3565/3565293.png'
            }
        ];

        const repo = AppDataSource.getRepository(ServiceCategory);

        for (const cat of categories) {
            const exists = await repo.findOneBy({ name: cat.name });
            if (!exists) {
                const newCat = repo.create(cat);
                await repo.save(newCat);
                console.log(`✅ Created category: ${cat.nameEn}`);
            } else {
                console.log(`⏭️ Category exists: ${cat.nameEn}`);
            }
        }

        console.log('🎉 Seeding completed successfully!');
    } catch (err) {
        console.error('❌ Error seeding data:', err);
        throw err;
    } finally {
        if (AppDataSource.isInitialized) {
            await AppDataSource.destroy();
        }
    }
}

seed().catch((err) => {
    console.error('❌ Seeding failed:', err);
    process.exit(1);
});