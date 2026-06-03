#!/bin/bash
set -euo pipefail

# ============================================================
# build.sh — 果鸽博客构建脚本
#
# 执行顺序：
#   1. 色彩提取（生成 theme.css）
#   2. 音乐资产校验
#   3. 图片优化（sharp 压缩）
#   4. Astro 构建
#   5. Pagefind 全文索引
#
# 用法：bash build.sh
# Cloudflare Pages 构建命令：bash build.sh
# ============================================================

echo ""
echo "🐦 果鸽博客 — 构建流程启动"
echo "================================"
echo ""

# 1. 色彩提取
echo "🎨 Step 1/5: 提取主题色..."
if pnpm tsx scripts/color-extract.ts; then
  echo "   ✅ 主题色提取完成"
else
  echo "   ⚠️ 色彩提取失败，使用默认主题继续"
fi
echo ""

# 2. 音乐资产校验
echo "🎵 Step 2/5: 校验音乐资产..."
if pnpm tsx scripts/validate-music.mjs; then
  echo "   ✅ 音乐资产校验通过"
else
  echo "   ⚠️ 部分音乐文件缺失，继续构建"
fi
echo ""

# 3. 图片优化
echo "🖼️  Step 3/5: 优化图片资产..."
if pnpm tsx scripts/optimize-assets.mjs; then
  echo "   ✅ 图片优化完成"
else
  echo "   ⚠️ 图片优化跳过（源文件不存在）"
fi
echo ""

# 4. Astro 构建
echo "🔨 Step 4/5: 构建静态站点..."
pnpm astro build
echo ""

# 5. Pagefind 全文索引
echo "🔍 Step 5/5: 生成搜索索引..."
if npx pagefind --site dist; then
  echo "   ✅ 搜索索引生成完成"
else
  echo "   ⚠️ 搜索索引生成失败，搜索功能不可用"
fi
echo ""

echo "================================"
echo "✅ 构建完成！输出目录：./dist"
echo ""
