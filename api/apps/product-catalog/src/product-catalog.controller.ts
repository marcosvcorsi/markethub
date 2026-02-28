import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '@markethub/common';
import type { UserContext } from '@markethub/common';
import { Public } from '@markethub/auth';
import { ProductCatalogService } from './product-catalog.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductQueryDto } from './dto/product-query.dto';
import { ProductResponseDto, PaginatedProductResponseDto } from './dto/product-response.dto';

@ApiTags('products')
@Controller('products')
export class ProductCatalogController {
  constructor(
    private readonly productCatalogService: ProductCatalogService,
  ) {}

  @Post()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new product' })
  @ApiResponse({ status: 201, description: 'Product created successfully', type: ProductResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async create(
    @Body() dto: CreateProductDto,
    @CurrentUser() user: UserContext,
  ) {
    return this.productCatalogService.create(dto, user.sub);
  }

  @Get()
  @Public()
  @ApiOperation({ summary: 'List products with filters and pagination' })
  @ApiResponse({ status: 200, description: 'Paginated product list', type: PaginatedProductResponseDto })
  async findAll(@Query() query: ProductQueryDto) {
    return this.productCatalogService.findAll(query);
  }

  @Get(':id')
  @Public()
  @ApiOperation({ summary: 'Get a single product by ID' })
  @ApiParam({ name: 'id', description: 'Product ID' })
  @ApiResponse({ status: 200, description: 'Product found', type: ProductResponseDto })
  @ApiResponse({ status: 404, description: 'Product not found' })
  async findById(@Param('id') id: string) {
    return this.productCatalogService.findById(id);
  }

  @Patch(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a product (owner only)' })
  @ApiParam({ name: 'id', description: 'Product ID' })
  @ApiResponse({ status: 200, description: 'Product updated', type: ProductResponseDto })
  @ApiResponse({ status: 400, description: 'Not the product owner' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateProductDto,
    @CurrentUser() user: UserContext,
  ) {
    return this.productCatalogService.update(id, dto, user.sub);
  }

  @Delete(':id')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Soft-delete a product (owner only)' })
  @ApiParam({ name: 'id', description: 'Product ID' })
  @ApiResponse({ status: 204, description: 'Product deleted' })
  @ApiResponse({ status: 400, description: 'Not the product owner' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  async remove(
    @Param('id') id: string,
    @CurrentUser() user: UserContext,
  ) {
    return this.productCatalogService.remove(id, user.sub);
  }
}
