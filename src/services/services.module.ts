import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';  // ✅ ADD THIS
import { ServiceCategory } from './entities/service-category.entity';
import { ServicesService } from './services.service';
import { ServicesController } from './services.controller';

@Module({
    imports: [
        TypeOrmModule.forFeature([ServiceCategory]),
        JwtModule.register({  // ✅ ADD THIS
            secret: process.env.JWT_SECRET || 'secretKey',
            signOptions: { expiresIn: '7d' },
        }),
    ],
    controllers: [ServicesController],
    providers: [ServicesService],
    exports: [ServicesService],
})
export class ServicesModule { }