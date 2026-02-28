import { Test, TestingModule } from '@nestjs/testing';
import { OrderCancelledListener } from '../listeners/order-cancelled.listener';
import { ProductCatalogService } from '../product-catalog.service';
import { DomainEvent } from '@markethub/common';

describe('OrderCancelledListener', () => {
  let listener: OrderCancelledListener;
  let productService: jest.Mocked<ProductCatalogService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrderCancelledListener,
        {
          provide: ProductCatalogService,
          useValue: {
            restoreStock: jest.fn().mockResolvedValue({}),
          },
        },
      ],
    }).compile();

    listener = module.get(OrderCancelledListener);
    productService = module.get(ProductCatalogService);
  });

  it('should restore stock for each item when order is cancelled', async () => {
    const event: DomainEvent<any> = {
      eventId: 'evt-1',
      eventType: 'order.cancelled',
      timestamp: new Date().toISOString(),
      correlationId: 'corr-1',
      payload: {
        orderId: 'order-1',
        reason: 'Customer request',
        items: [
          { productId: 'prod-1', quantity: 2 },
          { productId: 'prod-3', quantity: 5 },
        ],
      },
    };

    await listener.handle(event);

    expect(productService.restoreStock).toHaveBeenCalledTimes(2);
    expect(productService.restoreStock).toHaveBeenCalledWith('prod-1', 2);
    expect(productService.restoreStock).toHaveBeenCalledWith('prod-3', 5);
  });
});
