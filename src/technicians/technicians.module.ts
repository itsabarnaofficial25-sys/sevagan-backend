import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TechniciansService } from './technicians.service';
import { TechniciansController } from './technicians.controller';
import { Technician } from './entities/technician.entity';
import { ServiceRequest } from '../jobs/entities/service-request.entity';
import { Rating } from '../jobs/entities/rating.entity';
import { UploadModule } from '../upload/upload.module';

@Module({
    imports: [TypeOrmModule.forFeature([Technician, ServiceRequest, Rating]), UploadModule],
    controllers: [TechniciansController],
    providers: [TechniciansService],
    exports: [TechniciansService],
})
export class TechniciansModule { }
