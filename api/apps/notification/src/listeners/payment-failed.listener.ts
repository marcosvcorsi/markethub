import { Injectable, Logger } from '@nestjs/common';
import { RabbitSubscribe } from '@golevelup/nestjs-rabbitmq';
import { DomainEvent, Events } from '@markethub/common';
import { MARKETHUB_EXCHANGE } from '@markethub/messaging';
import { NotificationService } from '../notification.service';

interface PaymentFailedPayload {
  orderId: string;
  reason: string;
}

@Injectable()
export class PaymentFailedListener {
  private readonly logger = new Logger(PaymentFailedListener.name);

  constructor(private readonly notificationService: NotificationService) {}

  @RabbitSubscribe({
    exchange: MARKETHUB_EXCHANGE,
    routingKey: Events.PAYMENT_FAILED,
    queue: 'notification.payment-failed',
    queueOptions: {
      durable: true,
      deadLetterExchange: `${MARKETHUB_EXCHANGE}.dlx`,
      deadLetterRoutingKey: 'notification.payment-failed.dlq',
    },
  })
  async handle(event: DomainEvent<PaymentFailedPayload>) {
    this.logger.log(
      `Processing payment.failed notification for order ${event.payload.orderId} [${event.correlationId}]`,
    );

    await this.notificationService.notifyPaymentFailed({
      ...event.payload,
      userId: '', // Resolved via order context in production
    });
  }
}
