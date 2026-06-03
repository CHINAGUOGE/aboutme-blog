#!/usr/bin/env node

/**
 * update-config.mjs
 * 站点配置修改脚本
 *
 * 用法：
 *   pnpm update-config                    ← 交互模式（逐步引导）
 *   pnpm update-config --set title="新标题"  ← 单项修改
 *   pnpm update-config --list             ← 查看当前配置
 *   pnpm update-config --help             ← 帮助信息
 */

import { readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createInterface } from "node:readline";

const __dirname = dirname(fileURLToPath(import.meta.url));
const CONFIG_PATH = resolve(__dirname, "../src/config/site.ts");

/* ============================================================
   配置项定义
   ============================================================ */

const CONFIG_FIELDS = {
  "site.title": {
    label: "站点标题",
    pattern: /^(\s*)title:\s*"([^"]*)",?\s*$/m,
    replacement: (v, m) => `${m[1]}title: "${v}",`,
    default: "果鸽的博客",
  },
  "site.subtitle": {
    label: "站点副标题",
    pattern: /^(\s*)subtitle:\s*"([^"]*)",?\s*$/m,
    replacement: (v, m) => `${m[1]}subtitle: "${v}",`,
    default: "别当欧尼酱了！",
  },
  "site.description": {
    label: "站点描述",
    pattern: /^(\s*)description:\s*"([^"]*)",?\s*$/m,
    replacement: (v, m) => `${m[1]}description: "${v}",`,
    default: "果鸽的个人博客",
  },
  "site.url": {
    label: "站点 URL",
    pattern: /^(\s*)site:\s*"(https?:\/\/[^"]*)",?\s*$/m,
    replacement: (v, m) => `${m[1]}site: "${v}",`,
    default: "https://blog.guogepige.dev",
    validate: (v) => /^https?:\/\/.+/.test(v) || "请输入有效的 URL",
  },
  "author.name": {
    label: "作者名称",
    // 匹配 author 对象内的 name 字段
    pattern: /(author:\s*\{[^}]*?)name:\s*"([^"]*)"/s,
    replacement: (v, m) => `${m[1]}name: "${v}"`,
    default: "果鸽",
  },
  "author.bio": {
    label: "作者简介",
    pattern: /(author:\s*\{[^}]*?)bio:\s*"([^"]*)"/s,
    replacement: (v, m) => `${m[1]}bio: "${v}"`,
    default: "一只喜欢写代码和看番的鸽子 🐦",
  },
  "author.avatar": {
    label: "头像路径",
    pattern: /(author:\s*\{[^}]*?)avatar:\s*"([^"]*)"/s,
    replacement: (v, m) => `${m[1]}avatar: "${v}"`,
    default: "/avatar.webp",
  },
  "author.location": {
    label: "所在地",
    pattern: /(author:\s*\{[^}]*?)location:\s*"([^"]*)"/s,
    replacement: (v, m) => `${m[1]}location: "${v}"`,
    default: "某颗星球",
  },
  "social.github": {
    label: "GitHub 链接",
    pattern: /(platform:\s*"github",\s*\n\s*url:\s*)"[^"]*"/,
    replacement: (v, m) => `${m[1]}"${v}"`,
    default: "https://github.com/guogepige",
  },
  "social.bilibili": {
    label: "Bilibili 链接",
    pattern: /(platform:\s*"bilibili",\s*\n\s*url:\s*)"[^"]*"/,
    replacement: (v, m) => `${m[1]}"${v}"`,
    default: "https://space.bilibili.com/guogepige",
  },
  "social.email": {
    label: "邮箱地址",
    pattern: /(platform:\s*"email",\s*\n\s*url:\s*)"mailto:[^"]*"/,
    replacement: (v, m) => `${m[1]}"mailto:${v}"`,
    default: "hi@guogepige.dev",
    validate: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) || "请输入有效的邮箱地址",
  },
  "comment.repo": {
    label: "Giscus 仓库 (owner/repo)",
    pattern: /(comment:\s*\{[^}]*?)repo:\s*"([^"]*)"/s,
    replacement: (v, m) => `${m[1]}repo: "${v}"`,
    default: "guogepige/blog-comments",
    validate: (v) => /^[a-zA-Z0-9-]+\/[a-zA-Z0-9-]+$/.test(v) || "格式：owner/repo",
  },
  "comment.category": {
    label: "Giscus 分类",
    pattern: /(comment:\s*\{[^}]*?)category:\s*"([^"]*)"/s,
    replacement: (v, m) => `${m[1]}category: "${v}"`,
    default: "Announcements",
  },
  "theme.mode": {
    label: "默认主题 (light/dark/system)",
    pattern: /(theme:\s*\{[^}]*?)defaultMode:\s*"([^"]*)"/s,
    replacement: (v, m) => `${m[1]}defaultMode: "${v}"`,
    default: "light",
    validate: (v) => ["light", "dark", "system"].includes(v) || "只能是 light、dark 或 system",
  },
  "music.enabled": {
    label: "音乐播放器 (true/false)",
    pattern: /(music:\s*\{[^}]*?)enabled:\s*(true|false)/s,
    replacement: (v, m) => `${m[1]}enabled: ${v}`,
    default: "true",
    validate: (v) => ["true", "false"].includes(v) || "只能是 true 或 false",
  },
  "icp": {
    label: "ICP 备案号（留空则不显示）",
    pattern: /^(\s*)icp:\s*"[^"]*",?\s*$/m,
    replacement: (v, m) => v ? `${m[1]}icp: "${v}",` : `${m[1]}icp: undefined,`,
    default: "",
  },
};

/* ============================================================
   工具函数
   ============================================================ */

function readConfig() {
  return readFileSync(CONFIG_PATH, "utf-8");
}

function writeConfig(content) {
  writeFileSync(CONFIG_PATH, content, "utf-8");
}

/**
 * 提取 siteConfigSchema.parse({...}) 中的内容
 * 仅在此范围内搜索/替换，避免误匹配 schema 定义或 timeline 等子对象
 */
function extractSiteConfigBlock(config) {
  const startMarker = "siteConfigSchema.parse({";
  const startIdx = config.indexOf(startMarker);
  if (startIdx === -1) return null;

  // 找到匹配的结束括号
  let depth = 0;
  let endIdx = -1;
  for (let i = startIdx + startMarker.length - 1; i < config.length; i++) {
    if (config[i] === "{") depth++;
    if (config[i] === "}") {
      depth--;
      if (depth === 0) {
        endIdx = i + 1;
        break;
      }
    }
  }

  if (endIdx === -1) return null;

  return {
    fullBlock: config.slice(startIdx, endIdx),
    startIdx,
    endIdx,
  };
}

function findFieldValue(config, key) {
  const field = CONFIG_FIELDS[key];
  if (!field) return null;

  // 在 siteConfig 块内搜索
  const block = extractSiteConfigBlock(config);
  if (!block) return null;

  const match = block.fullBlock.match(field.pattern);
  return match;
}

function getValue(config, key) {
  const match = findFieldValue(config, key);
  if (!match) return CONFIG_FIELDS[key]?.default || null;
  return match[match.length - 1] || CONFIG_FIELDS[key]?.default || null;
}

function setValue(config, key, value) {
  const field = CONFIG_FIELDS[key];
  if (!field) {
    console.error(`❌ 未知配置项：${key}`);
    return null;
  }

  if (field.validate) {
    const result = field.validate(value);
    if (result !== true) {
      console.error(`❌ ${result}`);
      return null;
    }
  }

  const block = extractSiteConfigBlock(config);
  if (!block) {
    console.warn("⚠️  未找到 siteConfig 配置块");
    return null;
  }

  const match = block.fullBlock.match(field.pattern);
  if (!match) {
    console.warn(`⚠️  未找到配置项 ${key}，可能需要手动编辑 site.ts`);
    return null;
  }

  // 在 siteConfig 块内替换
  const newBlock = block.fullBlock.replace(field.pattern, field.replacement(value, match));

  // 拼接回完整配置
  const newConfig = config.slice(0, block.startIdx) + newBlock + config.slice(block.endIdx);
  return newConfig;
}

function ask(rl, question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => resolve(answer.trim()));
  });
}

function listConfig(config) {
  console.log("\n📋 当前站点配置：\n");

  const groups = [
    { name: "站点信息", keys: ["site.title", "site.subtitle", "site.description", "site.url"] },
    { name: "作者信息", keys: ["author.name", "author.bio", "author.avatar", "author.location"] },
    { name: "社交链接", keys: ["social.github", "social.bilibili", "social.email"] },
    { name: "评论系统", keys: ["comment.repo", "comment.category"] },
    { name: "主题设置", keys: ["theme.mode"] },
    { name: "音乐播放器", keys: ["music.enabled"] },
    { name: "备案信息", keys: ["icp"] },
  ];

  for (const group of groups) {
    console.log(`  ── ${group.name} ──`);
    for (const key of group.keys) {
      const field = CONFIG_FIELDS[key];
      const value = getValue(config, key);
      const display = value || "(未设置)";
      console.log(`    ${field.label.padEnd(20)} ${display}`);
    }
  }
  console.log("");
}

/* ============================================================
   主流程
   ============================================================ */

const args = process.argv.slice(2);

if (args.includes("--help") || args.includes("-h")) {
  console.log(`
📝 站点配置修改脚本

用法：
  pnpm update-config                    交互模式
  pnpm update-config --list             查看当前配置
  pnpm update-config --set key="value"  修改单项配置
  pnpm update-config --help             显示帮助

可修改的配置项：
${Object.entries(CONFIG_FIELDS)
  .map(([key, field]) => `  ${key.padEnd(22)} ${field.label}`)
  .join("\n")}
`);
  process.exit(0);
}

let config = readConfig();

if (args.includes("--list")) {
  listConfig(config);
  process.exit(0);
}

const setIndex = args.indexOf("--set");
if (setIndex !== -1) {
  const setArg = args[setIndex + 1];
  if (!setArg || !setArg.includes("=")) {
    console.error('❌ 用法：--set key="value"');
    process.exit(1);
  }

  const [key, ...valueParts] = setArg.split("=");
  const value = valueParts.join("=").replace(/^["']|["']$/g, "");

  const newConfig = setValue(config, key, value);
  if (newConfig) {
    writeConfig(newConfig);
    console.log(`✅ ${CONFIG_FIELDS[key]?.label || key} → "${value}"`);
  } else {
    process.exit(1);
  }
  process.exit(0);
}

// 交互模式
console.log("\n🐦 果鸽博客 — 配置修改向导");
console.log("================================");
console.log("直接按回车跳过，输入值后回车确认。\n");

const rl = createInterface({
  input: process.stdin,
  output: process.stdout,
});

async function interactive() {
  const fields = [
    { key: "site.title", group: "站点信息" },
    { key: "site.subtitle", group: "站点信息" },
    { key: "site.description", group: "站点信息" },
    { key: "site.url", group: "站点信息" },
    { key: "author.name", group: "作者信息" },
    { key: "author.bio", group: "作者信息" },
    { key: "author.avatar", group: "作者信息" },
    { key: "author.location", group: "作者信息" },
    { key: "social.github", group: "社交链接" },
    { key: "social.bilibili", group: "社交链接" },
    { key: "social.email", group: "社交链接" },
    { key: "comment.repo", group: "评论系统" },
    { key: "comment.category", group: "评论系统" },
    { key: "theme.mode", group: "主题设置" },
    { key: "music.enabled", group: "音乐播放器" },
    { key: "icp", group: "备案信息" },
  ];

  let lastGroup = "";
  let changed = 0;

  for (const { key, group } of fields) {
    const field = CONFIG_FIELDS[key];
    const currentValue = getValue(config, key) || field.default;

    if (group !== lastGroup) {
      console.log(`\n── ${group} ──`);
      lastGroup = group;
    }

    const answer = await ask(rl, `  ${field.label} [${currentValue}]: `);

    if (answer && answer !== currentValue) {
      const newConfig = setValue(config, key, answer);
      if (newConfig) {
        config = newConfig;
        console.log(`    ✅ → "${answer}"`);
        changed++;
      }
    } else if (!answer) {
      console.log(`    ⏭️  跳过`);
    }
  }

  if (changed > 0) {
    writeConfig(config);
    console.log(`\n✅ 配置已更新（${changed} 项修改）`);
    console.log(`   文件：src/config/site.ts`);
    console.log(`\n💡 运行 pnpm build 验证配置`);
  } else {
    console.log("\n⏭️  未修改任何配置");
  }

  rl.close();
}

interactive().catch((err) => {
  console.error("❌ 错误：", err.message);
  rl.close();
  process.exit(1);
});
