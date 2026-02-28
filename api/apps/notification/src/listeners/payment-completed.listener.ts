import { Injectable, Logger } from '@nestjs/common';
import { RabbitSubscribe } from '@golevelup/nestjs-rabbitmq';
import { Events } from '@markethub/common';
import type { DomainEvent } from '@markethub/common';
import { MARKETHUB_EXCHANGE } from '@markethub/messaging';
import { NotificationService } from '../notification.service';

interface PaymentCompletedPayload {
  orderId: string;
  paymentId: string;
  amount: number;
}

@Injectable()
export class PaymentCompletedListener {
  private readonly logger = new Logger(PaymentCompletedListener.name);

  constructor(private readonly notificationService: NotificationService) {}

  @RabbitSubscribe({
    exchange: MARKETHUB_EXCHANGE,
    routingKey: Events.PAYMENT_COMPLETED,
    queue: 'notification.payment-completed',
    queueOptions: {
      durable: true,
      deadLetterExchange: `${MARKETHUB_EXCHANGE}.dlx`,
      deadLetterRoutingKey: 'notification.payment-completed.dlq',
    },
  })
  async handle(event: DomainEvent<PaymentCompletedPayload>) {
    this.logger.log(
      `Processing payment.completed notification for order ${event.payload.orderId} [${event.correlationId}]`,
    );

    // In a real app, we'd look up the userId from the order service
    // For now, we use a placeholder - the gateway will resolve the proper auth context
    await this.notificationService.notifyPaymentCompleted({
      ...event.payload,
      userId: '', // Resolved via order context in production
    });
  }
}
