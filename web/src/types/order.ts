export enum OrderStatus {
  PENDING = "PENDING",
  PAYMENT_PROCESSING = "PAYMENT_PROCESSING",
  PAID = "PAID",
  FAILED = "FAILED",
  SHIPPED = "SHIPPED",
  DELIVERED = "DELIVERED",
  CANCELLED = "CANCELLED",
}

export interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
}

export interface Order {
  id: string;
  userId: string;
  status: OrderStatus;
  totalAmount: number;
  items: OrderItem[];
  createdAt: string;
  updatedAt: string;
}

export interface OrderQuery {
  page?: number;
  limit?: number;
  status?: OrderStatus;
}

export const CANCELLABLE_STATUSES: OrderStatus[] = [
  OrderStatus.PENDING,
  OrderStatus.PAID,
];
