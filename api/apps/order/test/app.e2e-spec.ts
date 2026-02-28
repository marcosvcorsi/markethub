import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import request from 'supertest';
import { OrderStatus } from '@prisma/client/order';
import { Events } from '@markethub/common';
import { EventPublisherService } from '@markethub/messaging';
import { PrismaService } from '../src/prisma.service';
import { OrderService } from '../src/order.service';
import { OrderController } from '../src/order.controller';
import { MockAuthGuard, TEST_USER } from '../../../test/helpers/auth.helper';
import { MockEventPublisher } from '../../../test/helpers/messaging.helper';

describe('Order (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let eventPublisher: MockEventPublisher;

  beforeAll(async () => {
    eventPublisher = new MockEventPublisher();

    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [OrderController],
      providers: [
        PrismaService,
        OrderService,
        { provide: APP_GUARD, useValue: new MockAuthGuard() },
        { provide: EventPublisherService, useValue: eventPublisher },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, transform: true }),
    );
    await app.init();

    prisma = app.get(PrismaService);
  });

  beforeEach(async () => {
    await prisma.orderItem.deleteMany();
    await prisma.order.deleteMany();
    eventPublisher.clear();
  });

  afterAll(async () => {
    await prisma.orderItem.deleteMany();
    await prisma.order.deleteMany();
    await prisma.$disconnect();
    await app.close();
  });

  const orderPayload = {
    items: [
      {
        productId: 'prod-001',
        productName: 'Wireless Headphones',
        quantity: 2,
        unitPrice: 99.99,
      },
    ],
  };

  describe('POST /orders', () => {
    it('should create an order and publish order.created event', async () => {
      const res = await request(app.getHttpServer())
        .post('/orders')
        .send(orderPayload)
        .expect(201);

      expect(res.body).toMatchObject({
        userId: TEST_USER.sub,
        status: OrderStatus.PENDING,
      });
      expect(res.body.items).toHaveLength(1);
      expect(Number(res.body.totalAmount)).toBeCloseTo(199.98);

      const events = eventPublisher.findByType(Events.ORDER_CREATED);
      expect(events).toHaveLength(1);
      expect(events[0].payload).toMatchObject({
        orderId: res.body.id,
        userId: TEST_USER.sub,
      });
    });

    it('should reject order with empty items', () => {
      return request(app.getHttpServer())
        .post('/orders')
        .send({ items: [] })
        .expect(400);
    });
  });

  describe('GET /orders', () => {
    it('should list current user orders', async () => {
      await prisma.order.create({
        data: {
          userId: TEST_USER.sub,
          totalAmount: 99.99,
          items: {
            create: [
              {
                productId: 'prod-001',
                productName: 'Headphones',
                quantity: 1,
                unitPrice: 99.99,
              },
            ],
          },
        },
      });

      // Another user's order — should not appear
      await prisma.order.create({
        data: {
          userId: 'other-user-id',
          totalAmount: 50,
          items: {
            create: [
              {
                productId: 'prod-002',
                productName: 'Cable',
                quantity: 1,
                unitPrice: 50,
              },
            ],
          },
        },
      });

      return request(app.getHttpServer())
        .get('/orders')
        .expect(200)
        .expect((res) => {
          expect(res.body.data).toHaveLength(1);
          expect(res.body.data[0].userId).toBe(TEST_USER.sub);
          expect(res.body.meta.total).toBe(1);
        });
    });
  });

  describe('GET /orders/:id', () => {
    it('should return order by ID (owner)', async () => {
      const order = await prisma.order.create({
        data: {
          userId: TEST_USER.sub,
          totalAmount: 99.99,
          items: {
            create: [
              {
                productId: 'prod-001',
                productName: 'Headphones',
                quantity: 1,
                unitPrice: 99.99,
              },
            ],
          },
        },
      });

      return request(app.getHttpServer())
        .get(`/orders/${order.id}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.id).toBe(order.id);
          expect(res.body.items).toHaveLength(1);
        });
    });

    it('should return 404 for non-existent order', () => {
      return request(app.getHttpServer())
        .get('/orders/00000000-0000-0000-0000-000000000000')
        .expect(404);
    });
  });

  describe('POST /orders/:id/cancel', () => {
    it('should cancel a PENDING order and publish order.cancelled event', async () => {
      const order = await prisma.order.create({
        data: {
          userId: TEST_USER.sub,
          status: OrderStatus.PENDING,
          totalAmount: 99.99,
          items: {
            create: [
              {
                productId: 'prod-001',
                productName: 'Headphones',
                quantity: 1,
                unitPrice: 99.99,
              },
            ],
          },
        },
      });

      const res = await request(app.getHttpServer())
        .post(`/orders/${order.id}/cancel`)
        .expect(200);

      expect(res.body.status).toBe(OrderStatus.CANCELLED);

      const events = eventPublisher.findByType(Events.ORDER_CANCELLED);
      expect(events).toHaveLength(1);
      expect(events[0].payload).toMatchObject({
        orderId: order.id,
      });
    });

    it('should reject cancel on DELIVERED order', async () => {
      const order = await prisma.order.create({
        data: {
          userId: TEST_USER.sub,
          status: OrderStatus.DELIVERED,
          totalAmount: 99.99,
          items: {
            create: [
              {
                productId: 'prod-001',
                productName: 'Headphones',
                quantity: 1,
                unitPrice: 99.99,
              },
            ],
          },
        },
      });

      return request(app.getHttpServer())
        .post(`/orders/${order.id}/cancel`)
        .expect(400);
    });
  });
});
