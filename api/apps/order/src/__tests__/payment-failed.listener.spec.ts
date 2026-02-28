import { Test, TestingModule } from '@nestjs/testing';
import { OrderStatus } from '@prisma/client/order';
import { PaymentFailedListener } from '../listeners/payment-failed.listener';
import { OrderService } from '../order.service';

describe('PaymentFailedListener', () => {
  let listener: PaymentFailedListener;
  let orderService: { transition: jest.Mock };

  beforeEach(async () => {
    orderService = {
      transition: jest.fn().mockResolvedValue({ id: 'order-1', status: OrderStatus.FAILED }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentFailedListener,
        { provide: OrderService, useValue: orderService },
      ],
    }).compile();

    listener = module.get(PaymentFailedListener);
  });

  it('should transition order to FAILED on payment.failed', async () => {
    await listener.handle({
      eventId: 'evt-1',
      eventType: 'payment.failed',
      timestamp: new Date().toISOString(),
      correlationId: 'corr-1',
      payload: {
        orderId: 'order-1',
        reason: 'Insufficient funds',
      },
    });

    expect(orderService.transition).toHaveBeenCalledWith(
      'order-1',
      OrderStatus.FAILED,
    );
  });
});
