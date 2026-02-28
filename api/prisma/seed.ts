import { resolveKeycloakUsers } from './helpers/keycloak';
import { seedProducts } from './product-catalog/seed';
import { seedOrders } from './order/seed';
import { seedPayments } from './payment/seed';

async function main() {
  console.log('=== MarketHub Database Seed ===\n');

  // 1. Resolve Keycloak user IDs
  const users = await resolveKeycloakUsers();
  console.log();

  // 2. Seed products (seller's catalog)
  await seedProducts(users.sellerId);
  console.log();

  // 3. Seed orders (testuser's orders)
  const orders = await seedOrders(users.testUserId);
  console.log();

  // 4. Seed payments (one per order)
  await seedPayments(orders);
  console.log();

  console.log('=== Seed complete ===');
}

main().catch((e) => {
  console.error('Seed failed:', e);
  process.exit(1);
});
