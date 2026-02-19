import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');
const apiResponseTime = new Trend('api_response_time');
const pageLoadTime = new Trend('page_load_time');
const successCounter = new Counter('successful_requests');

export const options = {
  stages: [
    { duration: '2m', target: 10 },   // Ramp up
    { duration: '5m', target: 50 },   // Steady state
    { duration: '2m', target: 100 },  // Peak load
    { duration: '2m', target: 200 },  // Stress test
    { duration: '3m', target: 0 },    // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'],  // 95% under 500ms
    http_req_failed: ['rate<0.01'],    // Error rate < 1%
    errors: ['rate<0.05'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';
const API_URL = __ENV.API_URL || 'http://localhost:3000/api';

export default function () {
  group('Page Load Tests', () => {
    const pages = [
      '/',
      '/products',
      '/cart',
      '/checkout',
    ];
    
    pages.forEach(page => {
      const start = Date.now();
      const res = http.get(`${BASE_URL}${page}`);
      const duration = Date.now() - start;
      pageLoadTime.add(duration);
      
      const success = check(res, {
        [`${page} status is 200`]: (r) => r.status === 200,
        [`${page} loads under 3s`]: (r) => duration < 3000,
      });
      
      errorRate.add(!success);
      if (success) successCounter.add(1);
    });
  });

  group('API Tests', () => {
    // Products API
    const productsRes = http.get(`${API_URL}/products`);
    apiResponseTime.add(productsRes.timings.duration);
    
    check(productsRes, {
      'products API status is 200': (r) => r.status === 200,
      'products API response time < 200ms': (r) => r.timings.duration < 200,
    });

    // Search API
    const searchRes = http.get(`${API_URL}/products?search=laptop`);
    apiResponseTime.add(searchRes.timings.duration);
    
    check(searchRes, {
      'search API works': (r) => r.status === 200,
    });

    // Cart API
    const cartRes = http.get(`${API_URL}/cart`);
    check(cartRes, {
      'cart API works': (r) => r.status === 200,
    });
  });

  group('AI Agent MCP Endpoints', () => {
    const mcpPayload = JSON.stringify({
      jsonrpc: '2.0',
      method: 'tools/list',
      id: 1,
    });
    
    const mcpRes = http.post(`${API_URL}/mcp`, mcpPayload, {
      headers: { 'Content-Type': 'application/json' },
    });
    
    check(mcpRes, {
      'MCP endpoint accessible': (r) => r.status === 200,
      'MCP returns valid JSON-RPC': (r) => {
        try {
          const body = JSON.parse(r.body);
          return body.jsonrpc === '2.0';
        } catch {
          return false;
        }
      },
    });
  });

  sleep(1);
}
