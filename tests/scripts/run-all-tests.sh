#!/bin/bash

# AI-Agent Commerce 全量测试脚本
# 用法: ./run-all-tests.sh [选项]

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 默认配置
SKIP_E2E=false
SKIP_PERFORMANCE=false
SKIP_AGENT=false
REPORT_DIR="../reports"

# 解析参数
while [[ $# -gt 0 ]]; do
  case $1 in
    --skip-e2e)
      SKIP_E2E=true
      shift
      ;;
    --skip-performance)
      SKIP_PERFORMANCE=true
      shift
      ;;
    --skip-agent)
      SKIP_AGENT=true
      shift
      ;;
    --help)
      echo "用法: ./run-all-tests.sh [选项]"
      echo ""
      echo "选项:"
      echo "  --skip-e2e           跳过E2E测试"
      echo "  --skip-performance   跳过性能测试"
      echo "  --skip-agent         跳过Agent测试"
      echo "  --help               显示帮助"
      exit 0
      ;;
    *)
      echo "未知选项: $1"
      exit 1
      ;;
  esac
done

# 创建报告目录
mkdir -p $REPORT_DIR

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  AI-Agent Commerce 测试套件${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# 检查环境
echo -e "${YELLOW}▶ 检查测试环境...${NC}"
if ! command -v node &> /dev/null; then
    echo -e "${RED}✗ Node.js 未安装${NC}"
    exit 1
fi

if ! command -v npm &> /dev/null; then
    echo -e "${RED}✗ npm 未安装${NC}"
    exit 1
fi

echo -e "${GREEN}✓ 环境检查通过${NC}"
echo ""

# 安装依赖
echo -e "${YELLOW}▶ 安装依赖...${NC}"
npm install --silent
echo -e "${GREEN}✓ 依赖安装完成${NC}"
echo ""

# 运行单元测试
echo -e "${YELLOW}▶ 运行单元测试...${NC}"
npm run test:unit 2>&1 | tee $REPORT_DIR/unit-test-results.log
UNIT_EXIT=${PIPESTATUS[0]}
if [ $UNIT_EXIT -eq 0 ]; then
    echo -e "${GREEN}✓ 单元测试通过${NC}"
else
    echo -e "${RED}✗ 单元测试失败${NC}"
fi
echo ""

# 运行API测试
echo -e "${YELLOW}▶ 运行API测试...${NC}"
npm run test:api 2>&1 | tee $REPORT_DIR/api-test-results.log
API_EXIT=${PIPESTATUS[0]}
if [ $API_EXIT -eq 0 ]; then
    echo -e "${GREEN}✓ API测试通过${NC}"
else
    echo -e "${RED}✗ API测试失败${NC}"
fi
echo ""

# 运行Agent测试
if [ "$SKIP_AGENT" = false ]; then
    echo -e "${YELLOW}▶ 运行Agent测试...${NC}"
    npm run test:agent 2>&1 | tee $REPORT_DIR/agent-test-results.log
    AGENT_EXIT=${PIPESTATUS[0]}
    if [ $AGENT_EXIT -eq 0 ]; then
        echo -e "${GREEN}✓ Agent测试通过${NC}"
    else
        echo -e "${RED}✗ Agent测试失败${NC}"
    fi
    echo ""
else
    echo -e "${YELLOW}▶ 跳过Agent测试${NC}"
    AGENT_EXIT=0
fi

# 运行E2E测试
if [ "$SKIP_E2E" = false ]; then
    echo -e "${YELLOW}▶ 运行E2E测试...${NC}"
    npm run test:e2e 2>&1 | tee $REPORT_DIR/e2e-test-results.log
    E2E_EXIT=${PIPESTATUS[0]}
    if [ $E2E_EXIT -eq 0 ]; then
        echo -e "${GREEN}✓ E2E测试通过${NC}"
    else
        echo -e "${RED}✗ E2E测试失败${NC}"
    fi
    echo ""
else
    echo -e "${YELLOW}▶ 跳过E2E测试${NC}"
    E2E_EXIT=0
fi

# 运行性能测试
if [ "$SKIP_PERFORMANCE" = false ]; then
    if command -v k6 &> /dev/null; then
        echo -e "${YELLOW}▶ 运行性能测试...${NC}"
        k6 run --summary-export=$REPORT_DIR/performance-summary.json \
               config/k6-load-test.js 2>&1 | tee $REPORT_DIR/performance-test-results.log
        PERF_EXIT=${PIPESTATUS[0]}
        if [ $PERF_EXIT -eq 0 ]; then
            echo -e "${GREEN}✓ 性能测试通过${NC}"
        else
            echo -e "${RED}✗ 性能测试失败${NC}"
        fi
    else
        echo -e "${YELLOW}⚠ k6 未安装，跳过性能测试${NC}"
        echo "  安装命令: brew install k6 (macOS)"
        PERF_EXIT=0
    fi
    echo ""
else
    echo -e "${YELLOW}▶ 跳过性能测试${NC}"
    PERF_EXIT=0
fi

# 生成覆盖率报告
echo -e "${YELLOW}▶ 生成覆盖率报告...${NC}"
npm run test:coverage 2>&1 | tee $REPORT_DIR/coverage-results.log
echo -e "${GREEN}✓ 覆盖率报告生成完成${NC}"
echo ""

# 汇总结果
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  测试结果汇总${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

if [ $UNIT_EXIT -eq 0 ]; then
    echo -e "单元测试:    ${GREEN}通过${NC}"
    ((PASSED_TESTS++))
else
    echo -e "单元测试:    ${RED}失败${NC}"
    ((FAILED_TESTS++))
fi
((TOTAL_TESTS++))

if [ $API_EXIT -eq 0 ]; then
    echo -e "API测试:     ${GREEN}通过${NC}"
    ((PASSED_TESTS++))
else
    echo -e "API测试:     ${RED}失败${NC}"
    ((FAILED_TESTS++))
fi
((TOTAL_TESTS++))

if [ "$SKIP_AGENT" = false ]; then
    if [ $AGENT_EXIT -eq 0 ]; then
        echo -e "Agent测试:   ${GREEN}通过${NC}"
        ((PASSED_TESTS++))
    else
        echo -e "Agent测试:   ${RED}失败${NC}"
        ((FAILED_TESTS++))
    fi
    ((TOTAL_TESTS++))
fi

if [ "$SKIP_E2E" = false ]; then
    if [ $E2E_EXIT -eq 0 ]; then
        echo -e "E2E测试:     ${GREEN}通过${NC}"
        ((PASSED_TESTS++))
    else
        echo -e "E2E测试:     ${RED}失败${NC}"
        ((FAILED_TESTS++))
    fi
    ((TOTAL_TESTS++))
fi

if [ "$SKIP_PERFORMANCE" = false ]; then
    if [ $PERF_EXIT -eq 0 ]; then
        echo -e "性能测试:    ${GREEN}通过${NC}"
        ((PASSED_TESTS++))
    else
        echo -e "性能测试:    ${RED}失败${NC}"
        ((FAILED_TESTS++))
    fi
    ((TOTAL_TESTS++))
fi

echo ""
echo -e "总计: ${PASSED_TESTS} 通过, ${FAILED_TESTS} 失败, ${TOTAL_TESTS} 测试"
echo ""

# 生成测试报告
echo -e "${YELLOW}▶ 生成测试报告...${NC}"
cat > $REPORT_DIR/test-summary-$(date +%Y%m%d-%H%M%S).md << REPORT
# 测试执行摘要

**执行时间**: $(date '+%Y-%m-%d %H:%M:%S')
**测试环境**: $(node --version), $(npm --version)

## 结果汇总

| 测试类型 | 结果 |
|----------|------|
| 单元测试 | $(if [ $UNIT_EXIT -eq 0 ]; then echo "✅ 通过"; else echo "❌ 失败"; fi) |
| API测试 | $(if [ $API_EXIT -eq 0 ]; then echo "✅ 通过"; else echo "❌ 失败"; fi) |
$(if [ "$SKIP_AGENT" = false ]; then echo "| Agent测试 | $(if [ $AGENT_EXIT -eq 0 ]; then echo "✅ 通过"; else echo "❌ 失败"; fi) |"; fi)
$(if [ "$SKIP_E2E" = false ]; then echo "| E2E测试 | $(if [ $E2E_EXIT -eq 0 ]; then echo "✅ 通过"; else echo "❌ 失败"; fi) |"; fi)
$(if [ "$SKIP_PERFORMANCE" = false ]; then echo "| 性能测试 | $(if [ $PERF_EXIT -eq 0 ]; then echo "✅ 通过"; else echo "❌ 失败"; fi) |"; fi)

## 详细日志

- 单元测试日志: unit-test-results.log
- API测试日志: api-test-results.log
$(if [ "$SKIP_AGENT" = false ]; then echo "- Agent测试日志: agent-test-results.log"; fi)
$(if [ "$SKIP_E2E" = false ]; then echo "- E2E测试日志: e2e-test-results.log"; fi)
$(if [ "$SKIP_PERFORMANCE" = false ]; then echo "- 性能测试日志: performance-test-results.log"; fi)
- 覆盖率报告: coverage/lcov-report/index.html
REPORT

echo -e "${GREEN}✓ 测试报告已生成: $REPORT_DIR/${NC}"
echo ""

# 返回总体结果
if [ $FAILED_TESTS -eq 0 ]; then
    echo -e "${GREEN}🎉 所有测试通过!${NC}"
    exit 0
else
    echo -e "${RED}⚠️  部分测试失败，请查看日志${NC}"
    exit 1
fi
