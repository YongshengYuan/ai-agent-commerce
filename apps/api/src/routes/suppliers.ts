import type { FastifyInstance } from 'fastify';

// 供应商管理
const suppliers = [
  { id: 'spocket', name: 'Spocket', status: 'active', products: 100 },
  { id: 'aliexpress', name: 'AliExpress', status: 'active', products: 500 }
];

export async function supplierRoutes(app: FastifyInstance) {
  // 获取供应商列表
  app.get('/', async () => ({
    suppliers
  }));

  // 获取供应商详情
  app.get('/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const supplier = suppliers.find(s => s.id === id);
    
    if (!supplier) {
      reply.status(404);
      return { error: '供应商不存在' };
    }
    
    return { supplier };
  });

  // 同步供应商库存
  app.post('/:id/sync', async (request, reply) => {
    const { id } = request.params as { id: string };
    const supplier = suppliers.find(s => s.id === id);
    
    if (!supplier) {
      reply.status(404);
      return { error: '供应商不存在' };
    }
    
    // 模拟库存同步
    return {
      success: true,
      message: `已开始同步 ${supplier.name} 的库存`,
      syncId: `SYNC-${Date.now()}`,
      estimatedTime: '2-5分钟'
    };
  });

  // 获取同步状态
  app.get('/sync/:syncId', async (request, reply) => {
    const { syncId } = request.params as { syncId: string };
    
    // 模拟同步状态
    return {
      syncId,
      status: 'completed',
      progress: 100,
      updated: 50,
      failed: 0,
      completedAt: new Date().toISOString()
    };
  });
}
