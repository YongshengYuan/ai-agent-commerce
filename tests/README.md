# AI-Agent Commerce 测试套件

本项目为AI-Agent友好的跨境电商独立站提供完整的测试覆盖。

## 目录结构

```
tests/
├── config/                 # 测试配置文件
│   ├── jest.config.js     # Jest单元/集成测试配置
│   ├── playwright.config.ts # E2E测试配置
│   └── k6-load-test.js    # 性能测试配置
├── unit/                   # 单元测试
│   └── testcases/         # 各模块单元测试
├── integration/            # 集成测试
├── api/                    # API测试
│   └── testcases/         # REST API测试
├── e2e/                    # 端到端测试
│   ├── product-browsing.spec.ts
│   ├── shopping-cart.spec.ts
│   └── checkout.spec.ts
├── mcp/                    # MCP协议兼容性测试
│   └── testcases/
│       └── mcp.protocol.test.ts
├── agent/                  # AI Agent测试
│   └── testcases/
│       ├── agent.workflow.test.ts
│       └── ai-conversation.test.ts
├── performance/            # 性能测试
├── scripts/                # 测试脚本
│   ├── run-all-tests.sh   # 运行所有测试
│   ├── setup-test-env.sh  # 测试环境初始化
│   └── generate-fixtures.js # 生成测试数据
├── utils/                  # 测试工具
│   └── test-helpers.ts    # 测试辅助函数
├── types/                  # 测试类型定义
│   └── index.ts
├── fixtures/               # 测试数据
├── reports/                # 测试报告
└── coverage/               # 覆盖率报告
```

## 测试分类

### 1. 单元测试 (Unit Tests)
- **位置**: `tests/unit/`
- **工具**: Jest
- **覆盖**: 业务逻辑、服务层、工具函数
- **运行**: `npm run test:unit`

### 2. API测试 (API Tests)
- **位置**: `tests/api/`
- **工具**: Jest + Supertest
- **覆盖**: REST API端点
- **运行**: `npm run test:api`

### 3. 端到端测试 (E2E Tests)
- **位置**: `tests/e2e/`
- **工具**: Playwright
- **覆盖**: 完整用户流程
- **运行**: `npm run test:e2e`

### 4. MCP协议测试 (MCP Protocol Tests)
- **位置**: `tests/mcp/`
- **覆盖**: MCP协议合规性
- **运行**: `npm run test:agent`

### 5. AI Agent测试 (Agent Tests)
- **位置**: `tests/agent/`
- **覆盖**: AI Agent工作流、对话场景
- **运行**: `npm run test:agent`

### 6. 性能测试 (Performance Tests)
- **位置**: `tests/performance/`
- **工具**: k6
- **覆盖**: 负载测试、压力测试
- **运行**: `npm run test:performance`

## 快速开始

### 环境准备

```bash
# 1. 进入测试目录
cd tests

# 2. 安装依赖
npm install

# 3. 安装 Playwright 浏览器
npx playwright install

# 4. 安装 k6 (性能测试)
# macOS
brew install k6

# Linux
curl -s https://dl.k6.io/key.gpg | sudo apt-key add -
sudo apt-get update && sudo apt-get install k6
```

### 运行测试

```bash
# 运行所有测试
npm test

# 运行特定测试类型
npm run test:unit           # 单元测试
npm run test:api            # API测试
npm run test:agent          # Agent测试
npm run test:e2e            # E2E测试
npm run test:performance    # 性能测试

# 带覆盖率报告
npm run test:coverage

# 开发模式（监听文件变化）
npm run test:watch
```

### 运行测试脚本

```bash
# 运行所有测试并生成报告
bash scripts/run-all-tests.sh

# 跳过E2E测试
bash scripts/run-all-tests.sh --skip-e2e

# 跳过性能测试
bash scripts/run-all-tests.sh --skip-performance
```

## 测试用例清单

### 商品模块 (Product Module)
- [x] TC-PROD-001 ~ TC-PROD-010: 商品浏览
- [x] TC-SEARCH-001 ~ TC-SEARCH-005: 商品搜索
- [x] TC-VARIANT-001 ~ TC-VARIANT-002: 商品变体
- [x] TC-INV-001 ~ TC-INV-002: 库存管理

### 购物车模块 (Cart Module)
- [x] TC-CART-001 ~ TC-CART-012: 购物车功能
- [x] E2E-CART-001 ~ E2E-CART-010: 购物车E2E

### 订单模块 (Order Module)
- [x] TC-ORDER-001 ~ TC-ORDER-011: 订单管理
- [x] TC-PAY-001 ~ TC-PAY-003: 支付处理
- [x] E2E-CHECKOUT-001 ~ E2E-CHECKOUT-010: 结账流程

### MCP协议 (MCP Protocol)
- [x] TC-MCP-001 ~ TC-MCP-022: 协议合规性

### AI对话 (AI Conversations)
- [x] TC-CONV-001 ~ TC-CONV-018: 对话场景

## 测试数据

测试数据存储在 `tests/fixtures/` 目录：

```bash
# 生成测试数据
node scripts/generate-fixtures.js
```

这会生成：
- 50个测试商品
- 10个测试用户
- 20个测试订单

## 环境变量

创建 `.env.test` 文件：

```bash
NODE_ENV=test
API_BASE_URL=http://localhost:3001/api
MCP_BASE_URL=http://localhost:3001/api/mcp
DATABASE_URL=postgresql://localhost:5432/ai_commerce_test
REDIS_URL=redis://localhost:6379/1
JWT_SECRET=test-secret-key
```

## 测试报告

测试报告生成位置：

- **Jest报告**: `tests/reports/coverage/`
- **Playwright报告**: `tests/reports/playwright-report/`
- **性能报告**: `tests/reports/performance/`

查看报告：

```bash
# Jest覆盖率报告
open coverage/lcov-report/index.html

# Playwright报告
npx playwright show-report reports/playwright-report
```

## CI/CD集成

### GitHub Actions示例

```yaml
name: Test Suite
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 20
      - run: cd tests && npm ci
      - run: npm run test:ci
```

## 编写测试

### 单元测试示例

```typescript
import { describe, it, expect } from '@jest/globals';
import { ProductService } from '@/services/product.service';

describe('Product Module', () => {
  it('should return product by ID', async () => {
    const product = await ProductService.getById('prod-001');
    expect(product).toHaveProperty('id');
    expect(product?.name).toBeDefined();
  });
});
```

### API测试示例

```typescript
import request from 'supertest';

it('should return product list', async () => {
  const response = await request(API_URL)
    .get('/products')
    .expect(200);
  
  expect(response.body.data).toBeInstanceOf(Array);
});
```

### E2E测试示例

```typescript
import { test, expect } from '@playwright/test';

test('user can add item to cart', async ({ page }) => {
  await page.goto('/products/prod-001');
  await page.click('[data-testid="add-to-cart-button"]');
  await expect(page.locator('[data-testid="cart-count"]')).toHaveText('1');
});
```

### MCP协议测试示例

```typescript
it('should comply with JSON-RPC 2.0', async () => {
  const response = await request(MCP_URL)
    .post('/')
    .send({
      jsonrpc: '2.0',
      method: 'tools/list',
      id: 1,
    });
  
  expect(response.body.jsonrpc).toBe('2.0');
  expect(response.body).toHaveProperty('result');
});
```

## 文档

- [测试报告](../docs/test_report.md)
- [Bug跟踪](../docs/bugs.md)
- [MCP协议规范](https://modelcontextprotocol.io/)

## 维护

- 定期更新测试数据
- 保持测试用例与功能同步
- 监控测试覆盖率
- 及时修复失败的测试
