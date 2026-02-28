import { Module } from '@nestjs/common';
import { MessagingModule } from '@markethub/messaging';
import { LoggerModule } from '@markethub/logger';
import { NotificationController } from './notification.controller';
import { NotificationService } from './notification.service';
import { EmailService } from './email.service';
import { NotificationGateway } from './notification.gateway';
import { OrderCreatedListener } from './listeners/order-created.listener';
import { PaymentCompletedListener } from './listeners/payment-completed.listener';
import { PaymentFailedListener } from './listeners/payment-failed.listener';

@Module({
  imports: [MessagingModule.forRoot(), LoggerModule],
  controllers: [NotificationController],
  providers: [
    EmailService,
    NotificationGateway,
    NotificationService,
    OrderCreatedListener,
    PaymentCompletedListener,
    PaymentFailedListener,
  ],
})
export class NotificationModule {}
