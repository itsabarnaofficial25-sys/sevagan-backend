
import { DataSource } from 'typeorm';
import { ServiceCategory } from './src/services/entities/service-category.entity';
import { User, UserRole } from './src/users/entities/user.entity';
import * as bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';

dotenv.config();

const AppDataSource = new DataSource({
    type: 'postgres',
    host: process.env.DATABASE_HOST || 'localhost',
    port: parseInt(process.env.DATABASE_PORT) || 5432,
    username: process.env.DATABASE_USER || 'sevagan_user',
    password: process.env.DATABASE_PASSWORD || 'sevagan_password',
    database: process.env.DATABASE_NAME || 'sevagan',
    entities: [ServiceCategory, User],
    synchronize: false,
});

async function seed() {
    await AppDataSource.initialize();
    console.log('Database connected for seeding...');

    const categoryRepo = AppDataSource.getRepository(ServiceCategory);
    const userRepo = AppDataSource.getRepository(User);

    // 1. Seed Service Categories
    const categories = [
        {
            name: 'electrician', // Internal unique name
            nameEn: 'Electrician',
            nameTa: 'மின்வேலை',
            iconUrl: 'https://cdn-icons-png.flaticon.com/512/2932/2932943.png',
            basePrice: 150,
            minPrice: 150,
            maxPrice: 1000,
            commissionPercent: 15,
            description: 'Wiring, switch repair, fan installation, and more',
            isActive: true
        },
        {
            name: 'plumber',
            nameEn: 'Plumber',
            nameTa: 'குழாய் வேலை',
            iconUrl: 'https://cdn-icons-png.flaticon.com/512/307/307883.png',
            basePrice: 150,
            minPrice: 150,
            maxPrice: 1500,
            commissionPercent: 15,
            description: 'Leak repair, pipe fitting, tap replacement',
            isActive: true
        },
        {
            name: 'ac_service',
            nameEn: 'AC Service',
            nameTa: 'ஏசி சர்வீஸ்',
            iconUrl: 'https://cdn-icons-png.flaticon.com/512/911/911409.png',
            basePrice: 400,
            minPrice: 400,
            maxPrice: 2500,
            commissionPercent: 20,
            description: 'AC cleaning, gas filling, installation',
            isActive: true
        },
        {
            name: 'washing_machine',
            nameEn: 'Washing Machine',
            nameTa: 'வாஷிங் மெஷின்',
            iconUrl: 'https://cdn-icons-png.flaticon.com/512/3565/3565293.png',
            basePrice: 300,
            minPrice: 300,
            maxPrice: 3000,
            commissionPercent: 15,
            description: 'Drum cleaning, motor repair, pc board issues',
            isActive: true
        },
        {
            name: 'bike_repair',
            nameEn: 'Bike Repair',
            nameTa: 'பைக் சர்வீஸ்',
            iconUrl: 'https://cdn-icons-png.flaticon.com/512/2932/2932943.png', // Placeholder icon
            basePrice: 200,
            minPrice: 200,
            maxPrice: 5000,
            commissionPercent: 10,
            description: 'General service, puncture, oil change',
            isActive: true
        },
        {
            name: 'motor_repair',
            nameEn: 'Motor Repair',
            nameTa: 'மோட்டார் சர்வீஸ்',
            iconUrl: 'https://cdn-icons-png.flaticon.com/512/3565/3565293.png', // Placeholder icon
            basePrice: 350,
            minPrice: 350,
            maxPrice: 2000,
            commissionPercent: 15,
            description: 'Water pump repair, coil winding',
            isActive: true
        }
    ];

    for (const cat of categories) {
        const existing = await categoryRepo.findOne({ where: { name: cat.name } });
        if (!existing) {
            await categoryRepo.save(categoryRepo.create(cat));
            console.log(`Created service category: ${cat.nameEn}`);
        } else {
            console.log(`Service category exists: ${cat.nameEn}`);
        }
    }

    // 2. Seed Admin User
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@sevagan.com';
    const adminPhone = '9999999999';
    const adminExists = await userRepo.findOne({ where: { email: adminEmail } });

    if (!adminExists) {
        // Note: Password field missing in User entity. Skipping password setting.
        // const password = await bcrypt.hash(process.env.ADMIN_PASSWORD || 'Admin@123', 10);
        const admin = userRepo.create({
            email: adminEmail,
            phone: adminPhone,
            // password: password, 
            role: UserRole.ADMIN,
            // isPhoneVerified: true // Field missing in entity? Check.
        });
        // Check if isPhoneVerified exists in entity, user.ts showed: phone, role, name, email, isActive, fcmToken, createdAt, updatedAt.
        // It does NOT show isPhoneVerified.

        await userRepo.save(admin);
        console.log(`Created admin user: ${adminEmail}`);
    } else {
        console.log(`Admin user already exists`);
    }

    console.log('Seeding completed!');
    await AppDataSource.destroy();
}

seed().catch((error) => {
    console.error('Error during seeding:', error);
    process.exit(1);
});
