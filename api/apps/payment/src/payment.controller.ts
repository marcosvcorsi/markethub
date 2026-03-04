import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  InternalServerErrorException,
  Logger,
  Options,
  Param,
  Post,
  RawBody,
  Req,
} from '@nestjs/common';
import type { Request } from 'express';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Public } from '@markethub/auth';
import { PaymentService } from './payment.service';
import { StripeService } from './stripe.service';
import { CreateCheckoutDto } from './dto/create-checkout.dto';
import { CheckoutResponseDto, PaymentResponseDto } from './dto/payment-response.dto';

interface OrderResponse {
  id: string;
  userId: string;
  status: string;
  totalAmount: number;
  items: Array<{
    id: string;
    productId: string;
    productName: string;
    quantity: number;
    unitPrice: number;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

@ApiTags('payments')
@Controller('payments')
export class PaymentController {
  private readonly logger = new Logger(PaymentController.name);

  constructor(
    private readonly paymentService: PaymentService,
    private readonly stripeService: StripeService,
    private readonly httpService: HttpService,
  ) {}

  @Get('health')
  @Public()
  @ApiOperation({ summary: 'Health check endpoint' })
  @ApiResponse({ status: 200, description: 'Service is healthy' })
  health() {
    return {
      status: 'ok',
      service: 'payment',
      timestamp: new Date().toISOString(),
    };
  }

  @Options('*')
  @Public()
  @ApiOperation({ summary: 'Handle CORS preflight requests' })
  options() {
    return { status: 'ok' };
  }

  @Post('checkout')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a Stripe Checkout session for an order' })
  @ApiResponse({ status: 201, description: 'Checkout session created', type: CheckoutResponseDto })
  @ApiResponse({ status: 400, description: 'Payment already exists' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  async createCheckout(@Body() dto: CreateCheckoutDto, @Req() req: Request) {
    // Fetch order details from order service
    const orderServiceUrl = process.env.ORDER_SERVICE_URL || 'http://order:3002';
    let order: OrderResponse;

    // Extract authorization header from incoming request
    const authHeader = req.headers.authorization;

    try {
      const response = await firstValueFrom(
        this.httpService.get<OrderResponse>(`${orderServiceUrl}/orders/${dto.orderId}`, {
          headers: authHeader ? { authorization: authHeader } : undefined,
        })
      );
      order = response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        throw new BadRequestException(`Order "${dto.orderId}" not found`);
      }
      if (error.response?.status === 401 || error.response?.status === 403) {
        throw new BadRequestException(`Not authorized to access order "${dto.orderId}"`);
      }
      // Log the actual error for debugging
      this.logger.error(`Error fetching order ${dto.orderId}:`, error.message);
      throw new InternalServerErrorException(`Failed to fetch order details. Please try again.`);
    }

    // Map order items to Stripe line items format
    const items = order.items.map((item) => ({
      productId: item.productId,
      name: item.productName,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
    }));

    return this.paymentService.createCheckoutSession({
      orderId: dto.orderId,
      amount: order.totalAmount,
      items: items,
      successUrl: dto.successUrl,
      cancelUrl: dto.cancelUrl,
    });
  }

  @Post('webhook')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Stripe webhook endpoint' })
  @ApiResponse({ status: 200, description: 'Webhook processed' })
  async handleWebhook(
    @RawBody() rawBody: Buffer,
    @Headers('stripe-signature') signature: string,
  ) {
    const event = this.stripeService.constructWebhookEvent(rawBody, signature);
    await this.paymentService.handleWebhookEvent(event as any);
    return { received: true };
  }

  @Get('order/:orderId')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get payment status for an order' })
  @ApiParam({ name: 'orderId', description: 'Order ID' })
  @ApiResponse({ status: 200, description: 'Payment found', type: PaymentResponseDto })
  @ApiResponse({ status: 404, description: 'Payment not found' })
  async findByOrderId(@Param('orderId') orderId: string) {
    return this.paymentService.findByOrderId(orderId);
  }
}
