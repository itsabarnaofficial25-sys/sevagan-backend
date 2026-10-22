//backend/src/customers/customers.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CustomersController } from './customers.controller';
import { CustomersService } from './customers.service';
import { Customer } from './entities/customer.entity';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';  
import { RolesGuard } from '../common/guards/roles.guard';      

@Module({
    imports: [TypeOrmModule.forFeature([Customer])],
    controllers: [CustomersController],
    providers: [
        CustomersService,
        JwtAuthGuard,    
        RolesGuard,      
    ],
    exports: [CustomersService],
})
export class CustomersModule { }