import { ApiProperty } from '@nestjs/swagger';

export class ProductResponseDto {
  @ApiProperty({ example: '507f1f77bcf86cd799439011' })
  id: string;

  @ApiProperty({ example: 'Wireless Headphones' })
  name: string;

  @ApiProperty({ example: 'High-quality wireless headphones with noise cancellation' })
  description: string;

  @ApiProperty({ example: 99.99 })
  price: number;

  @ApiProperty({ example: 50 })
  stock: number;

  @ApiProperty({ example: 'Electronics' })
  category: string;

  @ApiProperty({ example: ['https://example.com/img.jpg'], type: [String] })
  images: string[];

  @ApiProperty({ example: 'seller-uuid-123' })
  sellerId: string;

  @ApiProperty({ example: true })
  isActive: boolean;

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

  @ApiProperty({ example: 25 })
  total: number;

  @ApiProperty({ example: 3 })
  totalPages: number;
}

export class PaginatedProductResponseDto {
  @ApiProperty({ type: [ProductResponseDto] })
  data: ProductResponseDto[];

  @ApiProperty({ type: PaginationMetaDto })
  meta: PaginationMetaDto;
}
