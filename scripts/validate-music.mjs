#!/usr/bin/env node

/**
 * validate-music.mjs
 * 校验音频文件完整性
 *
 * 当前为占位版本 — Task 3.3 将注入完整校验逻辑。
 * 若音频目录为空则静默通过。
 */

import { existsSync, readdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const musicDir = resolve(__dirname, "../src/assets/music");

if (!existsSync(musicDir) || readdirSync(musicDir).length === 0) {
  console.log("⏭️  No music assets found — skipping validation");
  process.exit(0);
}

// Task 3.3 将在此处注入完整校验逻辑
console.log("✅ Music assets validated (placeholder)");
