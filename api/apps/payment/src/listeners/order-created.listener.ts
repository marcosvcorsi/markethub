import { Injectable, Logger } from '@nestjs/common';
import { RabbitSubscribe } from '@golevelup/nestjs-rabbitmq';
import { PaymentStatus } from '@prisma/client/payment';
import { Events } from '@markethub/common';
import type { DomainEvent } from '@markethub/common';
import { MARKETHUB_EXCHANGE, EventPublisherService } from '@markethub/messaging';
import { PrismaService } from '../prisma.service';

interface OrderCreatedPayload {
  orderId: string;
  userId: string;
  totalAmount: number;
  items: Array<{ productId: string; quantity: number }>;
}

@Injectable()
export class OrderCreatedListener {
  private readonly logger = new Logger(OrderCreatedListener.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventPublisher: EventPublisherService,
  ) {}

  @RabbitSubscribe({
    exchange: MARKETHUB_EXCHANGE,
    routingKey: Events.ORDER_CREATED,
    queue: 'payment.order-created',
    queueOptions: {
      durable: true,
      deadLetterExchange: `${MARKETHUB_EXCHANGE}.dlx`,
      deadLetterRoutingKey: 'payment.order-created.dlq',
    },
  })
  async handle(event: DomainEvent<OrderCreatedPayload>) {
    this.logger.log(
      `Processing order.created for order ${event.payload.orderId} [${event.correlationId}]`,
    );

    await this.prisma.payment.create({
      data: {
        orderId: event.payload.orderId,
        amount: event.payload.totalAmount,
        status: PaymentStatus.PENDING,
      },
    });

    await this.eventPublisher.publish(Events.PAYMENT_PROCESSING, {
      orderId: event.payload.orderId,
      amount: event.payload.totalAmount,
    });

    this.logger.log(
      `Payment record created for order ${event.payload.orderId}`,
    );
  }
}
