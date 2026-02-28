import { Injectable, Logger } from '@nestjs/common';
import { RabbitSubscribe } from '@golevelup/nestjs-rabbitmq';
import { Events } from '@markethub/common';
import type { DomainEvent } from '@markethub/common';
import { MARKETHUB_EXCHANGE } from '@markethub/messaging';
import { OrderStatus } from '@prisma/client/order';
import { OrderService } from '../order.service';

interface PaymentFailedPayload {
  orderId: string;
  reason: string;
}

@Injectable()
export class PaymentFailedListener {
  private readonly logger = new Logger(PaymentFailedListener.name);

  constructor(private readonly orderService: OrderService) {}

  @RabbitSubscribe({
    exchange: MARKETHUB_EXCHANGE,
    routingKey: Events.PAYMENT_FAILED,
    queue: 'order.payment-failed',
    queueOptions: {
      durable: true,
      deadLetterExchange: `${MARKETHUB_EXCHANGE}.dlx`,
      deadLetterRoutingKey: 'order.payment-failed.dlq',
    },
  })
  async handle(event: DomainEvent<PaymentFailedPayload>) {
    this.logger.log(
      `Processing payment.failed for order ${event.payload.orderId}: ${event.payload.reason} [${event.correlationId}]`,
    );

    await this.orderService.transition(
      event.payload.orderId,
      OrderStatus.FAILED,
    );

    this.logger.log(
      `Order ${event.payload.orderId} transitioned to FAILED`,
    );
  }
}
