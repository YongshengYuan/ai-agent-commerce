import { jest } from '@jest/globals';

/**
 * Test Helper Utilities
 */

// Mock data generators
export const generateMockProduct = (overrides = {}) => ({
  id: 'prod-001',
  name: 'Test Product',
  description: 'A test product description',
  price: 99.99,
  currency: 'USD',
  category: 'Electronics',
  tags: ['test', 'electronics'],
  inventory: 100,
  images: ['https://example.com/image.jpg'],
  variants: [
    { id: 'var-001', name: 'Standard', sku: 'SKU-001', price: 0 },
  ],
  rating: 4.5,
  reviewCount: 10,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

export const generateMockCart = (overrides = {}) => ({
  id: 'cart-001',
  items: [],
  total: 0,
  currency: 'USD',
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

export const generateMockCartItem = (overrides = {}) => ({
  productId: 'prod-001',
  variantId: 'var-001',
  name: 'Test Product',
  price: 99.99,
  quantity: 1,
  image: 'https://example.com/image.jpg',
  ...overrides,
});

export const generateMockOrder = (overrides = {}) => ({
  id: 'ord-001',
  userId: 'user-001',
  items: [generateMockCartItem()],
  subtotal: 99.99,
  shipping: 10,
  tax: 8.8,
  total: 118.79,
  currency: 'USD',
  status: 'pending',
  shippingAddress: {
    name: 'John Doe',
    street: '123 Main St',
    city: 'New York',
    state: 'NY',
    zip: '10001',
    country: 'US',
  },
  paymentStatus: 'pending',
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

// MCP Protocol helpers
export const createMCPRequest = (method: string, params = {}, id = 1) => ({
  jsonrpc: '2.0',
  method,
  params,
  id,
});

export const createMCPNotification = (method: string, params = {}) => ({
  jsonrpc: '2.0',
  method,
  params,
});

export const expectMCPResponse = (response: any, expectedId: number) => {
  expect(response.jsonrpc).toBe('2.0');
  expect(response.id).toBe(expectedId);
  expect(response).toHaveProperty('result');
};

export const expectMCPError = (response: any, expectedCode: number) => {
  expect(response.jsonrpc).toBe('2.0');
  expect(response).toHaveProperty('error');
  expect(response.error.code).toBe(expectedCode);
};

// Async test helpers
export const waitFor = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const retry = async <T>(
  fn: () => Promise<T>,
  options: { retries?: number; delay?: number } = {}
): Promise<T> => {
  const { retries = 3, delay = 1000 } = options;
  
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === retries - 1) throw error;
      await waitFor(delay);
    }
  }
  
  throw new Error('Retry failed');
};

// Database helpers
export const clearDatabase = async () => {
  // Implementation depends on your database
  // This is a placeholder
};

export const seedDatabase = async (data: any) => {
  // Implementation depends on your database
  // This is a placeholder
};

// API test helpers
export const createAuthHeader = (token: string) => ({
  Authorization: `Bearer ${token}`,
});

export const expectValidationError = (response: any, field: string) => {
  expect(response.status).toBe(400);
  expect(response.body.errors).toBeDefined();
  expect(response.body.errors.some((e: any) => e.field === field)).toBe(true);
};

// Performance test helpers
export const measureResponseTime = async <T>(
  fn: () => Promise<T>
): Promise<{ result: T; duration: number }> => {
  const start = Date.now();
  const result = await fn();
  const duration = Date.now() - start;
  return { result, duration };
};

export const assertResponseTime = (duration: number, maxMs: number) => {
  expect(duration).toBeLessThan(maxMs);
};

// Agent simulation helpers
export const simulateAgentConversation = async (queries: string[]) => {
  const responses = [];
  
  for (const query of queries) {
    // Simulate MCP call
    const response = await fetch('http://localhost:3000/api/mcp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(createMCPRequest('prompts/get', {
        name: 'shopping_assistant',
        arguments: { userQuery: query },
      })),
    });
    
    responses.push(await response.json());
  }
  
  return responses;
};
