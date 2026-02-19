import type { FastifyInstance } from 'fastify';

export async function orderRoutes(app: FastifyInstance) {
  const { prisma } = app;

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
    
    try {
      const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      
      const order = await prisma.order.create({
        data: {
          sessionId,
          items,
          shippingAddress,
          paymentMethod,
          total,
          currency: 'USD',
          status: 'pending',
          paymentStatus: 'pending'
        }
      });
      
      // 清空购物车
      await prisma.cart.delete({
        where: { sessionId }
      }).catch(() => {
        // 购物车可能不存在，忽略错误
      });
      
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
    } catch (error) {
      reply.status(500);
      return { error: 'Failed to create order', details: error.message };
    }
  });

  // 获取订单列表
  app.get('/', async (request, reply) => {
    const sessionId = request.headers['session-id'] as string || 'default';
    
    try {
      const orders = await prisma.order.findMany({
        where: { sessionId },
        orderBy: { createdAt: 'desc' }
      });
      
      return { orders };
    } catch (error) {
      reply.status(500);
      return { error: 'Failed to fetch orders', details: error.message };
    }
  });

  // 获取订单详情
  app.get('/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    
    try {
      const order = await prisma.order.findUnique({
        where: { id }
      });
      
      if (!order) {
        reply.status(404);
        return { error: '订单不存在' };
      }
      
      return { order };
    } catch (error) {
      reply.status(500);
      return { error: 'Failed to fetch order', details: error.message };
    }
  });

  // 支付订单 (Stripe模拟)
  app.post('/:id/pay', async (request, reply) => {
    const { id } = request.params as { id: string };
    
    try {
      const order = await prisma.order.findUnique({
        where: { id }
      });
      
      if (!order) {
        reply.status(404);
        return { error: '订单不存在' };
      }
      
      // 模拟Stripe支付成功
      const updatedOrder = await prisma.order.update({
        where: { id },
        data: {
          paymentStatus: 'completed',
          status: 'processing',
          stripePaymentIntentId: `pi_${Date.now()}`
        }
      });
      
      return { 
        success: true, 
        message: '支付成功',
        order: {
          id: updatedOrder.id,
          status: updatedOrder.status,
          paymentStatus: updatedOrder.paymentStatus
        }
      };
    } catch (error) {
      reply.status(500);
      return { error: 'Payment failed', details: error.message };
    }
  });

  // 取消订单
  app.post('/:id/cancel', async (request, reply) => {
    const { id } = request.params as { id: string };
    
    try {
      const order = await prisma.order.findUnique({
        where: { id }
      });
      
      if (!order) {
        reply.status(404);
        return { error: '订单不存在' };
      }
      
      if (order.status !== 'pending') {
        reply.status(400);
        return { error: '订单状态不允许取消' };
      }
      
      const updatedOrder = await prisma.order.update({
        where: { id },
        data: { status: 'cancelled' }
      });
      
      return { success: true, order: updatedOrder };
    } catch (error) {
      reply.status(500);
      return { error: 'Failed to cancel order', details: error.message };
    }
  });
}
