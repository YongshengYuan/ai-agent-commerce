import { describe, it, expect, beforeAll } from '@jest/globals';
import request from 'supertest';

const MCP_BASE_URL = process.env.MCP_BASE_URL || 'http://localhost:3000/api/mcp';

/**
 * AI Agent Workflow Tests
 * Simulates complete shopping workflows by AI Agents
 */
describe('AI Agent Shopping Workflow Tests', () => {
  let sessionId: string;

  beforeAll(async () => {
    // Initialize MCP session
    const initRes = await request(MCP_BASE_URL)
      .post('/')
      .send({
        jsonrpc: '2.0',
        method: 'initialize',
        params: {
          protocolVersion: '2024-11-05',
          capabilities: {},
          clientInfo: {
            name: 'ai-shopping-agent',
            version: '1.0.0',
          },
        },
        id: 1,
      });
    
    sessionId = initRes.body.result.sessionId || 'default-session';
  });

  describe('Scenario 1: Simple Product Search and Purchase', () => {
    it('TC-AGENT-001: Agent searches for products', async () => {
      const response = await request(MCP_BASE_URL)
        .post('/')
        .send({
          jsonrpc: '2.0',
          method: 'tools/call',
          params: {
            name: 'search_products',
            arguments: {
              query: 'wireless headphones',
              limit: 5,
            },
          },
          id: 1,
        })
        .expect(200);

      const results = JSON.parse(response.body.result.content[0].text);
      expect(results).toHaveProperty('products');
      expect(results.products.length).toBeGreaterThan(0);
      expect(results.products[0]).toHaveProperty('id');
      expect(results.products[0]).toHaveProperty('price');
    });

    it('TC-AGENT-002: Agent gets detailed product information', async () => {
      const response = await request(MCP_BASE_URL)
        .post('/')
        .send({
          jsonrpc: '2.0',
          method: 'tools/call',
          params: {
            name: 'get_product_details',
            arguments: {
              productId: 'prod-001',
            },
          },
          id: 2,
        })
        .expect(200);

      const product = JSON.parse(response.body.result.content[0].text);
      expect(product).toHaveProperty('id');
      expect(product).toHaveProperty('variants');
      expect(product).toHaveProperty('inventory');
    });

    it('TC-AGENT-003: Agent adds item to cart', async () => {
      const response = await request(MCP_BASE_URL)
        .post('/')
        .send({
          jsonrpc: '2.0',
          method: 'tools/call',
          params: {
            name: 'add_to_cart',
            arguments: {
              productId: 'prod-001',
              variantId: 'var-001',
              quantity: 1,
            },
          },
          id: 3,
        })
        .expect(200);

      const result = JSON.parse(response.body.result.content[0].text);
      expect(result.success).toBe(true);
      expect(result).toHaveProperty('cartTotal');
    });

    it('TC-AGENT-004: Agent verifies cart contents', async () => {
      const response = await request(MCP_BASE_URL)
        .post('/')
        .send({
          jsonrpc: '2.0',
          method: 'tools/call',
          params: {
            name: 'get_cart',
            arguments: {},
          },
          id: 4,
        })
        .expect(200);

      const cart = JSON.parse(response.body.result.content[0].text);
      expect(cart).toHaveProperty('items');
      expect(cart.items.length).toBeGreaterThan(0);
      expect(cart).toHaveProperty('total');
    });

    it('TC-AGENT-005: Agent completes checkout', async () => {
      const response = await request(MCP_BASE_URL)
        .post('/')
        .send({
          jsonrpc: '2.0',
          method: 'tools/call',
          params: {
            name: 'checkout',
            arguments: {
              shippingAddress: {
                name: 'AI Customer',
                street: '123 Digital Lane',
                city: 'Silicon Valley',
                state: 'CA',
                zip: '94000',
                country: 'US',
              },
              email: 'ai.customer@example.com',
            },
          },
          id: 5,
        })
        .expect(200);

      const result = JSON.parse(response.body.result.content[0].text);
      expect(result).toHaveProperty('orderId');
      expect(result).toHaveProperty('total');
      expect(result.status).toBe('confirmed');
    });
  });

  describe('Scenario 2: Comparison Shopping', () => {
    it('TC-AGENT-006: Agent searches multiple categories', async () => {
      const queries = ['laptop', 'laptop stand', 'wireless mouse'];
      const results = await Promise.all(
        queries.map((query, idx) =>
          request(MCP_BASE_URL)
            .post('/')
            .send({
              jsonrpc: '2.0',
              method: 'tools/call',
              params: {
                name: 'search_products',
                arguments: { query, limit: 3 },
              },
              id: 10 + idx,
            })
        )
      );

      results.forEach((res) => {
        expect(res.status).toBe(200);
        const data = JSON.parse(res.body.result.content[0].text);
        expect(data).toHaveProperty('products');
      });
    });

    it('TC-AGENT-007: Agent compares product specifications', async () => {
      const productIds = ['prod-001', 'prod-002'];
      
      const details = await Promise.all(
        productIds.map((productId, idx) =>
          request(MCP_BASE_URL)
            .post('/')
            .send({
              jsonrpc: '2.0',
              method: 'tools/call',
              params: {
                name: 'get_product_details',
                arguments: { productId },
              },
              id: 20 + idx,
            })
        )
      );

      const products = details.map(d => JSON.parse(d.body.result.content[0].text));
      expect(products).toHaveLength(2);
      
      // Verify we can compare prices
      const prices = products.map(p => p.price);
      expect(prices.every(p => typeof p === 'number')).toBe(true);
    });

    it('TC-AGENT-008: Agent filters by price range', async () => {
      const response = await request(MCP_BASE_URL)
        .post('/')
        .send({
          jsonrpc: '2.0',
          method: 'tools/call',
          params: {
            name: 'search_products',
            arguments: {
              query: 'laptop',
              minPrice: 500,
              maxPrice: 1500,
              limit: 10,
            },
          },
          id: 30,
        })
        .expect(200);

      const results = JSON.parse(response.body.result.content[0].text);
      results.products.forEach((p: any) => {
        expect(p.price).toBeGreaterThanOrEqual(500);
        expect(p.price).toBeLessThanOrEqual(1500);
      });
    });
  });

  describe('Scenario 3: Multi-Item Cart Management', () => {
    it('TC-AGENT-009: Agent adds multiple items to cart', async () => {
      const items = [
        { productId: 'prod-001', variantId: 'var-001', quantity: 2 },
        { productId: 'prod-002', variantId: 'var-003', quantity: 1 },
      ];

      for (let i = 0; i < items.length; i++) {
        await request(MCP_BASE_URL)
          .post('/')
          .send({
            jsonrpc: '2.0',
            method: 'tools/call',
            params: {
              name: 'add_to_cart',
              arguments: items[i],
            },
            id: 40 + i,
          })
          .expect(200);
      }

      // Verify cart has all items
      const cartResponse = await request(MCP_BASE_URL)
        .post('/')
        .send({
          jsonrpc: '2.0',
          method: 'tools/call',
          params: { name: 'get_cart', arguments: {} },
          id: 50,
        });

      const cart = JSON.parse(cartResponse.body.result.content[0].text);
      expect(cart.items.length).toBeGreaterThanOrEqual(items.length);
    });

    it('TC-AGENT-010: Agent updates item quantities', async () => {
      const response = await request(MCP_BASE_URL)
        .post('/')
        .send({
          jsonrpc: '2.0',
          method: 'tools/call',
          params: {
            name: 'update_cart_item',
            arguments: {
              productId: 'prod-001',
              variantId: 'var-001',
              quantity: 5,
            },
          },
          id: 60,
        })
        .expect(200);

      const result = JSON.parse(response.body.result.content[0].text);
      expect(result.success).toBe(true);
    });

    it('TC-AGENT-011: Agent removes item from cart', async () => {
      const response = await request(MCP_BASE_URL)
        .post('/')
        .send({
          jsonrpc: '2.0',
          method: 'tools/call',
          params: {
            name: 'remove_from_cart',
            arguments: {
              productId: 'prod-002',
              variantId: 'var-003',
            },
          },
          id: 70,
        })
        .expect(200);

      const result = JSON.parse(response.body.result.content[0].text);
      expect(result.success).toBe(true);
    });
  });

  describe('Scenario 4: Error Handling and Edge Cases', () => {
    it('TC-AGENT-012: Agent handles out of stock items gracefully', async () => {
      const response = await request(MCP_BASE_URL)
        .post('/')
        .send({
          jsonrpc: '2.0',
          method: 'tools/call',
          params: {
            name: 'add_to_cart',
            arguments: {
              productId: 'out-of-stock-prod',
              variantId: 'var-001',
              quantity: 1,
            },
          },
          id: 80,
        })
        .expect(200);

      const result = JSON.parse(response.body.result.content[0].text);
      expect(result.success).toBe(false);
      expect(result.error).toContain('stock');
    });

    it('TC-AGENT-013: Agent handles invalid product IDs', async () => {
      const response = await request(MCP_BASE_URL)
        .post('/')
        .send({
          jsonrpc: '2.0',
          method: 'tools/call',
          params: {
            name: 'get_product_details',
            arguments: {
              productId: 'invalid-id-12345',
            },
          },
          id: 90,
        })
        .expect(200);

      const result = JSON.parse(response.body.result.content[0].text);
      expect(result.found).toBe(false);
    });

    it('TC-AGENT-014: Agent handles empty search results', async () => {
      const response = await request(MCP_BASE_URL)
        .post('/')
        .send({
          jsonrpc: '2.0',
          method: 'tools/call',
          params: {
            name: 'search_products',
            arguments: {
              query: 'xyznonexistentproduct12345',
              limit: 10,
            },
          },
          id: 100,
        })
        .expect(200);

      const result = JSON.parse(response.body.result.content[0].text);
      expect(result.products).toHaveLength(0);
    });

    it('TC-AGENT-015: Agent handles invalid quantity', async () => {
      const response = await request(MCP_BASE_URL)
        .post('/')
        .send({
          jsonrpc: '2.0',
          method: 'tools/call',
          params: {
            name: 'add_to_cart',
            arguments: {
              productId: 'prod-001',
              variantId: 'var-001',
              quantity: -1,
            },
          },
          id: 110,
        });

      expect(response.status).toBeGreaterThanOrEqual(400);
    });
  });

  describe('Scenario 5: Natural Language Shopping Assistant', () => {
    it('TC-AGENT-016: Agent processes natural language query', async () => {
      const response = await request(MCP_BASE_URL)
        .post('/')
        .send({
          jsonrpc: '2.0',
          method: 'prompts/get',
          params: {
            name: 'shopping_assistant',
            arguments: {
              userQuery: 'I need a gift for a tech enthusiast under $100',
            },
          },
          id: 120,
        })
        .expect(200);

      expect(response.body.result).toHaveProperty('messages');
      expect(response.body.result.messages.length).toBeGreaterThan(0);
    });

    it('TC-AGENT-017: Agent gets product recommendations', async () => {
      const response = await request(MCP_BASE_URL)
        .post('/')
        .send({
          jsonrpc: '2.0',
          method: 'tools/call',
          params: {
            name: 'get_recommendations',
            arguments: {
              basedOn: 'prod-001',
              limit: 5,
            },
          },
          id: 130,
        })
        .expect(200);

      const result = JSON.parse(response.body.result.content[0].text);
      expect(result).toHaveProperty('recommendations');
      expect(Array.isArray(result.recommendations)).toBe(true);
    });

    it('TC-AGENT-018: Agent checks shipping options', async () => {
      const response = await request(MCP_BASE_URL)
        .post('/')
        .send({
          jsonrpc: '2.0',
          method: 'tools/call',
          params: {
            name: 'get_shipping_options',
            arguments: {
              country: 'US',
              zipCode: '10001',
            },
          },
          id: 140,
        })
        .expect(200);

      const result = JSON.parse(response.body.result.content[0].text);
      expect(result).toHaveProperty('options');
      expect(Array.isArray(result.options)).toBe(true);
    });
  });
});
