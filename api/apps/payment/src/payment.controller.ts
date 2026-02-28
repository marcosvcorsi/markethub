import {
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  RawBody,
} from '@nestjs/common';
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

@ApiTags('payments')
@Controller('payments')
export class PaymentController {
  constructor(
    private readonly paymentService: PaymentService,
    private readonly stripeService: StripeService,
  ) {}

  @Post('checkout')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a Stripe Checkout session for an order' })
  @ApiResponse({ status: 201, description: 'Checkout session created', type: CheckoutResponseDto })
  @ApiResponse({ status: 400, description: 'Payment already exists' })
  async createCheckout(@Body() dto: CreateCheckoutDto) {
    return this.paymentService.createCheckoutSession({
      orderId: dto.orderId,
      amount: 0,
      items: [],
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
