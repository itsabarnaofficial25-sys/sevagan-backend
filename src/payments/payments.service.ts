//backend/src/payment/payment.servie.ts
import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';

// ✅ FIX: Razorpay CommonJS import (prevents "not a constructor" error)
const Razorpay = require('razorpay');

import * as crypto from 'crypto';
import {
    Payment,
    PaymentMethod,
    PaymentStatus,
} from './entities/payment.entity';
import { JobsService } from '../jobs/jobs.service';
import { TechniciansService } from '../technicians/technicians.service';
import { NotificationsService } from '../notifications/notifications.service';
import { ServiceRequestStatus } from '../jobs/entities/service-request.entity';

@Injectable()
export class PaymentsService {
    private razorpay: any; // safer than strict type in mixed module env

    constructor(
        @InjectRepository(Payment)
        private paymentRepository: Repository<Payment>,
        private jobsService: JobsService,
        private techniciansService: TechniciansService,
        private notificationsService: NotificationsService,
        private configService: ConfigService,
    ) {
        const keyId = this.configService.get('RAZORPAY_KEY_ID');
        const keySecret = this.configService.get('RAZORPAY_KEY_SECRET');

        // Only initialize Razorpay if real credentials are provided
        if (
            keyId &&
            keySecret &&
            keyId !== 'placeholder' &&
            keySecret !== 'placeholder'
        ) {
            this.razorpay = new Razorpay({
                key_id: keyId,
                key_secret: keySecret,
            });
        }
    }

    private isRazorpayEnabled(): boolean {
        const keyId = this.configService.get('RAZORPAY_KEY_ID');
        const keySecret = this.configService.get('RAZORPAY_KEY_SECRET');

        return !!(
            keyId &&
            keySecret &&
            keyId !== 'placeholder' &&
            keySecret !== 'placeholder'
        );
    }
    async createRazorpayOrder(
        amount: number,
        currency: string,
        receipt: string,
        userId: string,
    ): Promise<any> {
        console.log('💰 Creating payment order for amount:', amount);

        // ALWAYS USE MOCK MODE for now
        console.log('⚠️ MOCK MODE: Creating mock order');

        // Return mock order
        return {
            success: true,
            order_id: `mock_order_${Date.now()}_${userId.substring(0, 8)}`,
            amount: amount * 100,
            currency: currency || 'INR',
            receipt: receipt || `receipt_${Date.now()}`,
            isMock: true,
            message: 'This is a test payment. No real money charged.',
        };
    }
    async createPayment(
        serviceRequestId: string,
        method: PaymentMethod,
    ): Promise<Payment> {
        const serviceRequest = await this.jobsService.findById(serviceRequestId);

        // ✅ Allow MOCK payment even if job not completed
        if (method !== PaymentMethod.MOCK) {
            if (serviceRequest.status !== ServiceRequestStatus.JOB_COMPLETED) {
                throw new BadRequestException('Job must be completed before payment');
            }
        }

        const amount = serviceRequest.finalPrice || 0;
        const category = serviceRequest.serviceCategory;

        let commissionAmount = 0;
        let platformFee = 0;

        if (category) {
            commissionAmount = this.calculateCommission(category, amount);
        }

        const technicianAmount = amount - commissionAmount - platformFee;

        const payment = this.paymentRepository.create({
            serviceRequestId,
            amount,
            platformFee,
            commissionAmount,
            technicianAmount,
            method,
            status: PaymentStatus.PENDING,
        });

        const saved = await this.paymentRepository.save(payment);

        // ✅ Handle MOCK payment differently
        if (method === PaymentMethod.MOCK) {
            saved.razorpayOrderId = `mock_order_${Date.now()}`;
            saved.status = PaymentStatus.COMPLETED; // Auto-complete mock payments
            await this.paymentRepository.save(saved);

            // Mark job as paid for mock
            await this.jobsService.markAsPaid(serviceRequestId);
        }

        // Create Razorpay order for UPI payments
        if (method === PaymentMethod.UPI) {
            if (!this.razorpay) {
                saved.razorpayOrderId = `dev_order_${saved.id}`;
                console.log('⚠️ Dev Mode: Mock Razorpay order created');
            } else {
                try {
                    const order = await this.razorpay.orders.create({
                        amount: Math.round(amount * 100),
                        currency: 'INR',
                        receipt: `ord_${saved.id.substring(0, 35)}`,
                    });
                    saved.razorpayOrderId = order.id;
                } catch (e) {
                    console.error('Razorpay order creation failed:', e);
                    saved.razorpayOrderId = `error_order_${saved.id}`;
                }
            }
            await this.paymentRepository.save(saved);
        }

        return saved;
    }

    async verifyPayment(
        paymentId: string,
        razorpayPaymentId: string,
        razorpaySignature: string,
    ): Promise<Payment> {
        const payment = await this.paymentRepository.findOne({
            where: { id: paymentId },
            relations: ['serviceRequest'],
        });

        if (!payment) {
            throw new BadRequestException('Payment not found');
        }

        // ✅ ADD THIS: Skip verification for mock payments
        if (razorpayPaymentId.startsWith('mock_payment_') ||
            (payment.razorpayOrderId && payment.razorpayOrderId.startsWith('mock_order'))) {
            console.log('⚠️ Mock Mode: Skipping signature verification');
            return this.processSuccessfulPayment(
                payment,
                razorpayPaymentId,
                'mock_signature',
            );
        }

        // Verify only if Razorpay enabled
        if (this.isRazorpayEnabled()) {
            const text = `${payment.razorpayOrderId}|${razorpayPaymentId}`;

            const expectedSignature = crypto
                .createHmac(
                    'sha256',
                    this.configService.get('RAZORPAY_KEY_SECRET'),
                )
                .update(text)
                .digest('hex');

            if (expectedSignature !== razorpaySignature) {
                throw new BadRequestException('Invalid payment signature');
            }
        } else {
            console.log('⚠️ Dev Mode: Skipping signature verification');
        }

        return this.processSuccessfulPayment(
            payment,
            razorpayPaymentId,
            razorpaySignature,
        );
    }
    async handleWebhook(body: any, signature: string): Promise<any> {
        const secret = this.configService.get('RAZORPAY_WEBHOOK_SECRET');

        if (secret && secret !== 'placeholder') {
            const expectedSignature = crypto
                .createHmac('sha256', secret)
                .update(JSON.stringify(body))
                .digest('hex');

            if (expectedSignature !== signature) {
                throw new BadRequestException('Invalid webhook signature');
            }
        }

        const event = body.event;
        console.log(`🔔 Webhook received: ${event}`);

        if (event === 'order.paid') {
            const orderId = body.payload.order.entity.id;

            const payment = await this.paymentRepository.findOne({
                where: { razorpayOrderId: orderId },
                relations: ['serviceRequest'],
            });

            if (
                payment &&
                payment.status !== PaymentStatus.COMPLETED
            ) {
                const razorpayPaymentId =
                    body.payload.payment.entity.id;

                await this.processSuccessfulPayment(
                    payment,
                    razorpayPaymentId,
                    'webhook_verified',
                );
            }
        }

        return { status: 'ok' };
    }

    private async processSuccessfulPayment(
        payment: Payment,
        razorpayPaymentId: string,
        razorpaySignature: string,
    ): Promise<Payment> {
        payment.razorpayPaymentId = razorpayPaymentId;
        payment.razorpaySignature = razorpaySignature;
        payment.status = PaymentStatus.COMPLETED;

        await this.paymentRepository.save(payment);

        await this.jobsService.markAsPaid(payment.serviceRequestId);

        await this.techniciansService.updateWalletBalance(
            payment.serviceRequest.technicianId,
            payment.technicianAmount,
        );

        await this.notificationsService.sendPaymentReceived(
            payment.serviceRequest.customerId,  // customerId
            payment.serviceRequestId,           // jobId
            payment.technicianAmount,           // amount (can be number)
        );
        return payment;
    }

    async confirmCashPayment(
        serviceRequestId: string,
        technicianId: string,
    ): Promise<Payment> {
        const payment = await this.paymentRepository.findOne({
            where: { serviceRequestId },
            relations: ['serviceRequest'],
        });

        if (!payment) {
            throw new BadRequestException('Payment not found');
        }

        if (payment.serviceRequest.technicianId !== technicianId) {
            throw new BadRequestException('Unauthorized');
        }

        payment.status = PaymentStatus.COMPLETED;
        await this.paymentRepository.save(payment);

        await this.techniciansService.updateWalletBalance(
            technicianId,
            payment.technicianAmount,
        );

        return payment;
    }

    private calculateCommission(category: any, finalPrice: number): number {
        if (category.commissionType === 'FIXED_AMOUNT') {
            return category.commissionAmount || 0;
        }

        return (finalPrice * category.commissionPercent) / 100;
    }

    async findByServiceRequestId(
        serviceRequestId: string,
    ): Promise<Payment> {
        return this.paymentRepository.findOne({
            where: { serviceRequestId },
        });
    }
}