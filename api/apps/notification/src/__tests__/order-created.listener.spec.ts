import { Test, TestingModule } from '@nestjs/testing';
import { OrderCreatedListener } from '../listeners/order-created.listener';
import { NotificationService } from '../notification.service';

describe('OrderCreatedListener', () => {
  let listener: OrderCreatedListener;
  let notificationService: { notifyOrderCreated: jest.Mock };

  beforeEach(async () => {
    notificationService = {
      notifyOrderCreated: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrderCreatedListener,
        { provide: NotificationService, useValue: notificationService },
      ],
    }).compile();

    listener = module.get(OrderCreatedListener);
  });

  it('should call notifyOrderCreated on order.created event', async () => {
    await listener.handle({
      eventId: 'evt-1',
      eventType: 'order.created',
      timestamp: new Date().toISOString(),
      correlationId: 'corr-1',
      payload: {
        orderId: 'order-1',
        userId: 'user-1',
        totalAmount: 199.98,
        items: [{ productId: 'p1', quantity: 2 }],
      },
    });

    expect(notificationService.notifyOrderCreated).toHaveBeenCalledWith(
      expect.objectContaining({
        orderId: 'order-1',
        userId: 'user-1',
        totalAmount: 199.98,
      }),
    );
  });
});
