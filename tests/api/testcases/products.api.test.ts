import { describe, it, expect, beforeAll } from '@jest/globals';
import request from 'supertest';

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000/api';

describe('Products API Tests', () => {
  describe('GET /api/products', () => {
    it('TC-API-PROD-001: Should return product list', async () => {
      const response = await request(API_BASE_URL)
        .get('/products')
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('pagination');
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('TC-API-PROD-002: Should support pagination', async () => {
      const response = await request(API_BASE_URL)
        .get('/products?page=1&limit=10')
        .expect(200);

      expect(response.body.pagination).toMatchObject({
        page: 1,
        limit: 10,
        total: expect.any(Number),
      });
    });

    it('TC-API-PROD-003: Should filter by category', async () => {
      const response = await request(API_BASE_URL)
        .get('/products?category=Electronics')
        .expect(200);

      response.body.data.forEach((product: any) => {
        expect(product.category).toBe('Electronics');
      });
    });

    it('TC-API-PROD-004: Should sort products', async () => {
      const response = await request(API_BASE_URL)
        .get('/products?sort=price&order=asc')
        .expect(200);

      const prices = response.body.data.map((p: any) => p.price);
      const sortedPrices = [...prices].sort((a, b) => a - b);
      expect(prices).toEqual(sortedPrices);
    });

    it('TC-API-PROD-005: Should return 400 for invalid query params', async () => {
      await request(API_BASE_URL)
        .get('/products?page=invalid')
        .expect(400);
    });
  });

  describe('GET /api/products/:id', () => {
    it('TC-API-PROD-006: Should return single product', async () => {
      const response = await request(API_BASE_URL)
        .get('/products/prod-001')
        .expect(200);

      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('name');
      expect(response.body).toHaveProperty('price');
      expect(response.body).toHaveProperty('variants');
    });

    it('TC-API-PROD-007: Should return 404 for non-existent product', async () => {
      await request(API_BASE_URL)
        .get('/products/non-existent-id')
        .expect(404);
    });

    it('TC-API-PROD-008: Should include product metadata', async () => {
      const response = await request(API_BASE_URL)
        .get('/products/prod-001')
        .expect(200);

      expect(response.body).toHaveProperty('createdAt');
      expect(response.body).toHaveProperty('updatedAt');
      expect(response.body).toHaveProperty('rating');
      expect(response.body).toHaveProperty('reviewCount');
    });
  });

  describe('GET /api/products/search', () => {
    it('TC-API-SEARCH-001: Should search by keyword', async () => {
      const response = await request(API_BASE_URL)
        .get('/products/search?q=laptop')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });

    it('TC-API-SEARCH-002: Should support filters', async () => {
      const response = await request(API_BASE_URL)
        .get('/products/search?q=phone&minPrice=100&maxPrice=1000')
        .expect(200);

      response.body.forEach((product: any) => {
        expect(product.price).toBeGreaterThanOrEqual(100);
        expect(product.price).toBeLessThanOrEqual(1000);
      });
    });

    it('TC-API-SEARCH-003: Should handle empty search results', async () => {
      const response = await request(API_BASE_URL)
        .get('/products/search?q=xyznonexistent')
        .expect(200);

      expect(response.body).toHaveLength(0);
    });
  });

  describe('GET /api/categories', () => {
    it('TC-API-CAT-001: Should return all categories', async () => {
      const response = await request(API_BASE_URL)
        .get('/categories')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      response.body.forEach((category: any) => {
        expect(category).toHaveProperty('id');
        expect(category).toHaveProperty('name');
      });
    });
  });
});
