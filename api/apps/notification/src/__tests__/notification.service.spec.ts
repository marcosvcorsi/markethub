import { Test, TestingModule } from '@nestjs/testing';
import { NotificationService } from '../notification.service';
import { EmailService } from '../email.service';
import { NotificationGateway } from '../notification.gateway';

describe('NotificationService', () => {
  let service: NotificationService;
  let gateway: { notifyUser: jest.Mock };

  beforeEach(async () => {
    gateway = {
      notifyUser: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationService,
        { provide: EmailService, useValue: { send: jest.fn() } },
        { provide: NotificationGateway, useValue: gateway },
      ],
    }).compile();

    service = module.get(NotificationService);
  });

  it('should send WebSocket notification on order created', async () => {
    await service.notifyOrderCreated({
      orderId: 'order-1',
      userId: 'user-1',
      totalAmount: 199.98,
    });

    expect(gateway.notifyUser).toHaveBeenCalledWith(
      'user-1',
      'order:created',
      expect.objectContaining({
        orderId: 'order-1',
        totalAmount: 199.98,
      }),
    );
  });

  it('should send WebSocket notification on payment completed', async () => {
    await service.notifyPaymentCompleted({
      orderId: 'order-1',
      paymentId: 'pay-1',
      userId: 'user-1',
    });

    expect(gateway.notifyUser).toHaveBeenCalledWith(
      'user-1',
      'payment:completed',
      expect.objectContaining({
        orderId: 'order-1',
        paymentId: 'pay-1',
      }),
    );
  });

  it('should send WebSocket notification on payment failed', async () => {
    await service.notifyPaymentFailed({
      orderId: 'order-1',
      reason: 'Insufficient funds',
      userId: 'user-1',
    });

    expect(gateway.notifyUser).toHaveBeenCalledWith(
      'user-1',
      'payment:failed',
      expect.objectContaining({
        orderId: 'order-1',
        reason: 'Insufficient funds',
      }),
    );
  });

  it('should send WebSocket notification on order shipped', async () => {
    await service.notifyOrderShipped({
      orderId: 'order-1',
      userId: 'user-1',
    });

    expect(gateway.notifyUser).toHaveBeenCalledWith(
      'user-1',
      'order:shipped',
      expect.objectContaining({ orderId: 'order-1' }),
    );
  });
});
