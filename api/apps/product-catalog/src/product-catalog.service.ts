import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, Product } from '@prisma/client/product-catalog';
import { PaginatedResponse } from '@markethub/common';
import { PrismaService } from './prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductQueryDto, ProductSortBy } from './dto/product-query.dto';

@Injectable()
export class ProductCatalogService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateProductDto, sellerId: string): Promise<Product> {
    return this.prisma.product.create({
      data: { ...dto, sellerId },
    });
  }

  async findAll(
    query: ProductQueryDto,
  ): Promise<PaginatedResponse<Product>> {
    const where = this.buildWhere(query);
    const orderBy = this.buildOrderBy(query.sortBy);

    const [data, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        orderBy,
        skip: query.skip,
        take: query.limit,
      }),
      this.prisma.product.count({ where }),
    ]);

    return new PaginatedResponse(data, total, query);
  }

  async findById(id: string): Promise<Product> {
    const product = await this.prisma.product.findUnique({ where: { id } });
    if (!product) {
      throw new NotFoundException(`Product with ID "${id}" not found`);
    }
    return product;
  }

  async update(
    id: string,
    dto: UpdateProductDto,
    sellerId: string,
  ): Promise<Product> {
    const product = await this.findById(id);

    if (product.sellerId !== sellerId) {
      throw new BadRequestException('You can only update your own products');
    }

    return this.prisma.product.update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: string, sellerId: string): Promise<void> {
    const product = await this.findById(id);

    if (product.sellerId !== sellerId) {
      throw new BadRequestException('You can only delete your own products');
    }

    await this.prisma.product.update({
      where: { id },
      data: { isActive: false },
    });
  }

  async decrementStock(productId: string, quantity: number): Promise<Product> {
    const product = await this.findById(productId);

    if (product.stock < quantity) {
      throw new BadRequestException(
        `Insufficient stock for product "${product.name}". Available: ${product.stock}, requested: ${quantity}`,
      );
    }

    return this.prisma.product.update({
      where: { id: productId },
      data: { stock: { decrement: quantity } },
    });
  }

  async restoreStock(productId: string, quantity: number): Promise<Product> {
    await this.findById(productId);

    return this.prisma.product.update({
      where: { id: productId },
      data: { stock: { increment: quantity } },
    });
  }

  private buildWhere(
    query: ProductQueryDto,
  ): Prisma.ProductWhereInput {
    const where: Prisma.ProductWhereInput = { isActive: true };

    if (query.q) {
      where.OR = [
        { name: { contains: query.q, mode: 'insensitive' } },
        { description: { contains: query.q, mode: 'insensitive' } },
      ];
    }

    if (query.category) {
      where.category = query.category;
    }

    if (query.minPrice !== undefined || query.maxPrice !== undefined) {
      where.price = {};
      if (query.minPrice !== undefined) where.price.gte = query.minPrice;
      if (query.maxPrice !== undefined) where.price.lte = query.maxPrice;
    }

    return where;
  }

  private buildOrderBy(
    sortBy?: ProductSortBy,
  ): Prisma.ProductOrderByWithRelationInput {
    switch (sortBy) {
      case ProductSortBy.PRICE_ASC:
        return { price: 'asc' };
      case ProductSortBy.PRICE_DESC:
        return { price: 'desc' };
      case ProductSortBy.NAME:
        return { name: 'asc' };
      case ProductSortBy.NEWEST:
      default:
        return { createdAt: 'desc' };
    }
  }
}
