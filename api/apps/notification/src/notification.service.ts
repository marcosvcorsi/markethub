import { Injectable, Logger } from '@nestjs/common';
import { EmailService } from './email.service';
import { NotificationGateway } from './notification.gateway';

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(
    private readonly emailService: EmailService,
    private readonly gateway: NotificationGateway,
  ) {}

  async notifyOrderCreated(payload: {
    orderId: string;
    userId: string;
    totalAmount: number;
  }) {
    this.gateway.notifyUser(payload.userId, 'order:created', {
      orderId: payload.orderId,
      totalAmount: payload.totalAmount,
      message: `Your order ${payload.orderId} has been created.`,
    });

    this.logger.log(
      `Notified user ${payload.userId} about order ${payload.orderId} created`,
    );
  }

  async notifyPaymentCompleted(payload: {
    orderId: string;
    paymentId: string;
    userId: string;
  }) {
    this.gateway.notifyUser(payload.userId, 'payment:completed', {
      orderId: payload.orderId,
      paymentId: payload.paymentId,
      message: `Payment for order ${payload.orderId} has been completed.`,
    });

    this.logger.log(
      `Notified user ${payload.userId} about payment completed for order ${payload.orderId}`,
    );
  }

  async notifyPaymentFailed(payload: {
    orderId: string;
    reason: string;
    userId: string;
  }) {
    this.gateway.notifyUser(payload.userId, 'payment:failed', {
      orderId: payload.orderId,
      reason: payload.reason,
      message: `Payment for order ${payload.orderId} has failed: ${payload.reason}`,
    });

    this.logger.log(
      `Notified user ${payload.userId} about payment failed for order ${payload.orderId}`,
    );
  }

  async notifyOrderShipped(payload: {
    orderId: string;
    userId: string;
  }) {
    this.gateway.notifyUser(payload.userId, 'order:shipped', {
      orderId: payload.orderId,
      message: `Your order ${payload.orderId} has been shipped!`,
    });

    this.logger.log(
      `Notified user ${payload.userId} about order ${payload.orderId} shipped`,
    );
  }
}
