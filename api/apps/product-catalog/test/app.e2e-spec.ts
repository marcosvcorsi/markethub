import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import request from 'supertest';
import { PrismaService } from '../src/prisma.service';
import { ProductCatalogService } from '../src/product-catalog.service';
import { ProductCatalogController } from '../src/product-catalog.controller';
import { MockAuthGuard, TEST_USER } from '../../../test/helpers/auth.helper';

async function cleanProducts(prisma: PrismaService) {
  // MongoDB standalone (no replica set) doesn't support deleteMany transactions.
  // Drop the collection directly instead.
  try {
    await prisma.$runCommandRaw({ drop: 'Product' });
  } catch {
    // Collection may not exist yet — that's fine
  }
}

describe('ProductCatalog (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [ProductCatalogController],
      providers: [
        PrismaService,
        ProductCatalogService,
        { provide: APP_GUARD, useValue: new MockAuthGuard() },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, transform: true }),
    );
    await app.init();

    prisma = app.get(PrismaService);
  });

  beforeEach(async () => {
    await cleanProducts(prisma);
  });

  afterAll(async () => {
    await cleanProducts(prisma);
    await prisma.$disconnect();
    await app.close();
  });

  const productPayload = {
    name: 'Test Headphones',
    description: 'Great wireless headphones',
    price: 99.99,
    stock: 50,
    category: 'Electronics',
    images: ['https://example.com/img.jpg'],
  };

  describe('POST /products', () => {
    it('should create a product', () => {
      return request(app.getHttpServer())
        .post('/products')
        .send(productPayload)
        .expect(201)
        .expect((res) => {
          expect(res.body).toMatchObject({
            name: productPayload.name,
            price: productPayload.price,
            category: productPayload.category,
            sellerId: TEST_USER.sub,
          });
          expect(res.body.id).toBeDefined();
        });
    });
  });

  describe('GET /products', () => {
    it('should list products with pagination meta', async () => {
      await prisma.product.create({
        data: { ...productPayload, sellerId: TEST_USER.sub },
      });

      return request(app.getHttpServer())
        .get('/products')
        .expect(200)
        .expect((res) => {
          expect(res.body.data).toHaveLength(1);
          expect(res.body.meta).toMatchObject({
            page: 1,
            total: 1,
            totalPages: 1,
          });
        });
    });

    it('should search products by keyword', async () => {
      await prisma.product.create({
        data: { ...productPayload, name: 'Wireless Mouse', sellerId: TEST_USER.sub },
      });
      await prisma.product.create({
        data: { ...productPayload, name: 'USB Cable', sellerId: TEST_USER.sub },
      });

      return request(app.getHttpServer())
        .get('/products?q=mouse')
        .expect(200)
        .expect((res) => {
          expect(res.body.data).toHaveLength(1);
          expect(res.body.data[0].name).toBe('Wireless Mouse');
        });
    });

    it('should filter products by category', async () => {
      await prisma.product.create({
        data: { ...productPayload, category: 'Electronics', sellerId: TEST_USER.sub },
      });
      await prisma.product.create({
        data: { ...productPayload, name: 'T-Shirt', category: 'Clothing', sellerId: TEST_USER.sub },
      });

      return request(app.getHttpServer())
        .get('/products?category=Clothing')
        .expect(200)
        .expect((res) => {
          expect(res.body.data).toHaveLength(1);
          expect(res.body.data[0].category).toBe('Clothing');
        });
    });
  });

  describe('GET /products/:id', () => {
    it('should return a product by ID', async () => {
      const product = await prisma.product.create({
        data: { ...productPayload, sellerId: TEST_USER.sub },
      });

      return request(app.getHttpServer())
        .get(`/products/${product.id}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.id).toBe(product.id);
          expect(res.body.name).toBe(productPayload.name);
        });
    });
  });

  describe('PATCH /products/:id', () => {
    it('should update a product (owner)', async () => {
      const product = await prisma.product.create({
        data: { ...productPayload, sellerId: TEST_USER.sub },
      });

      return request(app.getHttpServer())
        .patch(`/products/${product.id}`)
        .send({ price: 79.99 })
        .expect(200)
        .expect((res) => {
          expect(res.body.price).toBe(79.99);
        });
    });
  });

  describe('DELETE /products/:id', () => {
    it('should soft-delete a product (owner)', async () => {
      const product = await prisma.product.create({
        data: { ...productPayload, sellerId: TEST_USER.sub },
      });

      await request(app.getHttpServer())
        .delete(`/products/${product.id}`)
        .expect(204);

      const deleted = await prisma.product.findUnique({
        where: { id: product.id },
      });
      expect(deleted!.isActive).toBe(false);
    });
  });
});
