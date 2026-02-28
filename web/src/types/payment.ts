export enum PaymentStatus {
  PENDING = "PENDING",
  PROCESSING = "PROCESSING",
  COMPLETED = "COMPLETED",
  FAILED = "FAILED",
  REFUNDED = "REFUNDED",
}

export interface Payment {
  id: string;
  orderId: string;
  stripeSessionId: string | null;
  amount: number;
  status: PaymentStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CheckoutResponse {
  checkoutUrl: string;
}
