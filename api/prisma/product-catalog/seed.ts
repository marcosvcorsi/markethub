import { PrismaClient } from '@prisma/client/product-catalog';
import { resolveKeycloakUsers } from '../helpers/keycloak';

const prisma = new PrismaClient();

function buildProducts(sellerId: string) {
  return [
    // --- Electronics (4) ---
    {
      name: 'Wireless Noise-Cancelling Headphones',
      description:
        'Premium over-ear headphones with active noise cancellation, 30-hour battery life, and built-in microphone.',
      price: 249.99,
      stock: 35,
      category: 'Electronics',
      images: ['https://picsum.photos/seed/headphones/640/480'],
      sellerId,
    },
    {
      name: '4K Ultra HD Webcam',
      description:
        'Professional-grade webcam with auto-focus, built-in ring light, and dual stereo microphones.',
      price: 129.99,
      stock: 50,
      category: 'Electronics',
      images: ['https://picsum.photos/seed/webcam/640/480'],
      sellerId,
    },
    {
      name: 'Mechanical Gaming Keyboard',
      description:
        'RGB backlit mechanical keyboard with Cherry MX Blue switches, programmable macros, and USB-C.',
      price: 159.99,
      stock: 40,
      category: 'Electronics',
      images: ['https://picsum.photos/seed/keyboard/640/480'],
      sellerId,
    },
    {
      name: 'Portable Bluetooth Speaker',
      description:
        'Waterproof portable speaker with 360-degree sound, 20-hour playtime, and built-in power bank.',
      price: 79.99,
      stock: 60,
      category: 'Electronics',
      images: ['https://picsum.photos/seed/speaker/640/480'],
      sellerId,
    },

    // --- Clothing (4) ---
    {
      name: 'Classic Fit Cotton T-Shirt',
      description:
        'Soft 100% organic cotton crew-neck t-shirt. Pre-shrunk, tagless comfort. Available in multiple colors.',
      price: 24.99,
      stock: 100,
      category: 'Clothing',
      images: ['https://picsum.photos/seed/tshirt/640/480'],
      sellerId,
    },
    {
      name: 'Slim Fit Stretch Jeans',
      description:
        'Modern slim-fit jeans with 2% elastane for comfort stretch. Dark indigo wash, 5-pocket design.',
      price: 59.99,
      stock: 75,
      category: 'Clothing',
      images: ['https://picsum.photos/seed/jeans/640/480'],
      sellerId,
    },
    {
      name: 'Lightweight Running Jacket',
      description:
        'Breathable windbreaker with reflective details, zippered pockets, and packable hood.',
      price: 89.99,
      stock: 30,
      category: 'Clothing',
      images: ['https://picsum.photos/seed/jacket/640/480'],
      sellerId,
    },
    {
      name: 'Merino Wool Beanie',
      description:
        'Ultra-soft merino wool beanie with ribbed knit pattern. Warm, breathable, and itch-free.',
      price: 29.99,
      stock: 80,
      category: 'Clothing',
      images: ['https://picsum.photos/seed/beanie/640/480'],
      sellerId,
    },

    // --- Home & Garden (4) ---
    {
      name: 'Smart LED Desk Lamp',
      description:
        'Adjustable LED desk lamp with 5 color temperatures, USB charging port, and touch controls.',
      price: 49.99,
      stock: 45,
      category: 'Home & Garden',
      images: ['https://picsum.photos/seed/desklamp/640/480'],
      sellerId,
    },
    {
      name: 'Stainless Steel French Press',
      description:
        'Double-wall insulated French press coffee maker. 34 oz capacity, keeps coffee hot for hours.',
      price: 34.99,
      stock: 55,
      category: 'Home & Garden',
      images: ['https://picsum.photos/seed/frenchpress/640/480'],
      sellerId,
    },
    {
      name: 'Indoor Herb Garden Kit',
      description:
        'Self-watering indoor garden with LED grow lights. Includes basil, mint, and parsley seed pods.',
      price: 69.99,
      stock: 25,
      category: 'Home & Garden',
      images: ['https://picsum.photos/seed/herbgarden/640/480'],
      sellerId,
    },
    {
      name: 'Bamboo Cutting Board Set',
      description:
        'Set of 3 premium bamboo cutting boards with juice grooves. Eco-friendly and knife-gentle.',
      price: 39.99,
      stock: 65,
      category: 'Home & Garden',
      images: ['https://picsum.photos/seed/cuttingboard/640/480'],
      sellerId,
    },

    // --- Sports (4) ---
    {
      name: 'Yoga Mat with Alignment Lines',
      description:
        'Non-slip 6mm thick yoga mat with body alignment system. Includes carrying strap.',
      price: 44.99,
      stock: 70,
      category: 'Sports',
      images: ['https://picsum.photos/seed/yogamat/640/480'],
      sellerId,
    },
    {
      name: 'Adjustable Dumbbell Set',
      description:
        'Space-saving adjustable dumbbells from 5 to 52.5 lbs. Quick-change weight selection dial.',
      price: 349.99,
      stock: 15,
      category: 'Sports',
      images: ['https://picsum.photos/seed/dumbbells/640/480'],
      sellerId,
    },
    {
      name: 'Insulated Water Bottle',
      description:
        'Vacuum-insulated stainless steel bottle. Keeps drinks cold 24h or hot 12h. 32 oz capacity.',
      price: 29.99,
      stock: 90,
      category: 'Sports',
      images: ['https://picsum.photos/seed/waterbottle/640/480'],
      sellerId,
    },
    {
      name: 'Resistance Bands Set',
      description:
        'Set of 5 latex resistance bands with door anchor, ankle straps, and carrying bag. 10–50 lbs.',
      price: 24.99,
      stock: 85,
      category: 'Sports',
      images: ['https://picsum.photos/seed/resistancebands/640/480'],
      sellerId,
    },

    // --- Books (4) ---
    {
      name: 'Clean Code: A Handbook of Agile Software Craftsmanship',
      description:
        'Robert C. Martin\'s classic guide to writing readable, maintainable, and elegant code.',
      price: 39.99,
      stock: 50,
      category: 'Books',
      images: ['https://picsum.photos/seed/cleancode/640/480'],
      sellerId,
    },
    {
      name: 'Designing Data-Intensive Applications',
      description:
        'Martin Kleppmann\'s deep dive into the architecture of modern data systems. Essential for backend engineers.',
      price: 44.99,
      stock: 40,
      category: 'Books',
      images: ['https://picsum.photos/seed/ddia/640/480'],
      sellerId,
    },
    {
      name: 'The Pragmatic Programmer',
      description:
        'Updated 20th anniversary edition. Tips, techniques, and practices for modern software development.',
      price: 49.99,
      stock: 35,
      category: 'Books',
      images: ['https://picsum.photos/seed/pragprog/640/480'],
      sellerId,
    },
    {
      name: 'Atomic Habits',
      description:
        'James Clear\'s practical guide to building good habits and breaking bad ones. Over 10 million copies sold.',
      price: 16.99,
      stock: 100,
      category: 'Books',
      images: ['https://picsum.photos/seed/atomichabits/640/480'],
      sellerId,
    },
  ];
}

export async function seedProducts(sellerId?: string) {
  let resolvedSellerId = sellerId;

  if (!resolvedSellerId) {
    const users = await resolveKeycloakUsers();
    resolvedSellerId = users.sellerId;
  }

  const products = buildProducts(resolvedSellerId);

  console.log('Seeding products...');

  const existing = await prisma.product.count();
  if (existing > 0) {
    console.log(
      `  Skipping: ${existing} products already exist. Run with a clean database to re-seed.`,
    );
    return;
  }

  for (const product of products) {
    await prisma.product.create({ data: product });
  }

  console.log(`  Created ${products.length} products across 5 categories.`);
}

// Allow running standalone
if (require.main === module) {
  seedProducts()
    .then(() => prisma.$disconnect())
    .catch((e) => {
      console.error(e);
      prisma.$disconnect();
      process.exit(1);
    });
}
