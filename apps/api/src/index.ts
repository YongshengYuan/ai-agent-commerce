import Fastify from 'fastify';
import cors from '@fastify/cors';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import { PrismaClient } from '@ai-commerce/database';
import { productRoutes } from './routes/products.js';
import { cartRoutes } from './routes/cart.js';
import { orderRoutes } from './routes/orders.js';
import { mcpRoutes } from './routes/mcp.js';
import { supplierRoutes } from './routes/suppliers.js';

const app = Fastify({
  logger: true
});

// 数据库连接
const prisma = new PrismaClient();

// 装饰器：让路由可以访问prisma
app.decorate('prisma', prisma);

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

// Health check - 包含数据库状态
app.get('/health', async () => {
  try {
    // 测试数据库连接
    await prisma.$queryRaw`SELECT 1`;
    return { 
      status: 'ok', 
      version: '1.0.0',
      database: 'connected'
    };
  } catch (error) {
    return { 
      status: 'degraded', 
      version: '1.0.0',
      database: 'disconnected',
      error: 'Database connection failed'
    };
  }
});

// Routes
await app.register(productRoutes, { prefix: '/api/products' });
await app.register(cartRoutes, { prefix: '/api/cart' });
await app.register(orderRoutes, { prefix: '/api/orders' });
await app.register(mcpRoutes, { prefix: '/api/mcp' });
await app.register(supplierRoutes, { prefix: '/api/suppliers' });

// 优雅关闭
app.addHook('onClose', async () => {
  await prisma.$disconnect();
});

// Start server
const start = async () => {
  try {
    // 测试数据库连接
    await prisma.$connect();
    app.log.info('Database connected successfully');
    
    await app.listen({ port: 3001, host: '0.0.0.0' });
    app.log.info('Server running at http://localhost:3001');
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start();
