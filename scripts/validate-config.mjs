#!/usr/bin/env node

/**
 * validate-config.mjs
 * 校验 src/config/site.ts 是否符合 Zod Schema
 *
 * 由 lint-staged 在 pre-commit 时自动执行，也可手动运行：
 *   pnpm validate-config
 *
 * 注意：此脚本通过 tsx 执行，支持 TypeScript 导入。
 */

import { existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const configPath = resolve(__dirname, "../src/config/site.ts");

// 配置文件不存在时静默通过
if (!existsSync(configPath)) {
  console.log("⏭️  src/config/site.ts not found — skipping validation");
  process.exit(0);
}

try {
  // tsx 支持直接导入 .ts 文件
  const mod = await import("../src/config/site.ts");

  if (!mod.siteConfigSchema || !mod.siteConfig) {
    console.error("❌ src/config/site.ts 必须导出 siteConfigSchema 和 siteConfig");
    process.exit(1);
  }

  // Zod parse 会在定义时已经校验过一次，这里显式再校验一次确保安全
  const result = mod.siteConfigSchema.safeParse(mod.siteConfig);

  if (!result.success) {
    console.error("❌ site.config 校验失败:");
    for (const issue of result.error.issues) {
      const path = issue.path.length > 0 ? issue.path.join(".") : "(root)";
      console.error(`  • ${path}: ${issue.message}`);
    }
    process.exit(1);
  }

  console.log("✅ site.config 校验通过");
} catch (err) {
  console.error("❌ 加载 site.config 失败:", err.message);
  process.exit(1);
}
