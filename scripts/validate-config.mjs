#!/usr/bin/env node

/**
 * validate-config.mjs
 * 校验 src/config/site.ts 是否符合 Zod Schema
 *
 * 当前为占位版本 — Task 1.3 将注入完整 Zod 校验逻辑。
 * 若配置文件不存在则静默通过，避免阻塞早期开发。
 */

import { existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const configPath = resolve(__dirname, "../src/config/site.ts");

if (!existsSync(configPath)) {
  console.log("⏭️  src/config/site.ts not found — skipping validation (will be created in Task 1.3)");
  process.exit(0);
}

// 配置文件存在时执行校验
try {
  const { siteConfigSchema } = await import("../src/config/site.ts");
  const result = siteConfigSchema.safeParse(
    (await import("../src/config/site.ts")).siteConfig
  );

  if (!result.success) {
    console.error("❌ site.config validation failed:");
    for (const issue of result.error.issues) {
      console.error(`  • ${issue.path.join(".")}: ${issue.message}`);
    }
    process.exit(1);
  }

  console.log("✅ site.config is valid");
} catch (err) {
  console.error("❌ Failed to load site.config:", err.message);
  process.exit(1);
}
