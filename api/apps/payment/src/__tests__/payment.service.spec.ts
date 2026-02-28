import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { PaymentStatus } from '@prisma/client/payment';
import { EventPublisherService } from '@markethub/messaging';
import { PaymentService } from '../payment.service';
import { PrismaService } from '../prisma.service';
import { StripeService } from '../stripe.service';

const mockPayment = {
  id: 'pay-1',
  orderId: 'order-1',
  stripeSessionId: 'cs_test_123',
  amount: 199.98,
  status: PaymentStatus.PROCESSING,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('PaymentService', () => {
  let service: PaymentService;
  let prisma: {
    payment: {
      create: jest.Mock;
      findFirst: jest.Mock;
      update: jest.Mock;
    };
  };
  let stripeService: { createCheckoutSession: jest.Mock };
  let eventPublisher: { publish: jest.Mock };

  beforeEach(async () => {
    prisma = {
      payment: {
        create: jest.fn().mockResolvedValue(mockPayment),
        findFirst: jest.fn().mockResolvedValue(null),
        update: jest.fn().mockResolvedValue(mockPayment),
      },
    };

    stripeService = {
      createCheckoutSession: jest.fn().mockResolvedValue({
        id: 'cs_test_123',
        url: 'https://checkout.stripe.com/test',
      }),
    };

    eventPublisher = {
      publish: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentService,
        { provide: PrismaService, useValue: prisma },
        { provide: StripeService, useValue: stripeService },
        { provide: EventPublisherService, useValue: eventPublisher },
      ],
    }).compile();

    service = module.get(PaymentService);
  });

  describe('createCheckoutSession', () => {
    it('should create a checkout session and payment record', async () => {
      const result = await service.createCheckoutSession({
        orderId: 'order-1',
        amount: 199.98,
        items: [{ productId: 'p1', name: 'Headphones', quantity: 2, unitPrice: 99.99 }],
        successUrl: 'http://localhost/success',
        cancelUrl: 'http://localhost/cancel',
      });

      expect(stripeService.createCheckoutSession).toHaveBeenCalledWith(
        expect.objectContaining({ orderId: 'order-1' }),
      );
      expect(prisma.payment.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          orderId: 'order-1',
          stripeSessionId: 'cs_test_123',
          status: PaymentStatus.PROCESSING,
        }),
      });
      expect(result.checkoutUrl).toBe('https://checkout.stripe.com/test');
    });

    it('should throw when payment already exists for order', async () => {
      prisma.payment.findFirst.mockResolvedValue(mockPayment);

      await expect(
        service.createCheckoutSession({
          orderId: 'order-1',
          amount: 199.98,
          items: [],
          successUrl: 'http://localhost/success',
          cancelUrl: 'http://localhost/cancel',
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('handleWebhookEvent', () => {
    it('should mark payment completed and publish event on checkout.session.completed', async () => {
      prisma.payment.findFirst.mockResolvedValue(mockPayment);

      await service.handleWebhookEvent({
        type: 'checkout.session.completed',
        data: { object: { id: 'cs_test_123' } },
      });

      expect(prisma.payment.update).toHaveBeenCalledWith({
        where: { id: 'pay-1' },
        data: { status: PaymentStatus.COMPLETED },
      });
      expect(eventPublisher.publish).toHaveBeenCalledWith(
        'payment.completed',
        expect.objectContaining({
          orderId: 'order-1',
          paymentId: 'pay-1',
        }),
      );
    });

    it('should mark payment failed on checkout.session.expired', async () => {
      prisma.payment.findFirst.mockResolvedValue(mockPayment);

      await service.handleWebhookEvent({
        type: 'checkout.session.expired',
        data: { object: { id: 'cs_test_123' } },
      });

      expect(prisma.payment.update).toHaveBeenCalledWith({
        where: { id: 'pay-1' },
        data: { status: PaymentStatus.FAILED },
      });
      expect(eventPublisher.publish).toHaveBeenCalledWith(
        'payment.failed',
        expect.objectContaining({
          orderId: 'order-1',
          reason: 'Checkout session expired',
        }),
      );
    });

    it('should skip if no payment found for session', async () => {
      prisma.payment.findFirst.mockResolvedValue(null);

      await service.handleWebhookEvent({
        type: 'checkout.session.completed',
        data: { object: { id: 'unknown-session' } },
      });

      expect(prisma.payment.update).not.toHaveBeenCalled();
      expect(eventPublisher.publish).not.toHaveBeenCalled();
    });
  });

  describe('findByOrderId', () => {
    it('should return payment for order', async () => {
      prisma.payment.findFirst.mockResolvedValue(mockPayment);

      const result = await service.findByOrderId('order-1');
      expect(result.orderId).toBe('order-1');
    });

    it('should throw NotFoundException when no payment found', async () => {
      prisma.payment.findFirst.mockResolvedValue(null);

      await expect(
        service.findByOrderId('nonexistent'),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
