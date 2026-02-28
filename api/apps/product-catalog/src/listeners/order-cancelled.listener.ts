import { Injectable, Logger } from '@nestjs/common';
import { RabbitSubscribe } from '@golevelup/nestjs-rabbitmq';
import { DomainEvent, Events } from '@markethub/common';
import { MARKETHUB_EXCHANGE } from '@markethub/messaging';
import { ProductCatalogService } from '../product-catalog.service';

interface OrderCancelledPayload {
  orderId: string;
  reason: string;
  items: Array<{ productId: string; quantity: number }>;
}

@Injectable()
export class OrderCancelledListener {
  private readonly logger = new Logger(OrderCancelledListener.name);

  constructor(private readonly productService: ProductCatalogService) {}

  @RabbitSubscribe({
    exchange: MARKETHUB_EXCHANGE,
    routingKey: Events.ORDER_CANCELLED,
    queue: 'product-catalog.order-cancelled',
    queueOptions: {
      durable: true,
      deadLetterExchange: `${MARKETHUB_EXCHANGE}.dlx`,
      deadLetterRoutingKey: 'product-catalog.order-cancelled.dlq',
    },
  })
  async handle(event: DomainEvent<OrderCancelledPayload>) {
    this.logger.log(
      `Processing order.cancelled for order ${event.payload.orderId} [${event.correlationId}]`,
    );

    for (const item of event.payload.items) {
      await this.productService.restoreStock(item.productId, item.quantity);
      this.logger.log(
        `Restored stock for product ${item.productId} by ${item.quantity}`,
      );
    }
  }
}
