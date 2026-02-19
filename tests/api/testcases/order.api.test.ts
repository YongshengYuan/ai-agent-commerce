import { describe, it, expect, beforeEach } from '@jest/globals';
import request from 'supertest';

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000/api';

describe('Order API Tests', () => {
  let authToken: string;

  beforeEach(async () => {
    const loginRes = await request(API_BASE_URL)
      .post('/auth/login')
      .send({ email: 'test@example.com', password: 'password123' });
    authToken = loginRes.body.token;
  });

  describe('POST /api/orders', () => {
    it('TC-API-ORDER-001: Should create order from cart', async () => {
      const response = await request(API_BASE_URL)
        .post('/orders')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          shippingAddress: {
            name: 'John Doe',
            street: '123 Main St',
            city: 'New York',
            state: 'NY',
            zip: '10001',
            country: 'US',
          },
          billingAddress: {
            name: 'John Doe',
            street: '123 Main St',
            city: 'New York',
            state: 'NY',
            zip: '10001',
            country: 'US',
          },
        })
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('status');
      expect(response.body.status).toBe('pending');
    });

    it('TC-API-ORDER-002: Should validate shipping address', async () => {
      await request(API_BASE_URL)
        .post('/orders')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          shippingAddress: {
            name: '', // Invalid - empty name
            street: '123 Main St',
          },
        })
        .expect(400);
    });

    it('TC-API-ORDER-003: Should not create order from empty cart', async () => {
      // Clear cart first
      await request(API_BASE_URL)
        .delete('/cart')
        .set('Authorization', `Bearer ${authToken}`);

      await request(API_BASE_URL)
        .post('/orders')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          shippingAddress: {
            name: 'John Doe',
            street: '123 Main St',
            city: 'New York',
            state: 'NY',
            zip: '10001',
            country: 'US',
          },
        })
        .expect(400);
    });
  });

  describe('GET /api/orders', () => {
    it('TC-API-ORDER-004: Should list user orders', async () => {
      const response = await request(API_BASE_URL)
        .get('/orders')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });

    it('TC-API-ORDER-005: Should filter by status', async () => {
      const response = await request(API_BASE_URL)
        .get('/orders?status=completed')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      response.body.forEach((order: any) => {
        expect(order.status).toBe('completed');
      });
    });

    it('TC-API-ORDER-006: Should paginate results', async () => {
      const response = await request(API_BASE_URL)
        .get('/orders?page=1&limit=5')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('pagination');
    });
  });

  describe('GET /api/orders/:id', () => {
    it('TC-API-ORDER-007: Should return order details', async () => {
      // First create an order
      const createRes = await request(API_BASE_URL)
        .post('/orders')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          shippingAddress: {
            name: 'John Doe',
            street: '123 Main St',
            city: 'New York',
            state: 'NY',
            zip: '10001',
            country: 'US',
          },
        });

      const orderId = createRes.body.id;

      const response = await request(API_BASE_URL)
        .get(`/orders/${orderId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('id', orderId);
      expect(response.body).toHaveProperty('items');
      expect(response.body).toHaveProperty('total');
      expect(response.body).toHaveProperty('shippingAddress');
    });

    it('TC-API-ORDER-008: Should return 404 for non-existent order', async () => {
      await request(API_BASE_URL)
        .get('/orders/non-existent-id')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });

    it('TC-API-ORDER-009: Should not allow access to other user orders', async () => {
      await request(API_BASE_URL)
        .get('/orders/other-user-order-id')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(403);
    });
  });

  describe('POST /api/orders/:id/cancel', () => {
    it('TC-API-ORDER-010: Should cancel pending order', async () => {
      const response = await request(API_BASE_URL)
        .post('/orders/ord-001/cancel')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ reason: 'Changed my mind' })
        .expect(200);

      expect(response.body.status).toBe('cancelled');
    });

    it('TC-API-ORDER-011: Should not cancel shipped order', async () => {
      await request(API_BASE_URL)
        .post('/orders/shipped-order-id/cancel')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ reason: 'Changed my mind' })
        .expect(400);
    });
  });

  describe('POST /api/orders/:id/payment', () => {
    it('TC-API-PAY-001: Should process payment', async () => {
      const response = await request(API_BASE_URL)
        .post('/orders/ord-001/payment')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          paymentMethod: 'card',
          paymentToken: 'tok_visa',
        })
        .expect(200);

      expect(response.body).toHaveProperty('status');
      expect(response.body).toHaveProperty('transactionId');
    });

    it('TC-API-PAY-002: Should handle payment failure', async () => {
      const response = await request(API_BASE_URL)
        .post('/orders/ord-001/payment')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          paymentMethod: 'card',
          paymentToken: 'invalid_token',
        })
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('GET /api/orders/:id/tracking', () => {
    it('TC-API-TRACK-001: Should return tracking information', async () => {
      const response = await request(API_BASE_URL)
        .get('/orders/ord-001/tracking')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('trackingNumber');
      expect(response.body).toHaveProperty('carrier');
      expect(response.body).toHaveProperty('status');
      expect(response.body).toHaveProperty('events');
    });
  });
});
