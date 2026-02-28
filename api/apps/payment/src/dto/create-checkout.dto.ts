import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CreateCheckoutDto {
  @ApiProperty({ example: 'order-id-123', description: 'Order ID to create payment for' })
  @IsString()
  @IsNotEmpty()
  orderId: string;

  @ApiProperty({
    example: 'http://localhost:3000/checkout/success',
    description: 'URL to redirect to on success',
  })
  @IsString()
  @IsNotEmpty()
  successUrl: string;

  @ApiProperty({
    example: 'http://localhost:3000/checkout/cancel',
    description: 'URL to redirect to on cancellation',
  })
  @IsString()
  @IsNotEmpty()
  cancelUrl: string;
}
