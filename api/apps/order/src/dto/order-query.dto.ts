import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { PaginationDto } from '@markethub/common';
import { OrderStatus } from '@prisma/client/order';

export class OrderQueryDto extends PaginationDto {
  @ApiPropertyOptional({ enum: OrderStatus, description: 'Filter by order status' })
  @IsEnum(OrderStatus)
  @IsOptional()
  status?: OrderStatus;
}
