import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsNotEmpty,
  IsNumber,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';

export class OrderItemDto {
  @ApiProperty({ example: 'product-id-123', description: 'Product ID' })
  @IsString()
  @IsNotEmpty()
  productId: string;

  @ApiProperty({ example: 'Wireless Headphones', description: 'Product name at time of order' })
  @IsString()
  @IsNotEmpty()
  productName: string;

  @ApiProperty({ example: 2, description: 'Quantity to order' })
  @IsNumber()
  @Min(1)
  quantity: number;

  @ApiProperty({ example: 99.99, description: 'Unit price at time of order' })
  @IsNumber()
  @Min(0)
  unitPrice: number;
}

export class CreateOrderDto {
  @ApiProperty({ type: [OrderItemDto], description: 'Order items' })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items: OrderItemDto[];
}
