import { Injectable } from '@nestjs/common';
import Stripe from 'stripe';

@Injectable()
export class StripeService {
  private readonly stripe: Stripe;

  constructor() {
    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
      apiVersion: '2025-01-27.acacia',
    });
  }

  async createCheckoutSession(params: {
    orderId: string;
    amount: number;
    items: Array<{ name: string; quantity: number; unitPrice: number }>;
    successUrl: string;
    cancelUrl: string;
  }): Promise<Stripe.Checkout.Session> {
    return this.stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: params.items.map((item) => ({
        price_data: {
          currency: 'usd',
          product_data: { name: item.name },
          unit_amount: Math.round(item.unitPrice * 100),
        },
        quantity: item.quantity,
      })),
      metadata: { orderId: params.orderId },
      success_url: params.successUrl,
      cancel_url: params.cancelUrl,
    });
  }

  constructWebhookEvent(
    payload: Buffer,
    signature: string,
  ): Stripe.Event {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';
    return this.stripe.webhooks.constructEvent(
      payload,
      signature,
      webhookSecret,
    );
  }
}
