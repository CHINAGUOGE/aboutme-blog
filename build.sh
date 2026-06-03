#!/bin/bash
set -euo pipefail

# ============================================================
# build.sh — 果鸽博客构建脚本
#
# 执行顺序：
#   1. 依赖安装（CI 环境）
#   2. 配置校验
#   3. 色彩提取（生成 theme.css）
#   4. 图片资产优化
#   5. Astro 静态站点构建
#   6. Pagefind 全文索引
#   7. 构建产物验证
#
# 用法：
#   bash build.sh            # 本地构建
#   bash build.sh --ci       # CI 模式（更严格）
# ============================================================

CI_MODE=false
START_TIME=$(date +%s)

# 解析参数
for arg in "$@"; do
  case $arg in
    --ci) CI_MODE=true ;;
  esac
done

echo ""
echo "🐦 果鸽博客 — 构建流程启动"
echo "  模式: $([ "$CI_MODE" = true ] && echo 'CI' || echo 'Local')"
echo "  时间: $(date '+%Y-%m-%d %H:%M:%S')"
echo "================================"
echo ""

# ============================================================
# Step 1: 依赖安装
# ============================================================
echo "📦 Step 1/7: 安装依赖..."
if [ "$CI_MODE" = true ]; then
  pnpm install --frozen-lockfile
else
  pnpm install
fi
echo "   ✅ 依赖安装完成"
echo ""

# ============================================================
# Step 2: 配置校验
# ============================================================
echo "🔍 Step 2/7: 校验配置..."
if pnpm validate-config; then
  echo "   ✅ 配置校验通过"
else
  if [ "$CI_MODE" = true ]; then
    echo "   ❌ 配置校验失败（CI 模式）"
    exit 1
  fi
  echo "   ⚠️ 配置校验失败，继续构建"
fi
echo ""

# ============================================================
# Step 3: 色彩提取
# ============================================================
echo "🎨 Step 3/7: 提取主题色..."
if pnpm tsx scripts/color-extract.ts; then
  echo "   ✅ 主题色提取完成"
else
  echo "   ⚠️ 色彩提取失败，使用默认主题"
fi
echo ""

# ============================================================
# Step 4: 图片资产优化
# ============================================================
echo "🖼️  Step 4/7: 优化图片资产..."
if pnpm tsx scripts/optimize-assets.mjs; then
  echo "   ✅ 图片优化完成"
else
  echo "   ⏭️  图片优化跳过（源文件不存在）"
fi
echo ""

# ============================================================
# Step 5: Astro 构建
# ============================================================
echo "🔨 Step 5/7: 构建静态站点..."
pnpm astro build
BUILD_EXIT=$?

if [ $BUILD_EXIT -ne 0 ]; then
  echo "   ❌ Astro 构建失败 (exit code: $BUILD_EXIT)"
  exit $BUILD_EXIT
fi

# 统计构建产物
HTML_COUNT=$(find dist -name "*.html" 2>/dev/null | wc -l)
JS_COUNT=$(find dist -name "*.js" 2>/dev/null | wc -l)
CSS_COUNT=$(find dist -name "*.css" 2>/dev/null | wc -l)
DIST_SIZE=$(du -sh dist 2>/dev/null | cut -f1)

echo "   ✅ 构建完成: ${HTML_COUNT} HTML, ${JS_COUNT} JS, ${CSS_COUNT} CSS"
echo "   📦 产物大小: ${DIST_SIZE}"
echo ""

# ============================================================
# Step 6: Pagefind 索引
# ============================================================
echo "🔍 Step 6/7: 生成搜索索引..."
if npx pagefind --site dist 2>/dev/null; then
  PAGEFIND_SIZE=$(du -sh dist/pagefind 2>/dev/null | cut -f1)
  echo "   ✅ 搜索索引生成完成 (${PAGEFIND_SIZE})"
else
  echo "   ⚠️ 搜索索引生成失败（非致命）"
fi
echo ""

# ============================================================
# Step 7: 构建产物验证
# ============================================================
echo "✅ Step 7/7: 验证构建产物..."

ERRORS=0

# 检查关键文件
for file in dist/index.html dist/rss.xml; do
  if [ ! -f "$file" ]; then
    echo "   ❌ 缺少: $file"
    ERRORS=$((ERRORS + 1))
  fi
done

# 检查 CSS 变量（主题是否生效）
if grep -q "color-theme-bg" dist/_astro/*.css 2>/dev/null; then
  echo "   ✅ 主题变量已注入"
else
  echo "   ⚠️ 未检测到主题变量"
fi

# 检查页面完整性
EXPECTED_PAGES=("index.html" "about/index.html" "friends/index.html" "blog/index.html" "rss.xml")
for page in "${EXPECTED_PAGES[@]}"; do
  if [ -f "dist/$page" ]; then
    echo "   ✅ $page"
  else
    echo "   ⚠️ $page 缺失"
  fi
done

echo ""

# ============================================================
# 构建总结
# ============================================================
END_TIME=$(date +%s)
DURATION=$((END_TIME - START_TIME))

echo "================================"
if [ $ERRORS -gt 0 ]; then
  echo "❌ 构建完成但有 $ERRORS 个错误"
  exit 1
fi

echo "✅ 构建成功！"
echo "  📁 输出目录: ./dist"
echo "  📄 页面数: $HTML_COUNT"
echo "  📦 产物大小: $DIST_SIZE"
echo "  ⏱️  耗时: ${DURATION}s"
echo ""

# CI 模式输出摘要
if [ "$CI_MODE" = true ]; then
  echo "::group::Build Summary"
  echo "pages=$HTML_COUNT"
  echo "size=$DIST_SIZE"
  echo "duration=${DURATION}s"
  echo "::endgroup::"
fi
