import { describe, it, expect, beforeAll } from '@jest/globals';
import request from 'supertest';

const MCP_BASE_URL = process.env.MCP_BASE_URL || 'http://localhost:3000/api/mcp';

/**
 * MCP Protocol Compatibility Tests
 * Tests compliance with Model Context Protocol specification
 */
describe('MCP Protocol Compatibility Tests', () => {
  describe('JSON-RPC 2.0 Compliance', () => {
    it('TC-MCP-001: Should accept valid JSON-RPC 2.0 requests', async () => {
      const response = await request(MCP_BASE_URL)
        .post('/')
        .send({
          jsonrpc: '2.0',
          method: 'tools/list',
          id: 1,
        })
        .expect(200);

      expect(response.body.jsonrpc).toBe('2.0');
      expect(response.body).toHaveProperty('id');
    });

    it('TC-MCP-002: Should reject invalid JSON-RPC version', async () => {
      const response = await request(MCP_BASE_URL)
        .post('/')
        .send({
          jsonrpc: '1.0',
          method: 'tools/list',
          id: 1,
        })
        .expect(400);

      expect(response.body.error).toBeDefined();
      expect(response.body.error.code).toBe(-32600); // Invalid Request
    });

    it('TC-MCP-003: Should handle missing method error', async () => {
      const response = await request(MCP_BASE_URL)
        .post('/')
        .send({
          jsonrpc: '2.0',
          id: 1,
        })
        .expect(400);

      expect(response.body.error.code).toBe(-32600);
    });

    it('TC-MCP-004: Should return method not found for unknown methods', async () => {
      const response = await request(MCP_BASE_URL)
        .post('/')
        .send({
          jsonrpc: '2.0',
          method: 'unknown/method',
          id: 1,
        })
        .expect(404);

      expect(response.body.error.code).toBe(-32601); // Method not found
    });

    it('TC-MCP-005: Should handle notification requests (no id)', async () => {
      const response = await request(MCP_BASE_URL)
        .post('/')
        .send({
          jsonrpc: '2.0',
          method: 'ping',
        });

      // Notifications should not return a response body
      expect(response.status).toBe(204);
    });

    it('TC-MCP-006: Should handle batch requests', async () => {
      const response = await request(MCP_BASE_URL)
        .post('/')
        .send([
          { jsonrpc: '2.0', method: 'tools/list', id: 1 },
          { jsonrpc: '2.0', method: 'tools/list', id: 2 },
        ])
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body).toHaveLength(2);
    });
  });

  describe('MCP Tools Discovery', () => {
    it('TC-MCP-007: Should list available tools', async () => {
      const response = await request(MCP_BASE_URL)
        .post('/')
        .send({
          jsonrpc: '2.0',
          method: 'tools/list',
          id: 1,
        })
        .expect(200);

      expect(response.body.result).toHaveProperty('tools');
      expect(Array.isArray(response.body.result.tools)).toBe(true);

      // Verify required e-commerce tools exist
      const toolNames = response.body.result.tools.map((t: any) => t.name);
      expect(toolNames).toContain('search_products');
      expect(toolNames).toContain('get_product_details');
      expect(toolNames).toContain('add_to_cart');
      expect(toolNames).toContain('get_cart');
      expect(toolNames).toContain('checkout');
    });

    it('TC-MCP-008: Should include tool schemas', async () => {
      const response = await request(MCP_BASE_URL)
        .post('/')
        .send({
          jsonrpc: '2.0',
          method: 'tools/list',
          id: 1,
        })
        .expect(200);

      const searchTool = response.body.result.tools.find(
        (t: any) => t.name === 'search_products'
      );

      expect(searchTool).toHaveProperty('description');
      expect(searchTool).toHaveProperty('inputSchema');
      expect(searchTool.inputSchema).toHaveProperty('type');
      expect(searchTool.inputSchema).toHaveProperty('properties');
    });
  });

  describe('MCP Tool Invocation', () => {
    it('TC-MCP-009: Should invoke search_products tool', async () => {
      const response = await request(MCP_BASE_URL)
        .post('/')
        .send({
          jsonrpc: '2.0',
          method: 'tools/call',
          params: {
            name: 'search_products',
            arguments: {
              query: 'laptop',
              limit: 5,
            },
          },
          id: 1,
        })
        .expect(200);

      expect(response.body.result).toHaveProperty('content');
      expect(Array.isArray(response.body.result.content)).toBe(true);
    });

    it('TC-MCP-010: Should validate tool parameters', async () => {
      const response = await request(MCP_BASE_URL)
        .post('/')
        .send({
          jsonrpc: '2.0',
          method: 'tools/call',
          params: {
            name: 'search_products',
            arguments: {
              // Missing required 'query' parameter
              limit: 5,
            },
          },
          id: 1,
        })
        .expect(400);

      expect(response.body.error.code).toBe(-32602); // Invalid params
    });

    it('TC-MCP-011: Should handle add_to_cart tool', async () => {
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
          id: 1,
        })
        .expect(200);

      expect(response.body.result.content[0].text).toContain('added');
    });

    it('TC-MCP-012: Should handle get_cart tool', async () => {
      const response = await request(MCP_BASE_URL)
        .post('/')
        .send({
          jsonrpc: '2.0',
          method: 'tools/call',
          params: {
            name: 'get_cart',
            arguments: {},
          },
          id: 1,
        })
        .expect(200);

      expect(response.body.result).toHaveProperty('content');
    });

    it('TC-MCP-013: Should handle checkout tool', async () => {
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
          id: 1,
        })
        .expect(200);

      expect(response.body.result.content[0].text).toContain('order');
    });
  });

  describe('MCP Resources', () => {
    it('TC-MCP-014: Should list available resources', async () => {
      const response = await request(MCP_BASE_URL)
        .post('/')
        .send({
          jsonrpc: '2.0',
          method: 'resources/list',
          id: 1,
        })
        .expect(200);

      expect(response.body.result).toHaveProperty('resources');
      expect(Array.isArray(response.body.result.resources)).toBe(true);
    });

    it('TC-MCP-015: Should read product resource', async () => {
      const response = await request(MCP_BASE_URL)
        .post('/')
        .send({
          jsonrpc: '2.0',
          method: 'resources/read',
          params: {
            uri: 'products://prod-001',
          },
          id: 1,
        })
        .expect(200);

      expect(response.body.result).toHaveProperty('contents');
    });
  });

  describe('MCP Prompts', () => {
    it('TC-MCP-016: Should list available prompts', async () => {
      const response = await request(MCP_BASE_URL)
        .post('/')
        .send({
          jsonrpc: '2.0',
          method: 'prompts/list',
          id: 1,
        })
        .expect(200);

      expect(response.body.result).toHaveProperty('prompts');
      expect(Array.isArray(response.body.result.prompts)).toBe(true);
    });

    it('TC-MCP-017: Should get shopping assistant prompt', async () => {
      const response = await request(MCP_BASE_URL)
        .post('/')
        .send({
          jsonrpc: '2.0',
          method: 'prompts/get',
          params: {
            name: 'shopping_assistant',
            arguments: {
              userQuery: 'I need a laptop under $1000',
            },
          },
          id: 1,
        })
        .expect(200);

      expect(response.body.result).toHaveProperty('messages');
    });
  });

  describe('MCP Error Handling', () => {
    it('TC-MCP-018: Should handle parse errors', async () => {
      const response = await request(MCP_BASE_URL)
        .post('/')
        .send('invalid json')
        .expect(400);

      expect(response.body.error.code).toBe(-32700); // Parse error
    });

    it('TC-MCP-019: Should handle internal errors gracefully', async () => {
      // Force an internal error with invalid params
      const response = await request(MCP_BASE_URL)
        .post('/')
        .send({
          jsonrpc: '2.0',
          method: 'tools/call',
          params: {
            name: 'search_products',
            arguments: null,
          },
          id: 1,
        })
        .expect(500);

      expect(response.body.error.code).toBe(-32603); // Internal error
    });

    it('TC-MCP-020: Should include error details', async () => {
      const response = await request(MCP_BASE_URL)
        .post('/')
        .send({
          jsonrpc: '2.0',
          method: 'tools/call',
          params: {
            name: 'non_existent_tool',
            arguments: {},
          },
          id: 1,
        })
        .expect(404);

      expect(response.body.error).toHaveProperty('message');
      expect(response.body.error.message).toContain('not found');
    });
  });

  describe('MCP Server Capabilities', () => {
    it('TC-MCP-021: Should declare server capabilities', async () => {
      const response = await request(MCP_BASE_URL)
        .post('/')
        .send({
          jsonrpc: '2.0',
          method: 'initialize',
          params: {
            protocolVersion: '2024-11-05',
            capabilities: {},
            clientInfo: {
              name: 'test-client',
              version: '1.0.0',
            },
          },
          id: 1,
        })
        .expect(200);

      expect(response.body.result).toHaveProperty('capabilities');
      expect(response.body.result).toHaveProperty('serverInfo');
      expect(response.body.result.capabilities).toHaveProperty('tools');
      expect(response.body.result.capabilities).toHaveProperty('resources');
    });

    it('TC-MCP-022: Should support protocol version negotiation', async () => {
      const response = await request(MCP_BASE_URL)
        .post('/')
        .send({
          jsonrpc: '2.0',
          method: 'initialize',
          params: {
            protocolVersion: '2024-11-05',
            capabilities: {},
            clientInfo: {
              name: 'test-client',
              version: '1.0.0',
            },
          },
          id: 1,
        })
        .expect(200);

      expect(response.body.result.protocolVersion).toBe('2024-11-05');
    });
  });
});
