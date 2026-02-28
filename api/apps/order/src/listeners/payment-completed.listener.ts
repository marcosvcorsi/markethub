import { Injectable, Logger } from '@nestjs/common';
import { RabbitSubscribe } from '@golevelup/nestjs-rabbitmq';
import { DomainEvent, Events } from '@markethub/common';
import { MARKETHUB_EXCHANGE } from '@markethub/messaging';
import { OrderStatus } from '@prisma/client/order';
import { OrderService } from '../order.service';

interface PaymentCompletedPayload {
  orderId: string;
  paymentId: string;
  amount: number;
  items: Array<{ productId: string; quantity: number }>;
}

@Injectable()
export class PaymentCompletedListener {
  private readonly logger = new Logger(PaymentCompletedListener.name);

  constructor(private readonly orderService: OrderService) {}

  @RabbitSubscribe({
    exchange: MARKETHUB_EXCHANGE,
    routingKey: Events.PAYMENT_COMPLETED,
    queue: 'order.payment-completed',
    queueOptions: {
      durable: true,
      deadLetterExchange: `${MARKETHUB_EXCHANGE}.dlx`,
      deadLetterRoutingKey: 'order.payment-completed.dlq',
    },
  })
  async handle(event: DomainEvent<PaymentCompletedPayload>) {
    this.logger.log(
      `Processing payment.completed for order ${event.payload.orderId} [${event.correlationId}]`,
    );

    await this.orderService.transition(
      event.payload.orderId,
      OrderStatus.PAID,
    );

    this.logger.log(
      `Order ${event.payload.orderId} transitioned to PAID`,
    );
  }
}
