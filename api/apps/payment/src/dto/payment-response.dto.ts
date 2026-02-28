import { ApiProperty } from '@nestjs/swagger';

export class CheckoutResponseDto {
  @ApiProperty({ example: 'https://checkout.stripe.com/c/pay/cs_test_...' })
  checkoutUrl: string;
}

export class PaymentResponseDto {
  @ApiProperty({ example: 'uuid-payment-001' })
  id: string;

  @ApiProperty({ example: 'uuid-order-001' })
  orderId: string;

  @ApiProperty({ example: 'cs_test_abc123', nullable: true })
  stripeSessionId: string | null;

  @ApiProperty({ example: 199.98 })
  amount: number;

  @ApiProperty({ example: 'COMPLETED', enum: ['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'REFUNDED'] })
  status: string;

  @ApiProperty({ example: '2026-01-15T10:30:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2026-01-15T10:30:00.000Z' })
  updatedAt: Date;
}
