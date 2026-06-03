#!/usr/bin/env node

/**
 * optimize-assets.mjs
 * 图片资产优化 — 使用 sharp 压缩头像和 Banner
 *
 * 由 build.sh 调用，也可手动运行：
 *   pnpm tsx scripts/optimize-assets.mjs
 *
 * 输入：
 *   - src/assets/avatar.png  → public/avatar.webp (256px, q80)
 *   - src/assets/banner.jpg  → public/banner.webp (1200px, q75)
 *
 * 若源文件不存在则跳过，不阻塞构建。
 */

import { existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");

/** 优化任务列表 */
const tasks = [
  {
    input: resolve(ROOT, "src/assets/avatar.png"),
    output: resolve(ROOT, "public/avatar.webp"),
    width: 256,
    quality: 80,
    label: "头像",
  },
  {
    input: resolve(ROOT, "src/assets/banner.jpg"),
    output: resolve(ROOT, "public/banner.webp"),
    width: 1200,
    quality: 75,
    label: "Banner",
  },
];

let processed = 0;

for (const task of tasks) {
  if (!existsSync(task.input)) {
    console.log(`   ⏭️  ${task.label}：源文件不存在，跳过`);
    continue;
  }

  try {
    await sharp(task.input)
      .resize(task.width, null, { withoutEnlargement: true })
      .webp({ quality: task.quality })
      .toFile(task.output);

    console.log(`   ✅ ${task.label}：已优化 → ${task.output.replace(ROOT, ".")}`);
    processed++;
  } catch (err) {
    console.error(`   ❌ ${task.label}：优化失败 — ${err.message}`);
  }
}

if (processed === 0) {
  console.log("   ℹ️  无图片需要优化（将 src/assets/avatar.png 和 banner.jpg 放入后重新运行）");
}
