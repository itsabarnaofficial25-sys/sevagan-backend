import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ServiceRequest } from './entities/service-request.entity';
import { Rating } from './entities/rating.entity';
import { JobsService } from './jobs.service';
import { JobMatchingService } from './job-matching.service';
import { JobsController } from './jobs.controller';
import { TechniciansModule } from '../technicians/technicians.module';
import { ServicesModule } from '../services/services.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { DatabaseModule } from '../database/database.module';
import { UploadModule } from '../upload/upload.module';
import { CustomersModule } from '../customers/customers.module';  // ✅ ADD THIS

@Module({
    imports: [
        TypeOrmModule.forFeature([ServiceRequest, Rating]),
        TechniciansModule,
        ServicesModule,
        NotificationsModule,
        DatabaseModule,
        UploadModule,
        CustomersModule,  // ✅ ADD THIS
    ],
    controllers: [JobsController],
    providers: [JobsService, JobMatchingService],
    exports: [JobsService],
})
export class JobsModule { }