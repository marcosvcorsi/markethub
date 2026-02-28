import { Test, TestingModule } from '@nestjs/testing';
import { PaymentCompletedListener } from '../listeners/payment-completed.listener';
import { ProductCatalogService } from '../product-catalog.service';
import { DomainEvent } from '@markethub/common';

describe('PaymentCompletedListener', () => {
  let listener: PaymentCompletedListener;
  let productService: jest.Mocked<ProductCatalogService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentCompletedListener,
        {
          provide: ProductCatalogService,
          useValue: {
            decrementStock: jest.fn().mockResolvedValue({}),
          },
        },
      ],
    }).compile();

    listener = module.get(PaymentCompletedListener);
    productService = module.get(ProductCatalogService);
  });

  it('should decrement stock for each item in the order', async () => {
    const event: DomainEvent<any> = {
      eventId: 'evt-1',
      eventType: 'payment.completed',
      timestamp: new Date().toISOString(),
      correlationId: 'corr-1',
      payload: {
        orderId: 'order-1',
        paymentId: 'pay-1',
        amount: 100,
        items: [
          { productId: 'prod-1', quantity: 2 },
          { productId: 'prod-2', quantity: 1 },
        ],
      },
    };

    await listener.handle(event);

    expect(productService.decrementStock).toHaveBeenCalledTimes(2);
    expect(productService.decrementStock).toHaveBeenCalledWith('prod-1', 2);
    expect(productService.decrementStock).toHaveBeenCalledWith('prod-2', 1);
  });
});
