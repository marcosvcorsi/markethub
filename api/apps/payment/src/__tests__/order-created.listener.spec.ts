import { Test, TestingModule } from '@nestjs/testing';
import { PaymentStatus } from '@prisma/client/payment';
import { EventPublisherService } from '@markethub/messaging';
import { OrderCreatedListener } from '../listeners/order-created.listener';
import { PrismaService } from '../prisma.service';

describe('OrderCreatedListener', () => {
  let listener: OrderCreatedListener;
  let prisma: { payment: { create: jest.Mock } };
  let eventPublisher: { publish: jest.Mock };

  beforeEach(async () => {
    prisma = {
      payment: {
        create: jest.fn().mockResolvedValue({ id: 'pay-1' }),
      },
    };

    eventPublisher = {
      publish: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrderCreatedListener,
        { provide: PrismaService, useValue: prisma },
        { provide: EventPublisherService, useValue: eventPublisher },
      ],
    }).compile();

    listener = module.get(OrderCreatedListener);
  });

  it('should create payment record and publish payment.processing event', async () => {
    await listener.handle({
      eventId: 'evt-1',
      eventType: 'order.created',
      timestamp: new Date().toISOString(),
      correlationId: 'corr-1',
      payload: {
        orderId: 'order-1',
        userId: 'user-1',
        totalAmount: 199.98,
        items: [{ productId: 'product-1', quantity: 2 }],
      },
    });

    expect(prisma.payment.create).toHaveBeenCalledWith({
      data: {
        orderId: 'order-1',
        amount: 199.98,
        status: PaymentStatus.PENDING,
      },
    });
    expect(eventPublisher.publish).toHaveBeenCalledWith(
      'payment.processing',
      expect.objectContaining({
        orderId: 'order-1',
        amount: 199.98,
      }),
    );
  });
});
