/**
 * color-extract.ts
 * Monet 色彩引擎 — 从壁纸提取主题色并生成 CSS 变量
 *
 * 工作流：
 *   1. 读取 src/assets/wallpaper.jpg
 *   2. 使用 colorthief 提取 5 色 palette
 *   3. RGB → HSL 转换
 *   4. 映射至 CSS 变量 + 衍生色
 *   5. 确保 WCAG AA 对比度
 *   6. 输出 src/styles/theme.css
 *
 * 用法：pnpm tsx scripts/color-extract.ts
 */

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

// 动态导入 colorthief（ESM 兼容）
const ColorThief = (await import("colorthief")).default;

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");

/** 输入：壁纸路径 */
const WALLPAPER_PATH = resolve(ROOT, "src/assets/wallpaper.jpg");
/** 输出：主题 CSS 文件 */
const OUTPUT_PATH = resolve(ROOT, "src/styles/theme.css");

/* ============================================================
   色彩工具函数
   ============================================================ */

/** RGB [0-255] → HSL [h: 0-360, s: 0-100, l: 0-100] */
function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  const rf = r / 255;
  const gf = g / 255;
  const bf = b / 255;

  const max = Math.max(rf, gf, bf);
  const min = Math.min(rf, gf, bf);
  const delta = max - min;

  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (delta !== 0) {
    s = l > 0.5 ? delta / (2 - max - min) : delta / (max + min);

    if (max === rf) {
      h = ((gf - bf) / delta + (gf < bf ? 6 : 0)) * 60;
    } else if (max === gf) {
      h = ((bf - rf) / delta + 2) * 60;
    } else {
      h = ((rf - gf) / delta + 4) * 60;
    }
  }

  return [Math.round(h), Math.round(s * 100), Math.round(l * 100)];
}

/** 相对亮度（WCAG 2.1） */
function relativeLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

/** 对比度比值 */
function contrastRatio(rgb1: [number, number, number], rgb2: [number, number, number]): number {
  const l1 = relativeLuminance(...rgb1);
  const l2 = relativeLuminance(...rgb2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

/** HSL → CSS 字符串 */
function hsl(h: number, s: number, l: number): string {
  return `hsl(${h}, ${s}%, ${l}%)`;
}

/** 将 HSL 值钳制在合法范围 */
function clampHsl(h: number, s: number, l: number): [number, number, number] {
  return [
    ((h % 360) + 360) % 360,
    Math.max(0, Math.min(100, s)),
    Math.max(0, Math.min(100, l)),
  ];
}

/* ============================================================
   主流程
   ============================================================ */

console.log("🎨 Monet Color Extractor — 果鸽博客主题引擎\n");

// 1. 检查壁纸是否存在
if (!existsSync(WALLPAPER_PATH)) {
  console.warn("⚠️  壁纸文件不存在：src/assets/wallpaper.jpg");
  console.warn("   使用默认粉色主题，跳过色彩提取。\n");

  // 输出默认 theme.css
  const defaultTheme = `/*
 * theme.css — 自动生成（默认主题）
 * 壁纸文件缺失，使用默认 cute pink palette
 * 重新放置壁纸后运行：pnpm tsx scripts/color-extract.ts
 */

:root {
  --theme-hue: 340;
  --theme-sat: 60%;
  --theme-light: 95%;

  --color-bg: hsl(340, 60%, 95%);
  --color-card: hsl(340, 40%, 100%);
  --color-text: hsl(340, 30%, 25%);
  --color-accent: hsl(340, 65%, 70%);
  --color-muted: hsl(340, 25%, 60%);
  --color-border: hsl(340, 45%, 88%);
}

[data-theme="dark"] {
  --color-bg: hsl(340, 15%, 12%);
  --color-card: hsl(340, 12%, 18%);
  --color-text: hsl(340, 20%, 88%);
  --color-accent: hsl(340, 50%, 65%);
  --color-muted: hsl(340, 15%, 50%);
  --color-border: hsl(340, 10%, 25%);
}
`;
  writeFileSync(OUTPUT_PATH, defaultTheme, "utf-8");
  console.log("✅ 默认主题已写入 src/styles/theme.css");
  process.exit(0);
}

// 2. 读取并缩小壁纸（加速 colorthief 提取）
console.log("📖 读取壁纸...");
const wallpaperBuffer = readFileSync(WALLPAPER_PATH);
const thumbnail = await sharp(wallpaperBuffer)
  .resize(200, 200, { fit: "inside" })
  .removeAlpha()
  .raw()
  .toBuffer();

const pixelArray = Array.from(thumbnail);

// 3. 提取 5 色 palette
console.log("🔍 提取色彩...");
const palette: [number, number, number][] = await (ColorThief as any).getPalette(
  pixelArray,
  5,
  10
);

console.log(`   提取到 ${palette.length} 种颜色：`);
palette.forEach((rgb, i) => {
  const [h, s, l] = rgbToHsl(...rgb);
  console.log(`   ${i + 1}. rgb(${rgb.join(",")}) → hsl(${h},${s}%,${l}%)`);
});

// 4. 选择主色调 — 取饱和度最高的颜色（最鲜艳 = 最有主题感）
const sortedBySat = [...palette]
  .map((rgb) => ({ rgb, hsl: rgbToHsl(...rgb) }))
  .sort((a, b) => b.hsl[1] - a.hsl[1]);

const primary = sortedBySat[0].hsl;
const [hue, sat, lightness] = primary;

console.log(`\n🎯 主色调：hsl(${hue}, ${sat}%, ${lightness}%)`);

// 5. 生成衍生色
//    亮色模式：高明度背景、深色文字、鲜艳强调色
//    暗色模式：低饱和 + 高明度，保持"可爱"不压抑

// --- 亮色模式 ---
const bgLight = clampHsl(hue, Math.min(sat, 60), 95);
const cardLight = clampHsl(hue, Math.min(sat, 40), 100);
const textLight = clampHsl(hue, Math.min(sat, 30), 25);
const accentLight = clampHsl(hue, Math.min(sat + 5, 70), 70);
const mutedLight = clampHsl(hue, Math.min(sat, 25), 60);
const borderLight = clampHsl(hue, Math.min(sat, 45), 88);

// --- 暗色模式：降低饱和度 + 调整明度 ---
const bgDark = clampHsl(hue, 15, 12);
const cardDark = clampHsl(hue, 12, 18);
const textDark = clampHsl(hue, 20, 88);
const accentDark = clampHsl(hue, 50, 65);
const mutedDark = clampHsl(hue, 15, 50);
const borderDark = clampHsl(hue, 10, 25);

// 6. WCAG AA 对比度校验（文字 vs 背景 ≥ 4.5:1）
//    将 HSL 近似转回 RGB 做对比度检查
function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  const hs = h / 360;
  const ss = s / 100;
  const ls = l / 100;

  if (ss === 0) {
    const v = Math.round(ls * 255);
    return [v, v, v];
  }

  const q = ls < 0.5 ? ls * (1 + ss) : ls + ss - ls * ss;
  const p = 2 * ls - q;

  function hue2rgb(p: number, q: number, t: number): number {
    let tt = t;
    if (tt < 0) tt += 1;
    if (tt > 1) tt -= 1;
    if (tt < 1 / 6) return p + (q - p) * 6 * tt;
    if (tt < 1 / 2) return q;
    if (tt < 2 / 3) return p + (q - p) * (2 / 3 - tt) * 6;
    return p;
  }

  return [
    Math.round(hue2rgb(p, q, hs + 1 / 3) * 255),
    Math.round(hue2rgb(p, q, hs) * 255),
    Math.round(hue2rgb(p, q, hs - 1 / 3) * 255),
  ];
}

const textLightRgb = hslToRgb(...textLight);
const bgLightRgb = hslToRgb(...bgLight);
const lightContrast = contrastRatio(textLightRgb, bgLightRgb);

const textDarkRgb = hslToRgb(...textDark);
const bgDarkRgb = hslToRgb(...bgDark);
const darkContrast = contrastRatio(textDarkRgb, bgDarkRgb);

console.log(`\n📊 WCAG AA 对比度校验：`);
console.log(`   亮色文字/背景：${lightContrast.toFixed(2)}:1 ${lightContrast >= 4.5 ? "✅" : "⚠️ 不达标"}`);
console.log(`   暗色文字/背景：${darkContrast.toFixed(2)}:1 ${darkContrast >= 4.5 ? "✅" : "⚠️ 不达标"}`);

// 如果对比度不达标，调整文字明度直到达标
let finalTextLight = textLight;
let finalTextDark = textDark;

if (lightContrast < 4.5) {
  for (let l = textLight[2] - 1; l >= 0; l--) {
    const adjusted = clampHsl(textLight[0], textLight[1], l);
    const ratio = contrastRatio(hslToRgb(...adjusted), bgLightRgb);
    if (ratio >= 4.5) {
      finalTextLight = adjusted;
      console.log(`   🔧 亮色文字明度调整为 ${l}%，对比度 ${ratio.toFixed(2)}:1`);
      break;
    }
  }
}

if (darkContrast < 4.5) {
  for (let l = textDark[2] + 1; l <= 100; l++) {
    const adjusted = clampHsl(textDark[0], textDark[1], l);
    const ratio = contrastRatio(hslToRgb(...adjusted), bgDarkRgb);
    if (ratio >= 4.5) {
      finalTextDark = adjusted;
      console.log(`   🔧 暗色文字明度调整为 ${l}%，对比度 ${ratio.toFixed(2)}:1`);
      break;
    }
  }
}

// 7. 输出 theme.css
const themeCss = `/*
 * theme.css — 由 color-extract.ts 自动生成
 * 壁纸：src/assets/wallpaper.jpg
 * 主色调：hsl(${hue}, ${sat}%, ${lightness}%)
 * 生成时间：${new Date().toISOString()}
 *
 * ⚠️ 请勿手动编辑，修改壁纸后运行：pnpm tsx scripts/color-extract.ts
 */

:root {
  /* 主题色基础值 */
  --theme-hue: ${hue};
  --theme-sat: ${sat}%;
  --theme-light: ${lightness}%;

  /* 亮色模式衍生色 */
  --color-bg: ${hsl(...bgLight)};
  --color-card: ${hsl(...cardLight)};
  --color-text: ${hsl(...finalTextLight)};
  --color-accent: ${hsl(...accentLight)};
  --color-muted: ${hsl(...mutedLight)};
  --color-border: ${hsl(...borderLight)};
}

[data-theme="dark"] {
  /* 暗色模式：降低饱和度 + 提升亮度，保持可爱不压抑 */
  --color-bg: ${hsl(...bgDark)};
  --color-card: ${hsl(...cardDark)};
  --color-text: ${hsl(...finalTextDark)};
  --color-accent: ${hsl(...accentDark)};
  --color-muted: ${hsl(...mutedDark)};
  --color-border: ${hsl(...borderDark)};
}
`;

writeFileSync(OUTPUT_PATH, themeCss, "utf-8");

console.log(`\n✅ 主题文件已生成：src/styles/theme.css`);
console.log(`   主色调 HSL: ${hue}°, ${sat}%, ${lightness}%`);
console.log(`   亮色模式背景: ${hsl(...bgLight)}`);
console.log(`   暗色模式背景: ${hsl(...bgDark)}`);
