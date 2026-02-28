import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import request from 'supertest';
import { PaymentStatus } from '@prisma/client/payment';
import { Events } from '@markethub/common';
import { EventPublisherService } from '@markethub/messaging';
import { PrismaService } from '../src/prisma.service';
import { PaymentService } from '../src/payment.service';
import { PaymentController } from '../src/payment.controller';
import { StripeService } from '../src/stripe.service';
import { MockAuthGuard } from '../../../test/helpers/auth.helper';
import { MockEventPublisher } from '../../../test/helpers/messaging.helper';

class MockStripeService {
  async createCheckoutSession(params: {
    orderId: string;
    amount: number;
    items: Array<{ name: string; quantity: number; unitPrice: number }>;
    successUrl: string;
    cancelUrl: string;
  }) {
    return {
      id: `cs_test_${params.orderId}`,
      url: 'https://checkout.stripe.com/test',
    };
  }

  constructWebhookEvent(payload: Buffer, _signature: string) {
    return JSON.parse(payload.toString());
  }
}

describe('Payment (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let eventPublisher: MockEventPublisher;

  beforeAll(async () => {
    eventPublisher = new MockEventPublisher();

    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [PaymentController],
      providers: [
        PrismaService,
        PaymentService,
        { provide: StripeService, useClass: MockStripeService },
        { provide: APP_GUARD, useValue: new MockAuthGuard() },
        { provide: EventPublisherService, useValue: eventPublisher },
      ],
    }).compile();

    app = moduleFixture.createNestApplication({ rawBody: true });
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, transform: true }),
    );
    await app.init();

    prisma = app.get(PrismaService);
  });

  beforeEach(async () => {
    await prisma.payment.deleteMany();
    eventPublisher.clear();
  });

  afterAll(async () => {
    await prisma.payment.deleteMany();
    await prisma.$disconnect();
    await app.close();
  });

  describe('POST /payments/checkout', () => {
    it('should create a checkout session', async () => {
      const res = await request(app.getHttpServer())
        .post('/payments/checkout')
        .send({
          orderId: 'order-001',
          successUrl: 'http://localhost/success',
          cancelUrl: 'http://localhost/cancel',
        })
        .expect(201);

      expect(res.body.checkoutUrl).toBeDefined();

      const payment = await prisma.payment.findFirst({
        where: { orderId: 'order-001' },
      });
      expect(payment).not.toBeNull();
      expect(payment!.status).toBe(PaymentStatus.PROCESSING);
    });

    it('should reject duplicate checkout for same order', async () => {
      await prisma.payment.create({
        data: {
          orderId: 'order-dup',
          amount: 100,
          status: PaymentStatus.PROCESSING,
          stripeSessionId: 'cs_existing',
        },
      });

      return request(app.getHttpServer())
        .post('/payments/checkout')
        .send({
          orderId: 'order-dup',
          successUrl: 'http://localhost/success',
          cancelUrl: 'http://localhost/cancel',
        })
        .expect(400);
    });
  });

  describe('POST /payments/webhook', () => {
    it('should handle checkout.session.completed', async () => {
      await prisma.payment.create({
        data: {
          orderId: 'order-wh-1',
          amount: 100,
          status: PaymentStatus.PROCESSING,
          stripeSessionId: 'cs_completed_session',
        },
      });

      await request(app.getHttpServer())
        .post('/payments/webhook')
        .set('stripe-signature', 'test_sig')
        .send({
          type: 'checkout.session.completed',
          data: { object: { id: 'cs_completed_session' } },
        })
        .expect(200);

      const payment = await prisma.payment.findFirst({
        where: { stripeSessionId: 'cs_completed_session' },
      });
      expect(payment!.status).toBe(PaymentStatus.COMPLETED);

      const events = eventPublisher.findByType(Events.PAYMENT_COMPLETED);
      expect(events).toHaveLength(1);
      expect(events[0].payload).toMatchObject({
        orderId: 'order-wh-1',
      });
    });

    it('should handle checkout.session.expired', async () => {
      await prisma.payment.create({
        data: {
          orderId: 'order-wh-2',
          amount: 50,
          status: PaymentStatus.PROCESSING,
          stripeSessionId: 'cs_expired_session',
        },
      });

      await request(app.getHttpServer())
        .post('/payments/webhook')
        .set('stripe-signature', 'test_sig')
        .send({
          type: 'checkout.session.expired',
          data: { object: { id: 'cs_expired_session' } },
        })
        .expect(200);

      const payment = await prisma.payment.findFirst({
        where: { stripeSessionId: 'cs_expired_session' },
      });
      expect(payment!.status).toBe(PaymentStatus.FAILED);

      const events = eventPublisher.findByType(Events.PAYMENT_FAILED);
      expect(events).toHaveLength(1);
    });
  });

  describe('GET /payments/order/:orderId', () => {
    it('should return payment by order ID', async () => {
      await prisma.payment.create({
        data: {
          orderId: 'order-get-1',
          amount: 75.50,
          status: PaymentStatus.COMPLETED,
          stripeSessionId: 'cs_get_test',
        },
      });

      return request(app.getHttpServer())
        .get('/payments/order/order-get-1')
        .expect(200)
        .expect((res) => {
          expect(res.body.orderId).toBe('order-get-1');
          expect(res.body.status).toBe(PaymentStatus.COMPLETED);
        });
    });
  });
});
