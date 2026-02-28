import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { PaginationDto } from '@markethub/common';

export enum ProductSortBy {
  PRICE_ASC = 'price_asc',
  PRICE_DESC = 'price_desc',
  NEWEST = 'newest',
  NAME = 'name',
}

export class ProductQueryDto extends PaginationDto {
  @ApiPropertyOptional({ example: 'headphones', description: 'Text search query' })
  @IsString()
  @IsOptional()
  q?: string;

  @ApiPropertyOptional({ example: 'Electronics', description: 'Filter by category' })
  @IsString()
  @IsOptional()
  category?: string;

  @ApiPropertyOptional({ example: 10, description: 'Minimum price filter' })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @IsOptional()
  minPrice?: number;

  @ApiPropertyOptional({ example: 500, description: 'Maximum price filter' })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @IsOptional()
  maxPrice?: number;

  @ApiPropertyOptional({ enum: ProductSortBy, description: 'Sort order' })
  @IsEnum(ProductSortBy)
  @IsOptional()
  sortBy?: ProductSortBy;
}
