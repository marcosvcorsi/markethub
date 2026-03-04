import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { MessagingModule } from '@markethub/messaging';
import { LoggerModule } from '@markethub/logger';
import { AuthModule } from '@markethub/auth';
import { PaymentController } from './payment.controller';
import { PaymentService } from './payment.service';
import { PrismaService } from './prisma.service';
import { StripeService } from './stripe.service';
import { OrderCreatedListener } from './listeners/order-created.listener';

@Module({
  imports: [
    MessagingModule.forRoot(),
    LoggerModule,
    AuthModule,
    HttpModule.register({
      timeout: 5000,
      maxRedirects: 5,
    }),
  ],
  controllers: [PaymentController],
  providers: [
    PrismaService,
    StripeService,
    PaymentService,
    OrderCreatedListener,
  ],
  exports: [PaymentService],
})
export class PaymentModule {}
