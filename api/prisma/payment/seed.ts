import { PaymentStatus, PrismaClient } from '@prisma/client/payment';

const prisma = new PrismaClient();

// Maps order status → payment status
const ORDER_STATUS_TO_PAYMENT: Record<string, PaymentStatus> = {
  PENDING: PaymentStatus.PENDING,
  PAYMENT_PROCESSING: PaymentStatus.PROCESSING,
  PAID: PaymentStatus.COMPLETED,
  SHIPPED: PaymentStatus.COMPLETED,
  DELIVERED: PaymentStatus.COMPLETED,
};

export async function seedPayments(
  orders: Array<{ id: string; status: string; totalAmount: number }>,
) {
  console.log('Seeding payments...');

  if (orders.length === 0) {
    console.log('  Skipping: no orders provided.');
    return;
  }

  const existing = await prisma.payment.count();
  if (existing > 0) {
    console.log(
      `  Skipping: ${existing} payments already exist. Run with a clean database to re-seed.`,
    );
    return;
  }

  let count = 0;
  for (const order of orders) {
    const paymentStatus =
      ORDER_STATUS_TO_PAYMENT[order.status] ?? PaymentStatus.PENDING;

    await prisma.payment.create({
      data: {
        orderId: order.id,
        amount: order.totalAmount,
        status: paymentStatus,
        stripeSessionId:
          paymentStatus !== PaymentStatus.PENDING
            ? `cs_seed_${order.id.slice(0, 8)}`
            : null,
      },
    });
    count++;
  }

  console.log(`  Created ${count} payments matching seeded orders.`);
}

// Allow running standalone (requires order IDs as JSON arg)
if (require.main === module) {
  const ordersJson = process.argv[2];
  if (!ordersJson) {
    console.error(
      'Usage: npx ts-node prisma/payment/seed.ts \'[{"id":"...","status":"PENDING","totalAmount":100}]\'',
    );
    process.exit(1);
  }
  seedPayments(JSON.parse(ordersJson))
    .then(() => prisma.$disconnect())
    .catch((e) => {
      console.error(e);
      prisma.$disconnect();
      process.exit(1);
    });
}
