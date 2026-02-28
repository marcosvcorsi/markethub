import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class CreateProductDto {
  @ApiProperty({ example: 'Wireless Headphones', description: 'Product name' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'High-quality wireless headphones with noise cancellation' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({ example: 99.99, description: 'Price in USD' })
  @IsNumber()
  @Min(0)
  price: number;

  @ApiProperty({ example: 50, description: 'Available stock quantity' })
  @IsNumber()
  @Min(0)
  stock: number;

  @ApiProperty({ example: 'Electronics', description: 'Product category' })
  @IsString()
  @IsNotEmpty()
  category: string;

  @ApiProperty({
    example: ['https://example.com/image1.jpg'],
    description: 'Product image URLs',
    required: false,
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  images?: string[];
}
