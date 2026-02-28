import { Module } from '@nestjs/common';
import { MessagingModule } from '@markethub/messaging';
import { ProductCatalogController } from './product-catalog.controller';
import { ProductCatalogService } from './product-catalog.service';
import { PrismaService } from './prisma.service';
import { PaymentCompletedListener } from './listeners/payment-completed.listener';
import { OrderCancelledListener } from './listeners/order-cancelled.listener';

@Module({
  imports: [MessagingModule.forRoot()],
  controllers: [ProductCatalogController],
  providers: [
    PrismaService,
    ProductCatalogService,
    PaymentCompletedListener,
    OrderCancelledListener,
  ],
  exports: [ProductCatalogService],
})
export class ProductCatalogModule {}
