import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';

import { User } from '../users/entities/user.entity';
import { ServiceRequest } from '../jobs/entities/service-request.entity';
import { Technician } from '../technicians/entities/technician.entity';
import { Payment } from '../payments/entities/payment.entity';

import { ServicesModule } from '../services/services.module';
import { JwtStrategy } from '../auth/jwt.strategy';

@Module({
    imports: [
        TypeOrmModule.forFeature([
            User,
            ServiceRequest,
            Technician,
            Payment,
        ]),

        PassportModule,

        JwtModule.registerAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: async (configService: ConfigService) => ({
                secret: configService.get<string>('JWT_SECRET'),
                signOptions: {
                    expiresIn: configService.get<string>('JWT_EXPIRATION', '7d'),
                },
            }),
        }),

        ServicesModule,
    ],

    controllers: [AdminController],

    providers: [
        AdminService,
        JwtStrategy,
    ],
})
export class AdminModule {}