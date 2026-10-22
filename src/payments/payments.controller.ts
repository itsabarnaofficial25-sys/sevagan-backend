import {
    Controller,
    Get,
    Post,
    Body,
    Param,
    UseGuards,
    Req,
    Headers,
    HttpCode,
    HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PaymentsService } from './payments.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { GetUser } from '../common/decorators/get-user.decorator';
import { User, UserRole } from '../users/entities/user.entity';
import { PaymentMethod } from './entities/payment.entity';
import { TechniciansService } from '../technicians/technicians.service';

@ApiTags('payments')
@Controller('payments')
export class PaymentsController {
    constructor(
        private paymentsService: PaymentsService,
        private techniciansService: TechniciansService,
    ) { }

    // ✅ ADD THIS NEW ENDPOINT
    @Post('create-order')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Create Razorpay order for payment' })
    async createOrder(
        @Body() data: { amount: number; currency?: string; receipt?: string },
        @GetUser() user: User,
    ) {
        return this.paymentsService.createRazorpayOrder(
            data.amount,
            data.currency || 'INR',
            data.receipt,
            user.id,
        );
    }

    @Post('create')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @ApiBearerAuth()
    @Roles(UserRole.CUSTOMER)
    @ApiOperation({ summary: 'Create payment for service request' })
    async createPayment(
        @Body() data: { serviceRequestId: string; method: PaymentMethod },
    ) {
        return this.paymentsService.createPayment(data.serviceRequestId, data.method);
    }

    @Post('verify')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @ApiBearerAuth()
    @Roles(UserRole.CUSTOMER)
    @ApiOperation({ summary: 'Verify Razorpay payment' })
    async verifyPayment(
        @Body()
        data: {
            paymentId: string;
            razorpayPaymentId: string;
            razorpaySignature: string;
        },
    ) {
        return this.paymentsService.verifyPayment(
            data.paymentId,
            data.razorpayPaymentId,
            data.razorpaySignature,
        );
    }

    @Post('confirm-cash/:serviceRequestId')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @ApiBearerAuth()
    @Roles(UserRole.TECHNICIAN)
    @ApiOperation({ summary: 'Confirm cash payment received' })
    async confirmCashPayment(
        @Param('serviceRequestId') serviceRequestId: string,
        @GetUser() user: User,
    ) {
        const technician = await this.techniciansService.findByUserId(user.id);
        return this.paymentsService.confirmCashPayment(
            serviceRequestId,
            technician.id,
        );
    }

    @Post('webhook')
    @ApiOperation({ summary: 'Razorpay webhook handler' })
    async handleWebhook(
        @Req() req: any,
        @Headers('x-razorpay-signature') signature: string,
    ) {
        return this.paymentsService.handleWebhook(req.body, signature);
    }

    @Get('service-request/:id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get payment for service request' })
    async getPaymentByServiceRequest(@Param('id') id: string) {
        return this.paymentsService.findByServiceRequestId(id);
    }
}