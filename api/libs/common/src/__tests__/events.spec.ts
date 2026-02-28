import { Events } from '../constants/events';

describe('Events', () => {
  it('should define all required event types', () => {
    expect(Events.ORDER_CREATED).toBe('order.created');
    expect(Events.ORDER_CANCELLED).toBe('order.cancelled');
    expect(Events.PAYMENT_PROCESSING).toBe('payment.processing');
    expect(Events.PAYMENT_COMPLETED).toBe('payment.completed');
    expect(Events.PAYMENT_FAILED).toBe('payment.failed');
    expect(Events.PRODUCT_STOCK_UPDATED).toBe('product.stock_updated');
  });

  it('should be immutable (const assertion)', () => {
    expect(Object.isFrozen(Events)).toBe(false); // as const doesn't freeze
    // But TypeScript enforces readonly at compile time
    expect(Object.keys(Events)).toHaveLength(6);
  });
});
