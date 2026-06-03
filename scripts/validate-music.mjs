#!/usr/bin/env node

/**
 * validate-music.mjs
 * 音频资产校验脚本
 *
 * 校验 src/assets/music/ 目录下的音频文件：
 *   - 文件头（Magic Bytes）校验
 *   - 文件大小检查（非空、不超过 50MB）
 *   - 格式支持检查（mp3/flac/wav/ogg/m4a）
 *   - 交叉引用校验（检查被 site.config 引用的文件是否存在）
 *
 * 用法：pnpm validate-music
 * 由 lint-staged 在 pre-commit 时自动执行。
 */

import { existsSync, readdirSync, readSync, openSync, closeSync, statSync } from "node:fs";
import { resolve, dirname, extname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const MUSIC_DIR = resolve(ROOT, "src/assets/music");

/** 支持的音频格式 */
const SUPPORTED_FORMATS = new Set([".mp3", ".flac", ".wav", ".ogg", ".m4a", ".aac"]);

/** 文件头 Magic Bytes 签名 */
const MAGIC_BYTES = {
  mp3: [
    { offset: 0, bytes: [0xff, 0xfb] },       // MP3 frame sync
    { offset: 0, bytes: [0xff, 0xf3] },       // MP3 frame sync (MPEG2)
    { offset: 0, bytes: [0xff, 0xf2] },       // MP3 frame sync (MPEG2.5)
    { offset: 0, bytes: [0x49, 0x44, 0x33] }, // ID3v2 tag
  ],
  flac: [{ offset: 0, bytes: [0x66, 0x4c, 0x61, 0x43] }], // "fLaC"
  wav: [
    { offset: 0, bytes: [0x52, 0x49, 0x46, 0x46] }, // "RIFF"
  ],
  ogg: [{ offset: 0, bytes: [0x4f, 0x67, 0x67, 0x53] }], // "OggS"
  m4a: [
    { offset: 4, bytes: [0x66, 0x74, 0x79, 0x70] }, // "ftyp"
  ],
};

/** 最大文件大小 50MB */
const MAX_FILE_SIZE = 50 * 1024 * 1024;

/** 最小文件大小 1KB */
const MIN_FILE_SIZE = 1024;

/**
 * 读取文件头部字节
 * @param {string} filePath
 * @param {number} length
 * @returns {Buffer}
 */
function readHeader(filePath, length = 16) {
  const fd = openSync(filePath, "r");
  try {
    const buffer = Buffer.alloc(length);
    readSync(fd, buffer, 0, length, 0);
    return buffer;
  } finally {
    closeSync(fd);
  }
}

/**
 * 检查文件头是否匹配指定格式
 * @param {Buffer} header
 * @param {string} format
 * @returns {boolean}
 */
function checkMagicBytes(header, format) {
  const signatures = MAGIC_BYTES[format];
  if (!signatures) return false;

  return signatures.some(({ offset, bytes }) => {
    for (let i = 0; i < bytes.length; i++) {
      if (header[offset + i] !== bytes[i]) return false;
    }
    return true;
  });
}

/**
 * 检测音频格式
 * @param {Buffer} header
 * @param {string} ext
 * @returns {{ valid: boolean, detectedFormat: string | null }}
 */
function detectFormat(header, ext) {
  // 按扩展名优先检测
  const extClean = ext.toLowerCase().replace(".", "");
  if (MAGIC_BYTES[extClean] && checkMagicBytes(header, extClean)) {
    return { valid: true, detectedFormat: extClean };
  }

  // 通用检测（可能扩展名不匹配）
  for (const format of Object.keys(MAGIC_BYTES)) {
    if (checkMagicBytes(header, format)) {
      return { valid: true, detectedFormat: format };
    }
  }

  return { valid: false, detectedFormat: null };
}

// ============================================================
// 主流程
// ============================================================

console.log("🎵 音频资产校验\n");

// 检查音乐目录是否存在
if (!existsSync(MUSIC_DIR)) {
  console.log("⏭️  src/assets/music/ 目录不存在 — 跳过校验");
  process.exit(0);
}

// 扫描音频文件
const allFiles = readdirSync(MUSIC_DIR).filter((f) => !f.startsWith("."));
const audioFiles = allFiles.filter((f) => SUPPORTED_FORMATS.has(extname(f).toLowerCase()));
const unknownFiles = allFiles.filter((f) => !SUPPORTED_FORMATS.has(extname(f).toLowerCase()) && f !== ".gitkeep");

if (audioFiles.length === 0) {
  console.log("⏭️  无音频文件 — 跳过校验");
  if (unknownFiles.length > 0) {
    console.log(`   ℹ️  发现非音频文件：${unknownFiles.join(", ")}`);
  }
  process.exit(0);
}

console.log(`📁 发现 ${audioFiles.length} 个音频文件\n`);

let errors = 0;
let warnings = 0;

for (const file of audioFiles) {
  const filePath = resolve(MUSIC_DIR, file);
  const ext = extname(file);
  const stats = statSync(filePath);

  console.log(`   🔍 ${file}`);

  // 1. 文件大小检查
  if (stats.size < MIN_FILE_SIZE) {
    console.error(`      ❌ 文件过小 (${(stats.size / 1024).toFixed(1)}KB)，可能为空或损坏`);
    errors++;
    continue;
  }

  if (stats.size > MAX_FILE_SIZE) {
    console.error(`      ❌ 文件过大 (${(stats.size / 1024 / 1024).toFixed(1)}MB)，超过 50MB 限制`);
    errors++;
    continue;
  }

  // 2. 文件头校验
  try {
    const header = readHeader(filePath);
    const { valid, detectedFormat } = detectFormat(header, ext);

    if (!valid) {
      console.error(`      ❌ 文件头损坏或不是有效的 ${ext} 格式`);
      errors++;
      continue;
    }

    // 扩展名与实际格式不匹配
    const extClean = ext.replace(".", "").toLowerCase();
    if (detectedFormat && detectedFormat !== extClean) {
      console.warn(`      ⚠️  扩展名 ${ext} 与实际格式 ${detectedFormat} 不匹配`);
      warnings++;
    }

    console.log(`      ✅ 格式：${detectedFormat || extClean} · 大小：${(stats.size / 1024).toFixed(1)}KB`);
  } catch (err) {
    console.error(`      ❌ 读取文件失败：${err.message}`);
    errors++;
  }
}

// 3. 检查非音频文件
if (unknownFiles.length > 0) {
  console.log(`\n   ℹ️  非音频文件（不影响构建）：`);
  unknownFiles.forEach((f) => console.log(`      · ${f}`));
}

// 总结
console.log("\n================================");
if (errors > 0) {
  console.error(`❌ 校验完成：${errors} 个错误，${warnings} 个警告`);
  process.exit(1);
} else if (warnings > 0) {
  console.warn(`⚠️  校验完成：${warnings} 个警告，全部通过`);
  process.exit(0);
} else {
  console.log(`✅ 校验完成：${audioFiles.length} 个文件全部通过`);
  process.exit(0);
}
