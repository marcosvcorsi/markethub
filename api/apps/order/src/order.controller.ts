import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
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
import { CurrentUser, UserContext } from '@markethub/common';
import { OrderService } from './order.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { OrderQueryDto } from './dto/order-query.dto';
import { OrderResponseDto, PaginatedOrderResponseDto } from './dto/order-response.dto';

@ApiTags('orders')
@Controller('orders')
@ApiBearerAuth()
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new order' })
  @ApiResponse({ status: 201, description: 'Order created successfully', type: OrderResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async create(
    @Body() dto: CreateOrderDto,
    @CurrentUser() user: UserContext,
  ) {
    return this.orderService.create(dto, user.sub);
  }

  @Get()
  @ApiOperation({ summary: 'List current user orders with pagination' })
  @ApiResponse({ status: 200, description: 'Paginated order list', type: PaginatedOrderResponseDto })
  async findAll(
    @Query() query: OrderQueryDto,
    @CurrentUser() user: UserContext,
  ) {
    return this.orderService.findAll(query, user.sub);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get order details by ID' })
  @ApiParam({ name: 'id', description: 'Order ID' })
  @ApiResponse({ status: 200, description: 'Order found', type: OrderResponseDto })
  @ApiResponse({ status: 404, description: 'Order not found' })
  async findById(
    @Param('id') id: string,
    @CurrentUser() user: UserContext,
  ) {
    return this.orderService.findById(id, user.sub);
  }

  @Post(':id/cancel')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cancel an order (owner only)' })
  @ApiParam({ name: 'id', description: 'Order ID' })
  @ApiResponse({ status: 200, description: 'Order cancelled', type: OrderResponseDto })
  @ApiResponse({ status: 400, description: 'Cannot cancel this order' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  async cancel(
    @Param('id') id: string,
    @CurrentUser() user: UserContext,
  ) {
    return this.orderService.cancel(id, user.sub);
  }
}
