#!/usr/bin/env node

/**
 * new-post.mjs
 * 快速创建新文章
 *
 * 用法：pnpm new-post "文章标题"
 * 生成：src/content/blog/YYYY-MM-DD-slug.md
 */

import { writeFileSync, mkdirSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const contentDir = resolve(__dirname, "../src/content/blog");

const title = process.argv[2];
if (!title) {
  console.error("❌ 请提供文章标题：pnpm new-post \"文章标题\"");
  process.exit(1);
}

// 生成 slug 和日期
const date = new Date().toISOString().split("T")[0];
const slug = title
  .toLowerCase()
  .replace(/[^a-z0-9一-鿿]+/g, "-")
  .replace(/^-|-$/g, "");
const filename = `${date}-${slug}.md`;

// 确保目录存在
if (!existsSync(contentDir)) {
  mkdirSync(contentDir, { recursive: true });
}

const filepath = resolve(contentDir, filename);
if (existsSync(filepath)) {
  console.error(`❌ 文件已存在：${filename}`);
  process.exit(1);
}

// 生成 Frontmatter 模板
const content = `---
title: "${title}"
pubDate: "${date}"
description: ""
category: ""
tags: []
cover: ""
draft: true
---

# ${title}

在这里开始写作...
`;

writeFileSync(filepath, content, "utf-8");
console.log(`✅ 新文章已创建：src/content/blog/${filename}`);
