import type { FastifyInstance } from 'fastify';

export async function productRoutes(app: FastifyInstance) {
  const { prisma } = app;

  // 获取商品列表
  app.get('/', async (request, reply) => {
    const { query, category } = request.query as { query?: string; category?: string };
    
    try {
      let products;
      
      if (query) {
        // 搜索商品
        products = await prisma.product.findMany({
          where: {
            OR: [
              { name: { contains: query } },
              { description: { contains: query } },
              { aiDescription: { contains: query } }
            ],
            ...(category ? { category } : {})
          }
        });
      } else if (category) {
        products = await prisma.product.findMany({
          where: { category }
        });
      } else {
        products = await prisma.product.findMany();
      }
      
      return { products, total: products.length };
    } catch (error) {
      reply.status(500);
      return { error: 'Failed to fetch products', details: error.message };
    }
  });

  // 获取商品详情
  app.get('/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    
    try {
      const product = await prisma.product.findUnique({
        where: { id }
      });
      
      if (!product) {
        reply.status(404);
        return { error: '商品不存在' };
      }
      
      return { product };
    } catch (error) {
      reply.status(500);
      return { error: 'Failed to fetch product', details: error.message };
    }
  });

  // AI搜索（语义搜索）
  app.post('/search', async (request, reply) => {
    const { query, filters } = request.body as { 
      query: string; 
      filters?: { category?: string; priceRange?: [number, number] } 
    };
    
    try {
      const where: any = {
        OR: [
          { name: { contains: query } },
          { aiDescription: { contains: query } },
          { description: { contains: query } }
        ]
      };
      
      if (filters?.category) {
        where.category = filters.category;
      }
      
      if (filters?.priceRange) {
        where.price = {
          gte: filters.priceRange[0],
          lte: filters.priceRange[1]
        };
      }
      
      const products = await prisma.product.findMany({ where });
      
      return { 
        products, 
        total: products.length,
        query,
        aiRecommendation: products.length > 0 
          ? `为您找到${products.length}款符合"${query}"的商品` 
          : '未找到相关商品，试试其他关键词'
      };
    } catch (error) {
      reply.status(500);
      return { error: 'Search failed', details: error.message };
    }
  });
}
