import { Injectable, Logger } from '@nestjs/common';
import { RabbitSubscribe } from '@golevelup/nestjs-rabbitmq';
import { DomainEvent, Events } from '@markethub/common';
import { MARKETHUB_EXCHANGE } from '@markethub/messaging';
import { NotificationService } from '../notification.service';

interface OrderCreatedPayload {
  orderId: string;
  userId: string;
  totalAmount: number;
  items: Array<{ productId: string; quantity: number }>;
}

@Injectable()
export class OrderCreatedListener {
  private readonly logger = new Logger(OrderCreatedListener.name);

  constructor(private readonly notificationService: NotificationService) {}

  @RabbitSubscribe({
    exchange: MARKETHUB_EXCHANGE,
    routingKey: Events.ORDER_CREATED,
    queue: 'notification.order-created',
    queueOptions: {
      durable: true,
      deadLetterExchange: `${MARKETHUB_EXCHANGE}.dlx`,
      deadLetterRoutingKey: 'notification.order-created.dlq',
    },
  })
  async handle(event: DomainEvent<OrderCreatedPayload>) {
    this.logger.log(
      `Processing order.created notification for ${event.payload.orderId} [${event.correlationId}]`,
    );

    await this.notificationService.notifyOrderCreated(event.payload);
  }
}
