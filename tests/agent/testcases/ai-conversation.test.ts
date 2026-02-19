import { describe, it, expect, beforeAll } from '@jest/globals';
import request from 'supertest';

const MCP_BASE_URL = process.env.MCP_BASE_URL || 'http://localhost:3000/api/mcp';

/**
 * AI对话场景测试
 * 测试AI Agent与用户自然语言交互的各种场景
 */
describe('AI Conversation Scenario Tests', () => {
  
  describe('Scenario: Product Discovery', () => {
    it('TC-CONV-001: User asks "What laptops do you have?"', async () => {
      const response = await request(MCP_BASE_URL)
        .post('/')
        .send({
          jsonrpc: '2.0',
          method: 'tools/call',
          params: {
            name: 'search_products',
            arguments: {
              query: 'laptop',
              limit: 10,
            },
          },
          id: 1,
        })
        .expect(200);

      const result = JSON.parse(response.body.result.content[0].text);
      expect(result.products.length).toBeGreaterThan(0);
      expect(result.products[0]).toHaveProperty('name');
      expect(result.products[0]).toHaveProperty('price');
    });

    it('TC-CONV-002: User asks for products under specific price', async () => {
      const response = await request(MCP_BASE_URL)
        .post('/')
        .send({
          jsonrpc: '2.0',
          method: 'tools/call',
          params: {
            name: 'search_products',
            arguments: {
              query: 'headphones',
              maxPrice: 100,
              limit: 5,
            },
          },
          id: 2,
        })
        .expect(200);

      const result = JSON.parse(response.body.result.content[0].text);
      result.products.forEach((p: any) => {
        expect(p.price).toBeLessThanOrEqual(100);
      });
    });

    it('TC-CONV-003: User asks for best-rated products', async () => {
      const response = await request(MCP_BASE_URL)
        .post('/')
        .send({
          jsonrpc: '2.0',
          method: 'tools/call',
          params: {
            name: 'search_products',
            arguments: {
              query: '',
              sortBy: 'rating',
              sortOrder: 'desc',
              limit: 5,
            },
          },
          id: 3,
        })
        .expect(200);

      const result = JSON.parse(response.body.result.content[0].text);
      const ratings = result.products.map((p: any) => p.rating);
      const sortedRatings = [...ratings].sort((a, b) => b - a);
      expect(ratings).toEqual(sortedRatings);
    });
  });

  describe('Scenario: Gift Shopping', () => {
    it('TC-CONV-004: User asks for gift recommendations', async () => {
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
          id: 4,
        })
        .expect(200);

      expect(response.body.result.messages).toBeDefined();
      expect(response.body.result.messages.length).toBeGreaterThan(0);
    });

    it('TC-CONV-005: User asks for birthday gift for mom', async () => {
      const response = await request(MCP_BASE_URL)
        .post('/')
        .send({
          jsonrpc: '2.0',
          method: 'tools/call',
          params: {
            name: 'get_recommendations',
            arguments: {
              occasion: 'birthday',
              recipient: 'mother',
              budget: 50,
              limit: 5,
            },
          },
          id: 5,
        })
        .expect(200);

      const result = JSON.parse(response.body.result.content[0].text);
      expect(result.recommendations).toBeDefined();
    });
  });

  describe('Scenario: Comparison Shopping', () => {
    it('TC-CONV-006: User compares two products', async () => {
      const products = ['prod-001', 'prod-002'];
      
      const details = await Promise.all(
        products.map((id, idx) =>
          request(MCP_BASE_URL)
            .post('/')
            .send({
              jsonrpc: '2.0',
              method: 'tools/call',
              params: {
                name: 'get_product_details',
                arguments: { productId: id },
              },
              id: 10 + idx,
            })
        )
      );

      const productData = details.map(d => 
        JSON.parse(d.body.result.content[0].text)
      );
      
      expect(productData).toHaveLength(2);
      
      // Verify we can compare
      const comparison = {
        name1: productData[0].name,
        price1: productData[0].price,
        rating1: productData[0].rating,
        name2: productData[1].name,
        price2: productData[1].price,
        rating2: productData[1].rating,
      };
      
      expect(comparison).toBeDefined();
    });

    it('TC-CONV-007: User asks "What\'s the difference between X and Y?"', async () => {
      const response = await request(MCP_BASE_URL)
        .post('/')
        .send({
          jsonrpc: '2.0',
          method: 'prompts/get',
          params: {
            name: 'product_comparison',
            arguments: {
              productIds: ['prod-001', 'prod-002'],
            },
          },
          id: 20,
        })
        .expect(200);

      expect(response.body.result.messages).toBeDefined();
    });
  });

  describe('Scenario: Cart Management via Conversation', () => {
    it('TC-CONV-008: User says "Add the red headphones to my cart"', async () => {
      // First search for the product
      const searchRes = await request(MCP_BASE_URL)
        .post('/')
        .send({
          jsonrpc: '2.0',
          method: 'tools/call',
          params: {
            name: 'search_products',
            arguments: { query: 'red headphones' },
          },
          id: 30,
        });

      const product = JSON.parse(searchRes.body.result.content[0].text).products[0];

      // Add to cart
      const addRes = await request(MCP_BASE_URL)
        .post('/')
        .send({
          jsonrpc: '2.0',
          method: 'tools/call',
          params: {
            name: 'add_to_cart',
            arguments: {
              productId: product.id,
              variantId: product.variants?.[0]?.id,
              quantity: 1,
            },
          },
          id: 31,
        })
        .expect(200);

      const result = JSON.parse(addRes.body.result.content[0].text);
      expect(result.success).toBe(true);
    });

    it('TC-CONV-009: User asks "What\'s in my cart?"', async () => {
      const response = await request(MCP_BASE_URL)
        .post('/')
        .send({
          jsonrpc: '2.0',
          method: 'tools/call',
          params: {
            name: 'get_cart',
            arguments: {},
          },
          id: 40,
        })
        .expect(200);

      const result = JSON.parse(response.body.result.content[0].text);
      expect(result).toHaveProperty('items');
      expect(result).toHaveProperty('total');
    });

    it('TC-CONV-010: User says "Remove the laptop from my cart"', async () => {
      // First get cart
      const cartRes = await request(MCP_BASE_URL)
        .post('/')
        .send({
          jsonrpc: '2.0',
          method: 'tools/call',
          params: { name: 'get_cart', arguments: {} },
          id: 50,
        });

      const cart = JSON.parse(cartRes.body.result.content[0].text);
      
      if (cart.items.length > 0) {
        const laptopItem = cart.items.find((i: any) => 
          i.name.toLowerCase().includes('laptop')
        ) || cart.items[0];

        const removeRes = await request(MCP_BASE_URL)
          .post('/')
          .send({
            jsonrpc: '2.0',
            method: 'tools/call',
            params: {
              name: 'remove_from_cart',
              arguments: {
                productId: laptopItem.productId,
                variantId: laptopItem.variantId,
              },
            },
            id: 51,
          })
          .expect(200);

        const result = JSON.parse(removeRes.body.result.content[0].text);
        expect(result.success).toBe(true);
      }
    });
  });

  describe('Scenario: Checkout via Conversation', () => {
    it('TC-CONV-011: User says "I want to checkout"', async () => {
      // Add item first
      await request(MCP_BASE_URL)
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
          id: 60,
        });

      // Proceed to checkout
      const response = await request(MCP_BASE_URL)
        .post('/')
        .send({
          jsonrpc: '2.0',
          method: 'tools/call',
          params: {
            name: 'checkout',
            arguments: {
              shippingAddress: {
                name: 'John Doe',
                street: '123 Main St',
                city: 'New York',
                state: 'NY',
                zip: '10001',
                country: 'US',
              },
            },
          },
          id: 61,
        })
        .expect(200);

      const result = JSON.parse(response.body.result.content[0].text);
      expect(result).toHaveProperty('orderId');
      expect(result.status).toBe('confirmed');
    });

    it('TC-CONV-012: User asks about shipping options', async () => {
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
          id: 70,
        })
        .expect(200);

      const result = JSON.parse(response.body.result.content[0].text);
      expect(result.options).toBeDefined();
      expect(result.options.length).toBeGreaterThan(0);
    });

    it('TC-CONV-013: User asks "How much is shipping to Canada?"', async () => {
      const response = await request(MCP_BASE_URL)
        .post('/')
        .send({
          jsonrpc: '2.0',
          method: 'tools/call',
          params: {
            name: 'get_shipping_options',
            arguments: {
              country: 'CA',
              zipCode: 'M5V 3A8',
            },
          },
          id: 80,
        })
        .expect(200);

      const result = JSON.parse(response.body.result.content[0].text);
      expect(result.options).toBeDefined();
    });
  });

  describe('Scenario: Order Tracking', () => {
    it('TC-CONV-014: User asks "Where is my order?"', async () => {
      const response = await request(MCP_BASE_URL)
        .post('/')
        .send({
          jsonrpc: '2.0',
          method: 'tools/call',
          params: {
            name: 'get_order_status',
            arguments: {
              orderId: 'ord-001',
            },
          },
          id: 90,
        })
        .expect(200);

      const result = JSON.parse(response.body.result.content[0].text);
      expect(result).toHaveProperty('status');
      expect(result).toHaveProperty('trackingNumber');
    });

    it('TC-CONV-015: User asks for order history', async () => {
      const response = await request(MCP_BASE_URL)
        .post('/')
        .send({
          jsonrpc: '2.0',
          method: 'tools/call',
          params: {
            name: 'get_order_history',
            arguments: {
              limit: 10,
            },
          },
          id: 100,
        })
        .expect(200);

      const result = JSON.parse(response.body.result.content[0].text);
      expect(result.orders).toBeDefined();
    });
  });

  describe('Scenario: Error Handling in Conversations', () => {
    it('TC-CONV-016: Handle out of stock gracefully', async () => {
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
          id: 110,
        })
        .expect(200);

      const result = JSON.parse(response.body.result.content[0].text);
      expect(result.success).toBe(false);
      expect(result.message).toContain('stock');
    });

    it('TC-CONV-017: Handle invalid product ID gracefully', async () => {
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
          id: 120,
        })
        .expect(200);

      const result = JSON.parse(response.body.result.content[0].text);
      expect(result.found).toBe(false);
    });

    it('TC-CONV-018: Handle ambiguous queries', async () => {
      const response = await request(MCP_BASE_URL)
        .post('/')
        .send({
          jsonrpc: '2.0',
          method: 'prompts/get',
          params: {
            name: 'shopping_assistant',
            arguments: {
              userQuery: 'that thing I saw yesterday',
            },
          },
          id: 130,
        })
        .expect(200);

      expect(response.body.result.messages).toBeDefined();
    });
  });
});
