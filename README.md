# 🤖 AI-Agent友好型跨境电商独立站

**项目名称**: AI-Agent Commerce  
**版本**: 1.0.0  
**部署日期**: 2026-02-20

---

## 🚀 快速启动

### 1. 安装依赖
```bash
cd /Users/loky/openclaw/workspace/projects/ai-agent-commerce
pnpm install
```

### 2. 配置环境变量
```bash
cp .env.example .env
# 编辑 .env 配置你的API密钥
```

### 3. 启动开发服务器
```bash
# 启动后端API
pnpm --filter=@ai-commerce/api run dev

# 启动前端（新终端）
pnpm --filter=@ai-commerce/web run dev
```

### 4. 访问应用
- 前端: http://localhost:3000
- API文档: http://localhost:3001/docs
- MCP端点: http://localhost:3001/api/mcp

---

## 📁 项目结构

```
ai-agent-commerce/
├── apps/
│   ├── api/              # Fastify后端API
│   │   ├── src/routes/   # API路由
│   │   ├── src/services/ # 业务逻辑
│   │   └── src/adapters/ # 供应商适配器
│   └── web/              # Next.js前端
├── packages/
│   ├── database/         # Prisma数据库
│   └── mcp-protocol/     # MCP协议共享
├── infrastructure/       # K8s部署配置
├── tests/                # 测试套件
└── docs/                 # 文档
```

---

## 🔌 MCP协议 (AI-Agent接口)

AI-Agent可以通过MCP协议与本站交互：

### 可用Tools
- `searchProducts` - 搜索商品
- `getProductDetails` - 获取商品详情
- `addToCart` - 添加到购物车
- `getCart` - 获取购物车
- `createOrder` - 创建订单
- `checkout` - 结账支付

### 示例调用
```json
POST /api/mcp
{
  "tool": "searchProducts",
  "params": {
    "query": "智能手表",
    "filters": { "priceRange": [100, 500] }
  }
}
```

---

## 📊 API端点

| 端点 | 描述 |
|------|------|
| GET /api/products | 获取商品列表 |
| GET /api/products/:id | 获取商品详情 |
| POST /api/products/search | AI搜索商品 |
| GET /api/cart | 获取购物车 |
| POST /api/cart/items | 添加商品到购物车 |
| POST /api/orders | 创建订单 |
| POST /api/orders/:id/pay | 支付订单 |
| GET /api/mcp | MCP协议信息 |
| POST /api/mcp | MCP工具调用 |

---

## 🛠️ 技术栈

- **后端**: Fastify + TypeScript
- **前端**: Next.js 14 + React
- **数据库**: PostgreSQL + Prisma (待连接)
- **AI**: MCP协议支持
- **支付**: Stripe (测试模式)
- **部署**: Docker + K8s (配置就绪)

---

## ⚠️ 注意事项

1. **当前状态**: MVP版本，使用Mock数据
2. **支付**: 使用Stripe测试模式，不会真实扣款
3. **供应商**: 已配置Spocket和AliExpress适配器框架，需配置API密钥
4. **数据库**: 当前使用内存存储，生产环境需连接PostgreSQL

---

## 📝 下一步

- [ ] 连接PostgreSQL数据库
- [ ] 配置供应商API密钥
- [ ] 完善前端UI
- [ ] 生产环境部署

---

**创建**: CEO / AI团队  
**日期**: 2026-02-20
