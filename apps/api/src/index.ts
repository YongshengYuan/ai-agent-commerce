import Fastify from 'fastify';
import cors from '@fastify/cors';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import { productRoutes } from './routes/products.js';
import { cartRoutes } from './routes/cart.js';
import { orderRoutes } from './routes/orders.js';
import { mcpRoutes } from './routes/mcp.js';
import { supplierRoutes } from './routes/suppliers.js';

const app = Fastify({
  logger: true
});

// CORS
await app.register(cors, {
  origin: true,
  credentials: true
});

// Swagger
await app.register(swagger, {
  openapi: {
    info: {
      title: 'AI-Agent Commerce API',
      description: 'AI-Agent友好的跨境电商API',
      version: '1.0.0'
    },
    servers: [{ url: 'http://localhost:3001' }]
  }
});

await app.register(swaggerUi, {
  routePrefix: '/docs'
});

// Health check
app.get('/health', async () => ({ status: 'ok', version: '1.0.0' }));

// Routes
await app.register(productRoutes, { prefix: '/api/products' });
await app.register(cartRoutes, { prefix: '/api/cart' });
await app.register(orderRoutes, { prefix: '/api/orders' });
await app.register(mcpRoutes, { prefix: '/api/mcp' });
await app.register(supplierRoutes, { prefix: '/api/suppliers' });

// Start server
const start = async () => {
  try {
    await app.listen({ port: 3001, host: '0.0.0.0' });
    app.log.info('Server running at http://localhost:3001');
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start();
