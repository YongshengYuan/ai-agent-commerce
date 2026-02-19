import { describe, it, expect, beforeEach } from '@jest/globals';
import request from 'supertest';

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000/api';

describe('Cart API Tests', () => {
  let authToken: string;
  let cartId: string;

  beforeEach(async () => {
    // Login to get auth token
    const loginRes = await request(API_BASE_URL)
      .post('/auth/login')
      .send({ email: 'test@example.com', password: 'password123' });
    authToken = loginRes.body.token;
    cartId = loginRes.body.cartId;
  });

  describe('GET /api/cart', () => {
    it('TC-API-CART-001: Should return user cart', async () => {
      const response = await request(API_BASE_URL)
        .get('/cart')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('items');
      expect(response.body).toHaveProperty('total');
    });

    it('TC-API-CART-002: Should create new cart for unauthenticated user', async () => {
      const response = await request(API_BASE_URL)
        .get('/cart')
        .expect(200);

      expect(response.body).toHaveProperty('id');
    });

    it('TC-API-CART-003: Should return 401 for invalid token', async () => {
      await request(API_BASE_URL)
        .get('/cart')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
    });
  });

  describe('POST /api/cart/items', () => {
    it('TC-API-CART-004: Should add item to cart', async () => {
      const response = await request(API_BASE_URL)
        .post('/cart/items')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          productId: 'prod-001',
          variantId: 'var-001',
          quantity: 2,
        })
        .expect(201);

      expect(response.body.items).toHaveLength(1);
      expect(response.body.items[0].quantity).toBe(2);
    });

    it('TC-API-CART-005: Should validate product exists', async () => {
      await request(API_BASE_URL)
        .post('/cart/items')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          productId: 'non-existent',
          variantId: 'var-001',
          quantity: 1,
        })
        .expect(404);
    });

    it('TC-API-CART-006: Should validate inventory', async () => {
      await request(API_BASE_URL)
        .post('/cart/items')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          productId: 'prod-001',
          variantId: 'var-001',
          quantity: 10000,
        })
        .expect(400);
    });

    it('TC-API-CART-007: Should validate quantity > 0', async () => {
      await request(API_BASE_URL)
        .post('/cart/items')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          productId: 'prod-001',
          variantId: 'var-001',
          quantity: 0,
        })
        .expect(400);
    });
  });

  describe('PUT /api/cart/items/:productId', () => {
    it('TC-API-CART-008: Should update item quantity', async () => {
      // First add an item
      await request(API_BASE_URL)
        .post('/cart/items')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          productId: 'prod-001',
          variantId: 'var-001',
          quantity: 1,
        });

      // Then update it
      const response = await request(API_BASE_URL)
        .put('/cart/items/prod-001')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          variantId: 'var-001',
          quantity: 5,
        })
        .expect(200);

      expect(response.body.items[0].quantity).toBe(5);
    });

    it('TC-API-CART-009: Should remove item when quantity is 0', async () => {
      await request(API_BASE_URL)
        .put('/cart/items/prod-001')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          variantId: 'var-001',
          quantity: 0,
        })
        .expect(200);

      const cart = await request(API_BASE_URL)
        .get('/cart')
        .set('Authorization', `Bearer ${authToken}`);

      expect(cart.body.items.find((i: any) => i.productId === 'prod-001')).toBeUndefined();
    });
  });

  describe('DELETE /api/cart/items/:productId', () => {
    it('TC-API-CART-010: Should remove item from cart', async () => {
      await request(API_BASE_URL)
        .delete('/cart/items/prod-001')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ variantId: 'var-001' })
        .expect(204);
    });
  });

  describe('POST /api/cart/merge', () => {
    it('TC-API-CART-011: Should merge guest cart on login', async () => {
      const response = await request(API_BASE_URL)
        .post('/cart/merge')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          guestCartId: 'guest-cart-123',
        })
        .expect(200);

      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('items');
    });
  });

  describe('DELETE /api/cart', () => {
    it('TC-API-CART-012: Should clear cart', async () => {
      await request(API_BASE_URL)
        .delete('/cart')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(204);

      const cart = await request(API_BASE_URL)
        .get('/cart')
        .set('Authorization', `Bearer ${authToken}`);

      expect(cart.body.items).toHaveLength(0);
    });
  });
});
