import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { OrderStatus } from '@prisma/client/order';
import { EventPublisherService } from '@markethub/messaging';
import { OrderService } from '../order.service';
import { PrismaService } from '../prisma.service';

const mockOrder = {
  id: 'order-1',
  userId: 'user-1',
  status: OrderStatus.PENDING,
  totalAmount: 199.98,
  items: [
    {
      id: 'item-1',
      productId: 'product-1',
      productName: 'Headphones',
      quantity: 2,
      unitPrice: 99.99,
      orderId: 'order-1',
    },
  ],
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('OrderService', () => {
  let service: OrderService;
  let prisma: {
    order: {
      create: jest.Mock;
      findMany: jest.Mock;
      findUnique: jest.Mock;
      count: jest.Mock;
      update: jest.Mock;
    };
  };
  let eventPublisher: { publish: jest.Mock };

  beforeEach(async () => {
    prisma = {
      order: {
        create: jest.fn().mockResolvedValue(mockOrder),
        findMany: jest.fn().mockResolvedValue([mockOrder]),
        findUnique: jest.fn().mockResolvedValue(mockOrder),
        count: jest.fn().mockResolvedValue(1),
        update: jest.fn().mockResolvedValue(mockOrder),
      },
    };

    eventPublisher = {
      publish: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrderService,
        { provide: PrismaService, useValue: prisma },
        { provide: EventPublisherService, useValue: eventPublisher },
      ],
    }).compile();

    service = module.get(OrderService);
  });

  describe('create', () => {
    it('should create an order with items and computed total', async () => {
      const dto = {
        items: [
          {
            productId: 'product-1',
            productName: 'Headphones',
            quantity: 2,
            unitPrice: 99.99,
          },
        ],
      };

      const result = await service.create(dto, 'user-1');

      expect(prisma.order.create).toHaveBeenCalledWith({
        data: {
          userId: 'user-1',
          totalAmount: 199.98,
          items: {
            create: [
              {
                productId: 'product-1',
                productName: 'Headphones',
                quantity: 2,
                unitPrice: 99.99,
              },
            ],
          },
        },
        include: { items: true },
      });
      expect(result).toEqual(mockOrder);
    });

    it('should publish order.created event', async () => {
      const dto = {
        items: [
          {
            productId: 'product-1',
            productName: 'Headphones',
            quantity: 2,
            unitPrice: 99.99,
          },
        ],
      };

      await service.create(dto, 'user-1');

      expect(eventPublisher.publish).toHaveBeenCalledWith(
        'order.created',
        expect.objectContaining({
          orderId: 'order-1',
          userId: 'user-1',
          items: [{ productId: 'product-1', quantity: 2 }],
        }),
      );
    });
  });

  describe('findAll', () => {
    it('should return paginated orders for user', async () => {
      const result = await service.findAll(
        { page: 1, limit: 20, skip: 0 } as any,
        'user-1',
      );

      expect(prisma.order.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: 'user-1' },
          include: { items: true },
        }),
      );
      expect(result.data).toHaveLength(1);
      expect(result.meta.total).toBe(1);
    });

    it('should filter by status when provided', async () => {
      const query = { page: 1, limit: 20, skip: 0, status: OrderStatus.PAID } as any;

      await service.findAll(query, 'user-1');

      expect(prisma.order.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: 'user-1', status: OrderStatus.PAID },
        }),
      );
    });
  });

  describe('findById', () => {
    it('should return order owned by user', async () => {
      const result = await service.findById('order-1', 'user-1');
      expect(result.id).toBe('order-1');
    });

    it('should throw NotFoundException when order not found', async () => {
      prisma.order.findUnique.mockResolvedValue(null);

      await expect(service.findById('nonexistent', 'user-1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw BadRequestException when not owner', async () => {
      await expect(service.findById('order-1', 'other-user')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('transition', () => {
    it('should transition PENDING to PAYMENT_PROCESSING', async () => {
      const updated = { ...mockOrder, status: OrderStatus.PAYMENT_PROCESSING };
      prisma.order.update.mockResolvedValue(updated);

      const result = await service.transition('order-1', OrderStatus.PAYMENT_PROCESSING);

      expect(prisma.order.update).toHaveBeenCalledWith({
        where: { id: 'order-1' },
        data: { status: OrderStatus.PAYMENT_PROCESSING },
        include: { items: true },
      });
      expect(result.status).toBe(OrderStatus.PAYMENT_PROCESSING);
    });

    it('should transition PAID to SHIPPED', async () => {
      prisma.order.findUnique.mockResolvedValue({
        ...mockOrder,
        status: OrderStatus.PAID,
      });
      prisma.order.update.mockResolvedValue({
        ...mockOrder,
        status: OrderStatus.SHIPPED,
      });

      const result = await service.transition('order-1', OrderStatus.SHIPPED);
      expect(result.status).toBe(OrderStatus.SHIPPED);
    });

    it('should reject invalid transition PENDING to SHIPPED', async () => {
      await expect(
        service.transition('order-1', OrderStatus.SHIPPED),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject transition from DELIVERED', async () => {
      prisma.order.findUnique.mockResolvedValue({
        ...mockOrder,
        status: OrderStatus.DELIVERED,
      });

      await expect(
        service.transition('order-1', OrderStatus.CANCELLED),
      ).rejects.toThrow(BadRequestException);
    });

    it('should allow FAILED to retry back to PENDING', async () => {
      prisma.order.findUnique.mockResolvedValue({
        ...mockOrder,
        status: OrderStatus.FAILED,
      });
      prisma.order.update.mockResolvedValue({
        ...mockOrder,
        status: OrderStatus.PENDING,
      });

      const result = await service.transition('order-1', OrderStatus.PENDING);
      expect(result.status).toBe(OrderStatus.PENDING);
    });
  });

  describe('cancel', () => {
    it('should cancel a PENDING order and publish event', async () => {
      prisma.order.update.mockResolvedValue({
        ...mockOrder,
        status: OrderStatus.CANCELLED,
      });

      const result = await service.cancel('order-1', 'user-1');
      expect(result.status).toBe(OrderStatus.CANCELLED);
      expect(eventPublisher.publish).toHaveBeenCalledWith(
        'order.cancelled',
        expect.objectContaining({
          orderId: 'order-1',
          reason: 'Cancelled by user',
          items: [{ productId: 'product-1', quantity: 2 }],
        }),
      );
    });

    it('should cancel a PAID order', async () => {
      prisma.order.findUnique.mockResolvedValue({
        ...mockOrder,
        status: OrderStatus.PAID,
      });
      prisma.order.update.mockResolvedValue({
        ...mockOrder,
        status: OrderStatus.CANCELLED,
      });

      const result = await service.cancel('order-1', 'user-1');
      expect(result.status).toBe(OrderStatus.CANCELLED);
    });

    it('should throw when non-owner tries to cancel', async () => {
      await expect(
        service.cancel('order-1', 'other-user'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw when cancelling SHIPPED order', async () => {
      prisma.order.findUnique.mockResolvedValue({
        ...mockOrder,
        status: OrderStatus.SHIPPED,
      });

      await expect(
        service.cancel('order-1', 'user-1'),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
