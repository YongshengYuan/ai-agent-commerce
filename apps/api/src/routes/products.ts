import type { FastifyInstance } from 'fastify';

// Mock database - 实际使用Prisma
const products = [
  {
    id: '1',
    name: '智能手表 Pro',
    description: '支持AI语音助手的智能手表',
    price: 299.99,
    currency: 'USD',
    category: '电子产品',
    image: 'https://example.com/watch.jpg',
    stock: 100,
    supplier: 'spocket',
    aiDescription: '高端智能手表，支持健康监测和语音控制',
    attributes: { color: ['黑', '白'], size: ['42mm', '46mm'] }
  },
  {
    id: '2',
    name: '无线耳机 Max',
    description: '降噪无线耳机，AI音质优化',
    price: 199.99,
    currency: 'USD',
    category: '电子产品',
    image: 'https://example.com/earbuds.jpg',
    stock: 50,
    supplier: 'aliexpress',
    aiDescription: '顶级降噪无线耳机，AI自适应音质',
    attributes: { color: ['黑', '白', '蓝'] }
  }
];

export async function productRoutes(app: FastifyInstance) {
  // 获取商品列表
  app.get('/', async (request, reply) => {
    const { query, category } = request.query as { query?: string; category?: string };
    
    let result = products;
    
    if (query) {
      const q = query.toLowerCase();
      result = result.filter(p =
> 
        p.name.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.aiDescription?.toLowerCase().includes(q)
      );
    }
    
    if (category) {
      result = result.filter(p => p.category === category);
    }
    
    return { products: result, total: result.length };
  });

  // 获取商品详情
  app.get('/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const product = products.find(p => p.id === id);
    
    if (!product) {
      reply.status(404);
      return { error: '商品不存在' };
    }
    
    return { product };
  });

  // AI搜索（语义搜索）
  app.post('/search', async (request, reply) => {
    const { query, filters } = request.body as { 
      query: string; 
      filters?: { category?: string; priceRange?: [number, number] } 
    };
    
    // 简化版AI搜索 - 实际使用向量数据库
    const q = query.toLowerCase();
    let result = products.filter(p => 
      p.name.toLowerCase().includes(q) ||
      p.aiDescription?.toLowerCase().includes(q) ||
      p.description.toLowerCase().includes(q)
    );
    
    if (filters?.category) {
      result = result.filter(p => p.category === filters.category);
    }
    
    if (filters?.priceRange) {
      result = result.filter(p => 
        p.price >= filters.priceRange[0] && p.price <= filters.priceRange[1]
      );
    }
    
    return { 
      products: result, 
      total: result.length,
      query,
      aiRecommendation: result.length > 0 
        ? `为您找到${result.length}款符合"${query}"的商品` 
        : '未找到相关商品，试试其他关键词'
    };
  });
}
