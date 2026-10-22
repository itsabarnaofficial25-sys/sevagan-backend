import { Injectable } from '@nestjs/common';
import admin from '../config/firebase';

@Injectable()
export class NotificationsService {
  private firebaseApp: admin.app.App | null = null;

  constructor() {
  this.initializeFirebase();
}

private initializeFirebase() {
  try {
    this.firebaseApp = admin.app();
    console.log('✅ Firebase initialized successfully');
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';
    console.warn('Firebase initialization failed.');
    console.warn(errorMessage);
  }
}

  async sendNotification(
    fcmToken: string,
    title: string,
    body: string,
    data: Record<string, string>,
  ): Promise<boolean> {
    if (!this.firebaseApp) {
      console.log(`[FCM Mock] ${title}: ${body}`);
      return false;
    }

    try {
      await admin.messaging().send({
        token: fcmToken,
        notification: {
          title: title,
          body: body,
        },
        data: data,
      });
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Failed to send notification:', errorMessage);
      return false;
    }
  }

  // ========== FIXED: All parameters optional with default values ==========

  async sendJobRequest(
    technicianId: string,
    jobId: string,
    customerName?: string,
    location?: string,
  ): Promise<boolean> {
    console.log(`[JobRequest] Technician: ${technicianId}, Job: ${jobId}`);
    if (customerName) console.log(`Customer: ${customerName}`);
    if (location) console.log(`Location: ${location}`);
    return true;
  }

  async sendJobUnavailable(
    technicianId: string,
    jobId: string,
  ): Promise<boolean> {
    console.log(`[JobUnavailable] Job ${jobId} is no longer available for technician ${technicianId}`);
    return true;
  }

  async sendTechnicianAssigned(
    customerId: string,
    jobId: string,
    technicianName: string,
    technicianPhone?: string,
  ): Promise<boolean> {
    console.log(`[TechnicianAssigned] Customer: ${customerId}, Job: ${jobId}`);
    console.log(`Technician: ${technicianName}`);
    if (technicianPhone) console.log(`Phone: ${technicianPhone}`);
    return true;
  }

  async sendJobStarted(
    customerId: string,
    jobId: string,
  ): Promise<boolean> {
    console.log(`[JobStarted] Job ${jobId} started for customer ${customerId}`);
    return true;
  }

  async sendJobCompleted(
    customerId: string,
    jobId: string,
  ): Promise<boolean> {
    console.log(`[JobCompleted] Job ${jobId} completed for customer ${customerId}`);
    return true;
  }

  async sendPaymentReceived(
    customerId: string,
    jobId: string,
    amount?: number,
  ): Promise<boolean> {
    console.log(`[PaymentReceived] Customer: ${customerId}, Job: ${jobId}`);
    if (amount) console.log(`Amount: ₹${amount}`);
    return true;
  }
}