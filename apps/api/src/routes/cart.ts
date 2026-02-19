import type { FastifyInstance } from 'fastify';

// Mock购物车 - 实际使用Redis/Database
const carts: Record<string, any> = {};

export async function cartRoutes(app: FastifyInstance) {
  // 获取购物车
  app.get('/', async (request, reply) => {
    const sessionId = request.headers['session-id'] as string || 'default';
    const cart = carts[sessionId] || { items: [], total: 0 };
    return { cart };
  });

  // 添加商品到购物车
  app.post('/items', async (request, reply) => {
    const sessionId = request.headers['session-id'] as string || 'default';
    const { productId, quantity, variant } = request.body as { 
      productId: string; 
      quantity: number; 
      variant?: Record<string, string> 
    };
    
    if (!carts[sessionId]) {
      carts[sessionId] = { items: [], total: 0 };
    }
    
    const existingItem = carts[sessionId].items.find(
      (i: any) => i.productId === productId && JSON.stringify(i.variant) === JSON.stringify(variant)
    );
    
    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      carts[sessionId].items.push({
        id: Math.random().toString(36).substr(2, 9),
        productId,
        quantity,
        variant,
        addedAt: new Date().toISOString()
      });
    }
    
    // 重新计算总价
    carts[sessionId].total = carts[sessionId].items.reduce((sum: number, item: any) => {
      // 简化计算 - 实际查询商品价格
      return sum + (item.quantity * 100); // 假设价格100
    }, 0);
    
    return { success: true, cart: carts[sessionId] };
  });

  // 更新购物车商品数量
  app.put('/items/:itemId', async (request, reply) => {
    const sessionId = request.headers['session-id'] as string || 'default';
    const { itemId } = request.params as { itemId: string };
    const { quantity } = request.body as { quantity: number };
    
    if (!carts[sessionId]) {
      reply.status(404);
      return { error: '购物车不存在' };
    }
    
    const item = carts[sessionId].items.find((i: any) => i.id === itemId);
    if (!item) {
      reply.status(404);
      return { error: '商品不存在' };
    }
    
    if (quantity <= 0) {
      carts[sessionId].items = carts[sessionId].items.filter((i: any) => i.id !== itemId);
    } else {
      item.quantity = quantity;
    }
    
    return { success: true, cart: carts[sessionId] };
  });

  // 删除购物车商品
  app.delete('/items/:itemId', async (request, reply) => {
    const sessionId = request.headers['session-id'] as string || 'default';
    const { itemId } = request.params as { itemId: string };
    
    if (!carts[sessionId]) {
      reply.status(404);
      return { error: '购物车不存在' };
    }
    
    carts[sessionId].items = carts[sessionId].items.filter((i: any) => i.id !== itemId);
    
    return { success: true, cart: carts[sessionId] };
  });

  // 清空购物车
  app.delete('/', async (request, reply) => {
    const sessionId = request.headers['session-id'] as string || 'default';
    carts[sessionId] = { items: [], total: 0 };
    return { success: true, cart: carts[sessionId] };
  });
}
