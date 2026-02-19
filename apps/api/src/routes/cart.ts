import type { FastifyInstance } from 'fastify';

export async function cartRoutes(app: FastifyInstance) {
  const { prisma } = app;

  // 获取购物车
  app.get('/', async (request, reply) => {
    const sessionId = request.headers['session-id'] as string || 'default';
    
    try {
      const cart = await prisma.cart.findUnique({
        where: { sessionId }
      });
      
      return { cart: cart || { items: [], total: 0 } };
    } catch (error) {
      reply.status(500);
      return { error: 'Failed to fetch cart', details: error.message };
    }
  });

  // 添加商品到购物车
  app.post('/items', async (request, reply) => {
    const sessionId = request.headers['session-id'] as string || 'default';
    const { productId, quantity, variant } = request.body as { 
      productId: string; 
      quantity: number; 
      variant?: Record<string, string> 
    };
    
    try {
      // 获取商品信息
      const product = await prisma.product.findUnique({
        where: { id: productId }
      });
      
      if (!product) {
        reply.status(404);
        return { error: '商品不存在' };
      }
      
      // 获取或创建购物车
      let cart = await prisma.cart.findUnique({
        where: { sessionId }
      });
      
      let items = cart?.items || [];
      
      // 检查是否已存在相同商品
      const existingItem = items.find(
        (i: any) => i.productId === productId && JSON.stringify(i.variant) === JSON.stringify(variant)
      );
      
      if (existingItem) {
        existingItem.quantity += quantity;
      } else {
        items.push({
          id: Math.random().toString(36).substr(2, 9),
          productId,
          name: product.name,
          price: product.price,
          quantity,
          variant,
          addedAt: new Date().toISOString()
        });
      }
      
      // 计算总价
      const total = items.reduce((sum: number, item: any) => {
        return sum + (item.quantity * parseFloat(item.price));
      }, 0);
      
      // 更新或创建购物车
      cart = await prisma.cart.upsert({
        where: { sessionId },
        update: { items, total },
        create: { sessionId, items, total }
      });
      
      return { success: true, cart };
    } catch (error) {
      reply.status(500);
      return { error: 'Failed to add item', details: error.message };
    }
  });

  // 更新购物车商品数量
  app.put('/items/:itemId', async (request, reply) => {
    const sessionId = request.headers['session-id'] as string || 'default';
    const { itemId } = request.params as { itemId: string };
    const { quantity } = request.body as { quantity: number };
    
    try {
      const cart = await prisma.cart.findUnique({
        where: { sessionId }
      });
      
      if (!cart) {
        reply.status(404);
        return { error: '购物车不存在' };
      }
      
      let items = cart.items as any[];
      
      if (quantity <= 0) {
        items = items.filter((i: any) => i.id !== itemId);
      } else {
        const item = items.find((i: any) => i.id === itemId);
        if (!item) {
          reply.status(404);
          return { error: '商品不存在' };
        }
        item.quantity = quantity;
      }
      
      // 重新计算总价
      const total = items.reduce((sum: number, item: any) => {
        return sum + (item.quantity * parseFloat(item.price));
      }, 0);
      
      const updatedCart = await prisma.cart.update({
        where: { sessionId },
        data: { items, total }
      });
      
      return { success: true, cart: updatedCart };
    } catch (error) {
      reply.status(500);
      return { error: 'Failed to update item', details: error.message };
    }
  });

  // 删除购物车商品
  app.delete('/items/:itemId', async (request, reply) => {
    const sessionId = request.headers['session-id'] as string || 'default';
    const { itemId } = request.params as { itemId: string };
    
    try {
      const cart = await prisma.cart.findUnique({
        where: { sessionId }
      });
      
      if (!cart) {
        reply.status(404);
        return { error: '购物车不存在' };
      }
      
      let items = (cart.items as any[]).filter((i: any) => i.id !== itemId);
      
      // 重新计算总价
      const total = items.reduce((sum: number, item: any) => {
        return sum + (item.quantity * parseFloat(item.price));
      }, 0);
      
      const updatedCart = await prisma.cart.update({
        where: { sessionId },
        data: { items, total }
      });
      
      return { success: true, cart: updatedCart };
    } catch (error) {
      reply.status(500);
      return { error: 'Failed to remove item', details: error.message };
    }
  });

  // 清空购物车
  app.delete('/', async (request, reply) => {
    const sessionId = request.headers['session-id'] as string || 'default';
    
    try {
      await prisma.cart.delete({
        where: { sessionId }
      });
      
      return { success: true, cart: { items: [], total: 0 } };
    } catch (error) {
      reply.status(500);
      return { error: 'Failed to clear cart', details: error.message };
    }
  });
}
