//backend/src/customers/customer.controller.ts
import {
    Controller,
    Get,
    Post,
    Put,
    Body,
    UseGuards,
    HttpStatus,
    HttpException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CustomersService } from './customers.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { GetUser } from '../common/decorators/get-user.decorator';
import { User, UserRole } from '../users/entities/user.entity';

@ApiTags('customers')
@Controller('customers')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class CustomersController {
    constructor(private customersService: CustomersService) { }

    @Get('profile')
    @Roles(UserRole.CUSTOMER)
    @ApiOperation({ summary: 'Get customer profile' })
    async getProfile(@GetUser() user: User) {
        try {
            return await this.customersService.findByUserId(user.id);
        } catch (error) {
            throw new HttpException(
                {
                    message: 'Customer profile not found',
                    error: 'Not Found',
                    statusCode: HttpStatus.NOT_FOUND,
                },
                HttpStatus.NOT_FOUND,
            );
        }
    }

    @Post('profile')
    @Roles(UserRole.CUSTOMER)  // ⚠️ This requires role = 'CUSTOMER'
    @ApiOperation({ summary: 'Create customer profile' })
    async createProfile(@GetUser() user: User, @Body() data: any) {
        console.log('=== Create Profile ===');
        console.log('User from token:', user);
        console.log('User role:', user?.role);
        console.log('User ID:', user?.id);

        // ✅ Check if profile already exists
        const exists = await this.customersService.profileExists(user.id);
        if (exists) {
            throw new HttpException(
                'Profile already exists',
                HttpStatus.BAD_REQUEST,
            );
        }

        return this.customersService.createProfile(user.id, {
            name: data.name,
            address: data.address,
            phone: user.phone,
        });
    }

    @Put('profile')
    @Roles(UserRole.CUSTOMER)
    @ApiOperation({ summary: 'Update customer profile' })
    async updateProfile(@GetUser() user: User, @Body() data: any) {
        return this.customersService.updateProfile(user.id, {
            name: data.name,
            address: data.address,
        });
    }

    @Post('update-fcm-token')
    @Roles(UserRole.CUSTOMER)
    @ApiOperation({ summary: 'Update customer FCM token' })
    async updateFcmToken(
        @GetUser() user: User,
        @Body() data: { fcmToken: string },
    ) {

        if (!data.fcmToken) {
            throw new HttpException(
                'FCM Token required',
                HttpStatus.BAD_REQUEST,
            );
        }


        return this.customersService.updateFcmToken(
            user.id,
            data.fcmToken,
        );
    }
}
