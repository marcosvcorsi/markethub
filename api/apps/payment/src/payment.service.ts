import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Payment, PaymentStatus } from '@prisma/client/payment';
import { Events } from '@markethub/common';
import { EventPublisherService } from '@markethub/messaging';
import { PrismaService } from './prisma.service';
import { StripeService } from './stripe.service';

@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly stripe: StripeService,
    private readonly eventPublisher: EventPublisherService,
  ) {}

  async createCheckoutSession(params: {
    orderId: string;
    amount: number;
    items: Array<{ productId: string; name: string; quantity: number; unitPrice: number }>;
    successUrl: string;
    cancelUrl: string;
  }): Promise<{ checkoutUrl: string }> {
    const existing = await this.prisma.payment.findFirst({
      where: { orderId: params.orderId, status: { in: [PaymentStatus.PROCESSING, PaymentStatus.COMPLETED] } },
    });

    if (existing) {
      throw new BadRequestException(
        `Payment already exists for order "${params.orderId}"`,
      );
    }

    const session = await this.stripe.createCheckoutSession({
      orderId: params.orderId,
      amount: params.amount,
      items: params.items,
      successUrl: params.successUrl,
      cancelUrl: params.cancelUrl,
    });

    await this.prisma.payment.create({
      data: {
        orderId: params.orderId,
        stripeSessionId: session.id,
        amount: params.amount,
        status: PaymentStatus.PROCESSING,
      },
    });

    return { checkoutUrl: session.url! };
  }

  async handleWebhookEvent(event: {
    type: string;
    data: { object: { id: string; metadata?: { orderId?: string } } };
  }): Promise<void> {
    if (event.type === 'checkout.session.completed') {
      const sessionId = event.data.object.id;
      const payment = await this.prisma.payment.findFirst({
        where: { stripeSessionId: sessionId },
      });

      if (!payment) {
        this.logger.warn(`No payment found for Stripe session ${sessionId}`);
        return;
      }

      await this.prisma.payment.update({
        where: { id: payment.id },
        data: { status: PaymentStatus.COMPLETED },
      });

      await this.eventPublisher.publish(Events.PAYMENT_COMPLETED, {
        orderId: payment.orderId,
        paymentId: payment.id,
        amount: Number(payment.amount),
      });

      this.logger.log(
        `Payment ${payment.id} completed for order ${payment.orderId}`,
      );
    }

    if (event.type === 'checkout.session.expired') {
      const sessionId = event.data.object.id;
      const payment = await this.prisma.payment.findFirst({
        where: { stripeSessionId: sessionId },
      });

      if (!payment) return;

      await this.prisma.payment.update({
        where: { id: payment.id },
        data: { status: PaymentStatus.FAILED },
      });

      await this.eventPublisher.publish(Events.PAYMENT_FAILED, {
        orderId: payment.orderId,
        reason: 'Checkout session expired',
      });

      this.logger.log(
        `Payment ${payment.id} failed for order ${payment.orderId}`,
      );
    }
  }

  async findByOrderId(orderId: string): Promise<Payment> {
    const payment = await this.prisma.payment.findFirst({
      where: { orderId },
      orderBy: { createdAt: 'desc' },
    });

    if (!payment) {
      throw new NotFoundException(
        `Payment for order "${orderId}" not found`,
      );
    }

    return payment;
  }
}
