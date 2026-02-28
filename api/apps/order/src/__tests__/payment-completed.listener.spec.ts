import { Test, TestingModule } from '@nestjs/testing';
import { OrderStatus } from '@prisma/client/order';
import { PaymentCompletedListener } from '../listeners/payment-completed.listener';
import { OrderService } from '../order.service';

describe('PaymentCompletedListener', () => {
  let listener: PaymentCompletedListener;
  let orderService: { transition: jest.Mock };

  beforeEach(async () => {
    orderService = {
      transition: jest.fn().mockResolvedValue({ id: 'order-1', status: OrderStatus.PAID }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentCompletedListener,
        { provide: OrderService, useValue: orderService },
      ],
    }).compile();

    listener = module.get(PaymentCompletedListener);
  });

  it('should transition order to PAID on payment.completed', async () => {
    await listener.handle({
      eventId: 'evt-1',
      eventType: 'payment.completed',
      timestamp: new Date().toISOString(),
      correlationId: 'corr-1',
      payload: {
        orderId: 'order-1',
        paymentId: 'pay-1',
        amount: 199.98,
        items: [{ productId: 'product-1', quantity: 2 }],
      },
    });

    expect(orderService.transition).toHaveBeenCalledWith(
      'order-1',
      OrderStatus.PAID,
    );
  });
});
