export const Events = {
  ORDER_CREATED: 'order.created',
  ORDER_CANCELLED: 'order.cancelled',
  PAYMENT_PROCESSING: 'payment.processing',
  PAYMENT_COMPLETED: 'payment.completed',
  PAYMENT_FAILED: 'payment.failed',
  PRODUCT_STOCK_UPDATED: 'product.stock_updated',
} as const;

export type EventType = (typeof Events)[keyof typeof Events];
