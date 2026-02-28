import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class OrderItemResponseDto {
  @ApiProperty({ example: 'uuid-item-001' })
  id: string;

  @ApiProperty({ example: 'prod-001' })
  productId: string;

  @ApiProperty({ example: 'Wireless Headphones' })
  productName: string;

  @ApiProperty({ example: 2 })
  quantity: number;

  @ApiProperty({ example: 99.99 })
  unitPrice: number;
}

export class OrderResponseDto {
  @ApiProperty({ example: 'uuid-order-001' })
  id: string;

  @ApiProperty({ example: 'user-uuid-123' })
  userId: string;

  @ApiProperty({ example: 'PENDING', enum: ['PENDING', 'PAYMENT_PROCESSING', 'PAID', 'FAILED', 'SHIPPED', 'DELIVERED', 'CANCELLED'] })
  status: string;

  @ApiProperty({ example: 199.98 })
  totalAmount: number;

  @ApiProperty({ type: [OrderItemResponseDto] })
  items: OrderItemResponseDto[];

  @ApiProperty({ example: '2026-01-15T10:30:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2026-01-15T10:30:00.000Z' })
  updatedAt: Date;
}

export class PaginationMetaDto {
  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: 10 })
  limit: number;

  @ApiProperty({ example: 5 })
  total: number;

  @ApiProperty({ example: 1 })
  totalPages: number;
}

export class PaginatedOrderResponseDto {
  @ApiProperty({ type: [OrderResponseDto] })
  data: OrderResponseDto[];

  @ApiProperty({ type: PaginationMetaDto })
  meta: PaginationMetaDto;
}
