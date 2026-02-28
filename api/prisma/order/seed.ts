import { OrderStatus, PrismaClient } from '@prisma/client/order';
import { resolveKeycloakUsers } from '../helpers/keycloak';

const prisma = new PrismaClient();

function buildOrders(testUserId: string) {
  return [
    {
      userId: testUserId,
      status: OrderStatus.PENDING,
      totalAmount: 274.98,
      items: [
        {
          productId: 'seed-product-headphones',
          productName: 'Wireless Noise-Cancelling Headphones',
          quantity: 1,
          unitPrice: 249.99,
        },
        {
          productId: 'seed-product-tshirt',
          productName: 'Classic Fit Cotton T-Shirt',
          quantity: 1,
          unitPrice: 24.99,
        },
      ],
    },
    {
      userId: testUserId,
      status: OrderStatus.PAYMENT_PROCESSING,
      totalAmount: 159.99,
      items: [
        {
          productId: 'seed-product-keyboard',
          productName: 'Mechanical Gaming Keyboard',
          quantity: 1,
          unitPrice: 159.99,
        },
      ],
    },
    {
      userId: testUserId,
      status: OrderStatus.PAID,
      totalAmount: 119.97,
      items: [
        {
          productId: 'seed-product-frenchpress',
          productName: 'Stainless Steel French Press',
          quantity: 1,
          unitPrice: 34.99,
        },
        {
          productId: 'seed-product-yogamat',
          productName: 'Yoga Mat with Alignment Lines',
          quantity: 1,
          unitPrice: 44.99,
        },
        {
          productId: 'seed-product-cleancode',
          productName: 'Clean Code: A Handbook of Agile Software Craftsmanship',
          quantity: 1,
          unitPrice: 39.99,
        },
      ],
    },
    {
      userId: testUserId,
      status: OrderStatus.SHIPPED,
      totalAmount: 89.99,
      items: [
        {
          productId: 'seed-product-jacket',
          productName: 'Lightweight Running Jacket',
          quantity: 1,
          unitPrice: 89.99,
        },
      ],
    },
    {
      userId: testUserId,
      status: OrderStatus.DELIVERED,
      totalAmount: 129.98,
      items: [
        {
          productId: 'seed-product-desklamp',
          productName: 'Smart LED Desk Lamp',
          quantity: 1,
          unitPrice: 49.99,
        },
        {
          productId: 'seed-product-speaker',
          productName: 'Portable Bluetooth Speaker',
          quantity: 1,
          unitPrice: 79.99,
        },
      ],
    },
  ];
}

export async function seedOrders(testUserId?: string) {
  let resolvedUserId = testUserId;

  if (!resolvedUserId) {
    const users = await resolveKeycloakUsers();
    resolvedUserId = users.testUserId;
  }

  console.log('Seeding orders...');

  const existing = await prisma.order.count();
  if (existing > 0) {
    console.log(
      `  Skipping: ${existing} orders already exist. Run with a clean database to re-seed.`,
    );
    return [];
  }

  const orders = buildOrders(resolvedUserId);
  const createdOrders: Array<{ id: string; status: OrderStatus; totalAmount: number }> = [];

  for (const order of orders) {
    const created = await prisma.order.create({
      data: {
        userId: order.userId,
        status: order.status,
        totalAmount: order.totalAmount,
        items: {
          create: order.items,
        },
      },
      include: { items: true },
    });
    createdOrders.push({
      id: created.id,
      status: created.status,
      totalAmount: Number(created.totalAmount),
    });
  }

  console.log(`  Created ${createdOrders.length} orders for testuser.`);
  return createdOrders;
}

// Allow running standalone
if (require.main === module) {
  seedOrders()
    .then(() => prisma.$disconnect())
    .catch((e) => {
      console.error(e);
      prisma.$disconnect();
      process.exit(1);
    });
}
