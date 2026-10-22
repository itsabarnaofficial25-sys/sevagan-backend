// backend/src/app.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { TechniciansModule } from './technicians/technicians.module';
import { CustomersModule } from './customers/customers.module';
import { ServicesModule } from './services/services.module';
import { JobsModule } from './jobs/jobs.module';
import { PaymentsModule } from './payments/payments.module';
import { NotificationsModule } from './notifications/notifications.module';
import { AdminModule } from './admin/admin.module';
import { UploadModule } from './upload/upload.module';
import { AppController } from './app.controller';

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            envFilePath: '.env',
        }),
        TypeOrmModule.forRootAsync({
            imports: [ConfigModule],
            useFactory: (configService: ConfigService) => ({
                type: 'postgres',
                host: configService.get('DATABASE_HOST', 'localhost'),
                port: configService.get('DATABASE_PORT', 5432),
                username: configService.get('DATABASE_USER', 'postgres'),
                password: configService.get('DATABASE_PASSWORD', 'password'),
                database: configService.get('DATABASE_NAME', 'sevagan'),
                entities: [__dirname + '/**/*.entity{.ts,.js}'],
                synchronize: false,  

                
                logging: true,
            }),
            inject: [ConfigService],
        }),
        ScheduleModule.forRoot(),
        DatabaseModule,
        AuthModule,
        UsersModule,
        TechniciansModule,
        CustomersModule,
        ServicesModule,
        JobsModule,
        PaymentsModule,
        NotificationsModule,
        AdminModule,
        UploadModule,
    ],
    controllers: [AppController],
    providers: [],
})
export class AppModule { }