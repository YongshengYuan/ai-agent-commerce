import type { FastifyInstance } from 'fastify';

// Mock订单 - 实际使用数据库
const orders: any[] = [];

export async function orderRoutes(app: FastifyInstance) {
  // 创建订单
  app.post('/', async (request, reply) => {
    const sessionId = request.headers['session-id'] as string || 'default';
    const { items, shippingAddress, paymentMethod } = request.body as {
      items: Array<{ productId: string; quantity: number; price: number }>;
      shippingAddress: {
        name: string;
        address: string;
        city: string;
        country: string;
        postalCode: string;
      };
      paymentMethod: 'stripe' | 'paypal';
    };
    
    const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    const order = {
      id: `ORD-${Date.now()}`,
      sessionId,
      items,
      shippingAddress,
      paymentMethod,
      total,
      currency: 'USD',
      status: 'pending',
      paymentStatus: 'pending',
      createdAt: new Date().toISOString()
    };
    
    orders.push(order);
    
    return { 
      success: true, 
      order: {
        id: order.id,
        total: order.total,
        status: order.status,
        paymentUrl: paymentMethod === 'stripe' 
          ? `/api/orders/${order.id}/pay`
          : null
      }
    };
  });

  // 获取订单列表
  app.get('/', async (request, reply) => {
    const sessionId = request.headers['session-id'] as string || 'default';
    const userOrders = orders.filter(o => o.sessionId === sessionId);
    return { orders: userOrders };
  });

  // 获取订单详情
  app.get('/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const order = orders.find(o => o.id === id);
    
    if (!order) {
      reply.status(404);
      return { error: '订单不存在' };
    }
    
    return { order };
  });

  // 支付订单 (Stripe模拟)
  app.post('/:id/pay', async (request, reply) => {
    const { id } = request.params as { id: string };
    const order = orders.find(o => o.id === id);
    
    if (!order) {
      reply.status(404);
      return { error: '订单不存在' };
    }
    
    // 模拟Stripe支付
    order.paymentStatus = 'completed';
    order.status = 'processing';
    
    return { 
      success: true, 
      message: '支付成功',
      order: {
        id: order.id,
        status: order.status,
        paymentStatus: order.paymentStatus
      }
    };
  });

  // 取消订单
  app.post('/:id/cancel', async (request, reply) => {
    const { id } = request.params as { id: string };
    const order = orders.find(o => o.id === id);
    
    if (!order) {
      reply.status(404);
      return { error: '订单不存在' };
    }
    
    if (order.status !== 'pending') {
      reply.status(400);
      return { error: '订单状态不允许取消' };
    }
    
    order.status = 'cancelled';
    
    return { success: true, order };
  });
}
