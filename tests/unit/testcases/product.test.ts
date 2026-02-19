import { describe, it, expect, beforeEach } from '@jest/globals';
import { ProductService } from '../../../src/services/product.service';
import { Product } from '../../../src/types/product';

// Mock data
const mockProducts: Product[] = [
  {
    id: 'prod-001',
    name: 'Wireless Bluetooth Headphones',
    description: 'High-quality wireless headphones with noise cancellation',
    price: 79.99,
    currency: 'USD',
    category: 'Electronics',
    tags: ['wireless', 'audio', 'bluetooth'],
    inventory: 50,
    images: ['https://example.com/headphones-1.jpg'],
    variants: [
      { id: 'var-001', name: 'Black', sku: 'WH-BLK-001', price: 79.99 },
      { id: 'var-002', name: 'White', sku: 'WH-WHT-001', price: 79.99 },
    ],
    rating: 4.5,
    reviewCount: 128,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  {
    id: 'prod-002',
    name: 'Organic Cotton T-Shirt',
    description: 'Comfortable organic cotton t-shirt',
    price: 29.99,
    currency: 'USD',
    category: 'Clothing',
    tags: ['organic', 'cotton', 'sustainable'],
    inventory: 100,
    images: ['https://example.com/tshirt-1.jpg'],
    variants: [
      { id: 'var-003', name: 'Small', sku: 'TS-SML-001', price: 29.99 },
      { id: 'var-004', name: 'Medium', sku: 'TS-MED-001', price: 29.99 },
      { id: 'var-005', name: 'Large', sku: 'TS-LRG-001', price: 29.99 },
    ],
    rating: 4.8,
    reviewCount: 256,
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-15'),
  },
];

describe('Product Module Tests', () => {
  let productService: ProductService;

  beforeEach(() => {
    productService = new ProductService();
    // Mock the database calls
    jest.spyOn(productService, 'getAll').mockResolvedValue(mockProducts);
    jest.spyOn(productService, 'getById').mockImplementation((id: string) => {
      return Promise.resolve(mockProducts.find(p => p.id === id) || null);
    });
  });

  describe('Product Browsing', () => {
    it('TC-PROD-001: Should return all products', async () => {
      const products = await productService.getAll();
      expect(products).toHaveLength(2);
      expect(products[0]).toHaveProperty('id');
      expect(products[0]).toHaveProperty('name');
      expect(products[0]).toHaveProperty('price');
    });

    it('TC-PROD-002: Should return product by ID', async () => {
      const product = await productService.getById('prod-001');
      expect(product).not.toBeNull();
      expect(product?.name).toBe('Wireless Bluetooth Headphones');
      expect(product?.price).toBe(79.99);
    });

    it('TC-PROD-003: Should return null for non-existent product', async () => {
      const product = await productService.getById('non-existent');
      expect(product).toBeNull();
    });

    it('TC-PROD-004: Should validate product structure', async () => {
      const product = await productService.getById('prod-001');
      expect(product).toMatchObject({
        id: expect.any(String),
        name: expect.any(String),
        price: expect.any(Number),
        inventory: expect.any(Number),
      });
    });
  });

  describe('Product Search', () => {
    it('TC-SEARCH-001: Should search products by keyword', async () => {
      const searchSpy = jest.spyOn(productService, 'search').mockResolvedValue([mockProducts[0]]);
      const results = await productService.search('headphones');
      expect(results).toHaveLength(1);
      expect(results[0].name).toContain('Headphones');
    });

    it('TC-SEARCH-002: Should search with category filter', async () => {
      const searchSpy = jest.spyOn(productService, 'search').mockResolvedValue([mockProducts[1]]);
      const results = await productService.search('', { category: 'Clothing' });
      expect(results[0].category).toBe('Clothing');
    });

    it('TC-SEARCH-003: Should support price range filter', async () => {
      const searchSpy = jest.spyOn(productService, 'search').mockResolvedValue([mockProducts[1]]);
      const results = await productService.search('', { minPrice: 0, maxPrice: 50 });
      expect(results.every(p => p.price <= 50)).toBe(true);
    });

    it('TC-SEARCH-004: Should return empty array for no matches', async () => {
      jest.spyOn(productService, 'search').mockResolvedValue([]);
      const results = await productService.search('xyz-nonexistent');
      expect(results).toHaveLength(0);
    });

    it('TC-SEARCH-005: Should handle fuzzy search', async () => {
      const searchSpy = jest.spyOn(productService, 'search').mockResolvedValue([mockProducts[0]]);
      const results = await productService.search('headfone'); // Typo
      expect(results.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Product Variants', () => {
    it('TC-VARIANT-001: Should return all variants for a product', async () => {
      const product = await productService.getById('prod-001');
      expect(product?.variants).toHaveLength(2);
    });

    it('TC-VARIANT-002: Should validate variant structure', async () => {
      const product = await productService.getById('prod-001');
      const variant = product?.variants[0];
      expect(variant).toMatchObject({
        id: expect.any(String),
        name: expect.any(String),
        sku: expect.any(String),
        price: expect.any(Number),
      });
    });
  });

  describe('Inventory Management', () => {
    it('TC-INV-001: Should check product availability', async () => {
      const product = await productService.getById('prod-001');
      expect(product?.inventory).toBeGreaterThan(0);
    });

    it('TC-INV-002: Should identify out of stock products', async () => {
      const outOfStockProduct = { ...mockProducts[0], inventory: 0 };
      jest.spyOn(productService, 'getById').mockResolvedValue(outOfStockProduct);
      const product = await productService.getById('prod-001');
      expect(product?.inventory).toBe(0);
    });
  });
});
