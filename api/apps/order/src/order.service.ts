import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Order, OrderStatus, Prisma } from '@prisma/client/order';
import { Events, PaginatedResponse } from '@markethub/common';
import { EventPublisherService } from '@markethub/messaging';
import { PrismaService } from './prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { OrderQueryDto } from './dto/order-query.dto';

const VALID_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  [OrderStatus.PENDING]: [OrderStatus.PAYMENT_PROCESSING, OrderStatus.CANCELLED],
  [OrderStatus.PAYMENT_PROCESSING]: [OrderStatus.PAID, OrderStatus.FAILED],
  [OrderStatus.PAID]: [OrderStatus.SHIPPED, OrderStatus.CANCELLED],
  [OrderStatus.FAILED]: [OrderStatus.PENDING],
  [OrderStatus.SHIPPED]: [OrderStatus.DELIVERED],
  [OrderStatus.DELIVERED]: [],
  [OrderStatus.CANCELLED]: [],
};

@Injectable()
export class OrderService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventPublisher: EventPublisherService,
  ) {}

  async create(dto: CreateOrderDto, userId: string): Promise<Order> {
    const totalAmount = dto.items.reduce(
      (sum, item) => sum + item.unitPrice * item.quantity,
      0,
    );

    const order = await this.prisma.order.create({
      data: {
        userId,
        totalAmount,
        items: {
          create: dto.items.map((item) => ({
            productId: item.productId,
            productName: item.productName,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
          })),
        },
      },
      include: { items: true },
    });

    await this.eventPublisher.publish(Events.ORDER_CREATED, {
      orderId: order.id,
      userId: order.userId,
      totalAmount: Number(order.totalAmount),
      items: (order as any).items.map((item: any) => ({
        productId: item.productId,
        quantity: item.quantity,
      })),
    });

    return order;
  }

  async findAll(
    query: OrderQueryDto,
    userId: string,
  ): Promise<PaginatedResponse<Order>> {
    const where: Prisma.OrderWhereInput = { userId };

    if (query.status) {
      where.status = query.status;
    }

    const [data, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        include: { items: true },
        orderBy: { createdAt: 'desc' },
        skip: query.skip,
        take: query.limit,
      }),
      this.prisma.order.count({ where }),
    ]);

    return new PaginatedResponse(data, total, query);
  }

  async findById(id: string, userId: string): Promise<Order> {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: { items: true },
    });

    if (!order) {
      throw new NotFoundException(`Order with ID "${id}" not found`);
    }

    if (order.userId !== userId) {
      throw new BadRequestException('You can only view your own orders');
    }

    return order;
  }

  async findByIdInternal(id: string): Promise<Order> {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: { items: true },
    });

    if (!order) {
      throw new NotFoundException(`Order with ID "${id}" not found`);
    }

    return order;
  }

  async transition(id: string, newStatus: OrderStatus): Promise<Order> {
    const order = await this.findByIdInternal(id);

    const allowed = VALID_TRANSITIONS[order.status];
    if (!allowed.includes(newStatus)) {
      throw new BadRequestException(
        `Cannot transition from "${order.status}" to "${newStatus}"`,
      );
    }

    return this.prisma.order.update({
      where: { id },
      data: { status: newStatus },
      include: { items: true },
    });
  }

  async cancel(id: string, userId: string): Promise<Order> {
    const order = await this.findById(id, userId);

    const allowed = VALID_TRANSITIONS[order.status];
    if (!allowed.includes(OrderStatus.CANCELLED)) {
      throw new BadRequestException(
        `Cannot cancel order in "${order.status}" status`,
      );
    }

    const cancelled = await this.prisma.order.update({
      where: { id },
      data: { status: OrderStatus.CANCELLED },
      include: { items: true },
    });

    await this.eventPublisher.publish(Events.ORDER_CANCELLED, {
      orderId: cancelled.id,
      reason: 'Cancelled by user',
      items: (cancelled as any).items.map((item: any) => ({
        productId: item.productId,
        quantity: item.quantity,
      })),
    });

    return cancelled;
  }
}
