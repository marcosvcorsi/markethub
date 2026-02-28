import { Injectable, Logger } from '@nestjs/common';
import { RabbitSubscribe } from '@golevelup/nestjs-rabbitmq';
import { DomainEvent, Events } from '@markethub/common';
import { MARKETHUB_EXCHANGE } from '@markethub/messaging';
import { ProductCatalogService } from '../product-catalog.service';

interface PaymentCompletedPayload {
  orderId: string;
  paymentId: string;
  amount: number;
  items: Array<{ productId: string; quantity: number }>;
}

@Injectable()
export class PaymentCompletedListener {
  private readonly logger = new Logger(PaymentCompletedListener.name);

  constructor(private readonly productService: ProductCatalogService) {}

  @RabbitSubscribe({
    exchange: MARKETHUB_EXCHANGE,
    routingKey: Events.PAYMENT_COMPLETED,
    queue: 'product-catalog.payment-completed',
    queueOptions: {
      durable: true,
      deadLetterExchange: `${MARKETHUB_EXCHANGE}.dlx`,
      deadLetterRoutingKey: 'product-catalog.payment-completed.dlq',
    },
  })
  async handle(event: DomainEvent<PaymentCompletedPayload>) {
    this.logger.log(
      `Processing payment.completed for order ${event.payload.orderId} [${event.correlationId}]`,
    );

    for (const item of event.payload.items) {
      await this.productService.decrementStock(item.productId, item.quantity);
      this.logger.log(
        `Decremented stock for product ${item.productId} by ${item.quantity}`,
      );
    }
  }
}
