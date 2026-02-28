import { Module } from '@nestjs/common';
import { MessagingModule } from '@markethub/messaging';
import { OrderController } from './order.controller';
import { OrderService } from './order.service';
import { PrismaService } from './prisma.service';
import { PaymentCompletedListener } from './listeners/payment-completed.listener';
import { PaymentFailedListener } from './listeners/payment-failed.listener';

@Module({
  imports: [MessagingModule.forRoot()],
  controllers: [OrderController],
  providers: [
    PrismaService,
    OrderService,
    PaymentCompletedListener,
    PaymentFailedListener,
  ],
  exports: [OrderService],
})
export class OrderModule {}
