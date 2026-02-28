import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ProductCatalogService } from '../product-catalog.service';
import { PrismaService } from '../prisma.service';

const mockProduct = {
  id: 'product-id-1',
  name: 'Test Product',
  description: 'A test product',
  price: 29.99,
  stock: 10,
  category: 'Electronics',
  images: [],
  sellerId: 'seller-1',
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('ProductCatalogService', () => {
  let service: ProductCatalogService;
  let prisma: {
    product: {
      create: jest.Mock;
      findMany: jest.Mock;
      findUnique: jest.Mock;
      count: jest.Mock;
      update: jest.Mock;
    };
  };

  beforeEach(async () => {
    prisma = {
      product: {
        create: jest.fn().mockResolvedValue(mockProduct),
        findMany: jest.fn().mockResolvedValue([mockProduct]),
        findUnique: jest.fn().mockResolvedValue(mockProduct),
        count: jest.fn().mockResolvedValue(1),
        update: jest.fn().mockResolvedValue(mockProduct),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductCatalogService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get(ProductCatalogService);
  });

  describe('create', () => {
    it('should create a product with sellerId', async () => {
      const dto = {
        name: 'New Product',
        description: 'Description',
        price: 19.99,
        stock: 5,
        category: 'Books',
      };

      const result = await service.create(dto, 'seller-1');

      expect(prisma.product.create).toHaveBeenCalledWith({
        data: { ...dto, sellerId: 'seller-1' },
      });
      expect(result).toEqual(mockProduct);
    });
  });

  describe('findAll', () => {
    it('should return paginated products', async () => {
      const result = await service.findAll({ page: 1, limit: 20, skip: 0 } as any);

      expect(result.data).toHaveLength(1);
      expect(result.meta.total).toBe(1);
      expect(result.meta.page).toBe(1);
    });
  });

  describe('findById', () => {
    it('should return a product by ID', async () => {
      const result = await service.findById('product-id-1');
      expect(result.name).toBe('Test Product');
    });

    it('should throw NotFoundException when product not found', async () => {
      prisma.product.findUnique.mockResolvedValue(null);

      await expect(service.findById('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('should update product when called by owner', async () => {
      const result = await service.update(
        'product-id-1',
        { name: 'Updated' },
        'seller-1',
      );

      expect(prisma.product.update).toHaveBeenCalledWith({
        where: { id: 'product-id-1' },
        data: { name: 'Updated' },
      });
      expect(result).toBeDefined();
    });

    it('should throw when non-owner tries to update', async () => {
      await expect(
        service.update('product-id-1', { name: 'Updated' }, 'other-seller'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('remove', () => {
    it('should soft-delete by setting isActive to false', async () => {
      await service.remove('product-id-1', 'seller-1');

      expect(prisma.product.update).toHaveBeenCalledWith({
        where: { id: 'product-id-1' },
        data: { isActive: false },
      });
    });

    it('should throw when non-owner tries to delete', async () => {
      await expect(
        service.remove('product-id-1', 'other-seller'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('decrementStock', () => {
    it('should decrement stock when sufficient', async () => {
      await service.decrementStock('product-id-1', 3);

      expect(prisma.product.update).toHaveBeenCalledWith({
        where: { id: 'product-id-1' },
        data: { stock: { decrement: 3 } },
      });
    });

    it('should throw when insufficient stock', async () => {
      prisma.product.findUnique.mockResolvedValue({ ...mockProduct, stock: 2 });

      await expect(
        service.decrementStock('product-id-1', 5),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('restoreStock', () => {
    it('should restore stock', async () => {
      await service.restoreStock('product-id-1', 3);

      expect(prisma.product.update).toHaveBeenCalledWith({
        where: { id: 'product-id-1' },
        data: { stock: { increment: 3 } },
      });
    });
  });
});
