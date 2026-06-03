/**
 * generate-logo.mjs
 * 生成站点 Logo PNG
 *
 * 用法：node scripts/generate-logo.mjs
 */

import sharp from "sharp";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");

// SVG Logo 内容
const svgLogo = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FFB6C1"/>
      <stop offset="50%" stop-color="#FF8FAB"/>
      <stop offset="100%" stop-color="#E8879B"/>
    </linearGradient>
    <linearGradient id="wing" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FFD4DE"/>
      <stop offset="100%" stop-color="#FFB6C1"/>
    </linearGradient>
    <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="4" stdDeviation="8" flood-color="#E8879B" flood-opacity="0.3"/>
    </filter>
  </defs>

  <!-- 圆形背景 -->
  <circle cx="256" cy="256" r="240" fill="url(#bg)" filter="url(#shadow)"/>

  <!-- 身体 -->
  <ellipse cx="256" cy="280" rx="120" ry="130" fill="white" opacity="0.95"/>

  <!-- 左翅膀 -->
  <ellipse cx="150" cy="260" rx="55" ry="70" fill="url(#wing)" transform="rotate(-15 150 260)"/>

  <!-- 右翅膀 -->
  <ellipse cx="362" cy="260" rx="55" ry="70" fill="url(#wing)" transform="rotate(15 362 260)"/>

  <!-- 头部 -->
  <circle cx="256" cy="180" r="75" fill="white" opacity="0.95"/>

  <!-- 左眼 -->
  <circle cx="228" cy="170" r="18" fill="#2D1B2E"/>
  <circle cx="234" cy="164" r="7" fill="white"/>

  <!-- 右眼 -->
  <circle cx="284" cy="170" r="18" fill="#2D1B2E"/>
  <circle cx="290" cy="164" r="7" fill="white"/>

  <!-- 嘴 -->
  <ellipse cx="256" cy="200" rx="18" ry="12" fill="#FFD700"/>
  <ellipse cx="256" cy="197" rx="14" ry="8" fill="#FFEB3B"/>

  <!-- 左腮红 -->
  <ellipse cx="195" cy="190" rx="18" ry="10" fill="#FFB6C1" opacity="0.6"/>

  <!-- 右腮红 -->
  <ellipse cx="317" cy="190" rx="18" ry="10" fill="#FFB6C1" opacity="0.6"/>

  <!-- 头顶呆毛 -->
  <path d="M256 105 Q260 70 270 60 Q275 55 268 65 Q265 80 256 105" fill="#FFB6C1"/>
  <path d="M256 105 Q252 75 245 65 Q240 58 248 68 Q252 82 256 105" fill="#FFD4DE"/>

  <!-- 脚 -->
  <ellipse cx="220" cy="400" rx="22" ry="10" fill="#FFD700"/>
  <ellipse cx="292" cy="400" rx="22" ry="10" fill="#FFD700"/>

  <!-- 文字 "果鸽" -->
  <text x="256" y="460" text-anchor="middle" font-family="sans-serif" font-weight="bold" font-size="48" fill="#E8879B">果鸽</text>
</svg>`;

// 生成不同尺寸
const sizes = [
  { name: "logo.png", size: 512 },
  { name: "logo-256.png", size: 256 },
  { name: "logo-128.png", size: 128 },
  { name: "favicon-192.png", size: 192 },
  { name: "favicon-512.png", size: 512 },
];

console.log("🎨 生成站点 Logo...\n");

for (const { name, size } of sizes) {
  const outputPath = resolve(ROOT, "public", name);

  await sharp(Buffer.from(svgLogo))
    .resize(size, size)
    .png({ quality: 90 })
    .toFile(outputPath);

  console.log(`  ✅ ${name} (${size}x${size})`);
}

console.log("\n✅ Logo 生成完成！");
