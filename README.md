<p align="center">
  <img src="public/logo.png" alt="果鸽的博客" width="128" height="128" />
</p>

<h1 align="center">果鸽的博客</h1>

<p align="center">
  <strong>别当欧尼酱了！</strong> — 一个极致可爱、丝滑交互的个人博客系统
</p>

<p align="center">
  <a href="https://github.com/CHINAGUOGE/aboutme-blog/stargazers"><img alt="Stars" src="https://img.shields.io/github/stars/CHINAGUOGE/aboutme-blog?style=flat-square"></a>
  <a href="https://github.com/CHINAGUOGE/aboutme-blog/issues"><img alt="Issues" src="https://img.shields.io/github/issues/CHINAGUOGE/aboutme-blog?style=flat-square"></a>
  <a href="https://github.com/CHINAGUOGE/aboutme-blog/blob/main/LICENSE"><img alt="License" src="https://img.shields.io/github/license/CHINAGUOGE/aboutme-blog?style=flat-square"></a>
  <img alt="Astro" src="https://img.shields.io/badge/Astro-4.x-FF5D01?style=flat-square&logo=astro">
  <img alt="Svelte" src="https://img.shields.io/badge/Svelte-4.x-FF3E00?style=flat-square&logo=svelte">
  <img alt="Tailwind" src="https://img.shields.io/badge/Tailwind-4.x-06B6D4?style=flat-square&logo=tailwindcss">
</p>

---

## ✨ 特性

- 🎨 **Monet 色彩引擎** — 从壁纸自动提取主题色，生成完整配色方案
- 🌙 **暗色模式** — 亮/暗/跟随系统，View Transitions 平滑切换
- 📝 **Markdown 渲染** — Shiki 双主题代码高亮，图片懒加载
- 🔍 **全文搜索** — Pagefind 集成，构建时索引，运行时零依赖
- 💬 **评论系统** — Giscus (GitHub Discussions) 集成，主题自动同步
- 🎵 **音乐播放器** — APlayer + LRC 歌词同步 + 键盘快捷键
- 🔒 **文章加密** — Web Crypto API (AES-256-GCM) 客户端加密
- 🤝 **友链管理** — YAML/TS 数据驱动，分组展示
- 📡 **RSS Feed** — 自动生成 RSS 2.0
- ⚙️ **配置管理** — 在线配置页面 + CLI 工具
- 🚀 **Cloudflare Pages** — 一键部署，全球 CDN

## 📦 技术栈

| 技术 | 用途 |
|---|---|
| [Astro 4.x](https://astro.build) | 静态站点框架 |
| [Svelte 4.x](https://svelte.dev) | 交互组件 (Islands) |
| [Tailwind CSS 4.x](https://tailwindcss.com) | 原子化样式 |
| [Pagefind](https://pagefind.app) | 全文搜索 |
| [Giscus](https://giscus.app) | 评论系统 |
| [APlayer](https://aplayer.js.org) | 音乐播放器 |
| [Cloudflare Pages](https://pages.cloudflare.com) | 部署平台 |

## 🚀 快速开始

### 环境要求

- Node.js 20+
- pnpm 9+

### 安装

```bash
# 克隆仓库
git clone https://github.com/CHINAGUOGE/aboutme-blog.git
cd aboutme-blog

# 安装依赖
pnpm install

# 启动开发服务器
pnpm dev
```

### 构建

```bash
# 完整构建（色彩提取 + 图片优化 + Astro 构建 + Pagefind 索引）
pnpm build

# 仅 Astro 构建
pnpm build:astro

# 预览构建产物
pnpm preview
```

## 📁 项目结构

```
├── public/                  # 静态资源
├── scripts/                 # 构建/工具脚本
│   ├── color-extract.ts     # Monet 色彩引擎
│   ├── validate-config.mjs  # 配置校验
│   ├── validate-music.mjs   # 音频校验
│   ├── new-post.mjs         # 新建文章
│   ├── update-config.mjs    # 配置修改 CLI
│   └── optimize-assets.mjs  # 图片优化
├── src/
│   ├── assets/              # 图片/音频素材
│   ├── components/          # Svelte/Astro 组件
│   ├── config/              # 站点配置 (site.ts)
│   ├── content/             # Markdown 文章
│   ├── data/                # 数据文件 (友链等)
│   ├── layouts/             # 页面布局
│   ├── lib/                 # 工具函数
│   ├── pages/               # 路由页面
│   ├── plugins/             # Remark/Rehype 插件
│   └── styles/              # 全局样式
├── astro.config.mjs
├── tailwind.config.mjs (CSS-based)
├── tsconfig.json
├── wrangler.toml
└── build.sh
```

## ⚙️ 配置

### 在线配置

访问 `/admin` 打开配置管理页面，支持可视化编辑所有配置项。

### CLI 配置

```bash
# 查看当前配置
pnpm update-config --list

# 修改单项
pnpm update-config --set site.title="新标题"
pnpm update-config --set author.name="新名字"
pnpm update-config --set theme.mode="dark"

# 交互模式
pnpm update-config
```

### 核心配置文件

所有配置集中在 `src/config/site.ts`，由 Zod 严格校验：

```typescript
export const siteConfig = siteConfigSchema.parse({
  title: "果鸽的博客",
  subtitle: "别当欧尼酱了！",
  description: "果鸽的个人博客",
  site: "https://blog.example.com",
  author: { name: "果鸽", bio: "..." },
  socials: [...],
  theme: { defaultMode: "light" },
  music: { enabled: true },
  comment: { repo: "owner/repo" },
  // ...
});
```

## 📝 写作

### 新建文章

```bash
pnpm new-post "文章标题"
```

生成文件：`src/content/blog/YYYY-MM-DD-slug.md`

### 文章格式

```markdown
---
title: "文章标题"
pubDate: "2024-01-01"
description: "文章描述"
category: "分类"
tags: ["标签1", "标签2"]
cover: "封面图路径"
draft: false           # 草稿不会被构建
pinned: false          # 置顶文章
password: ""           # 设置密码后文章加密
---

正文内容...
```

## 🎨 主题色

主题色从壁纸自动提取：

1. 将壁纸放入 `src/assets/wallpaper.jpg`
2. 运行 `pnpm extract-theme`
3. 自动生成 `src/styles/theme.css`

无壁纸时使用默认粉色主题。

## 🚀 部署

### Cloudflare Pages

1. Fork 本仓库
2. 在 Cloudflare Pages 中连接仓库
3. 设置：
   - **Build command:** `bash build.sh`
   - **Output directory:** `dist`
   - **Node version:** `20`

### 其他平台

构建产物在 `dist/` 目录，可部署到任何静态托管服务（Vercel、Netlify、GitHub Pages 等）。

## 🛠️ CLI 工具

| 命令 | 说明 |
|---|---|
| `pnpm dev` | 启动开发服务器 |
| `pnpm build` | 完整构建 |
| `pnpm preview` | 预览构建产物 |
| `pnpm new-post "标题"` | 新建文章 |
| `pnpm update-config` | 修改配置（交互模式） |
| `pnpm update-config --list` | 查看配置 |
| `pnpm update-config --set key="val"` | 修改单项配置 |
| `pnpm validate-config` | 校验配置 |
| `pnpm extract-theme` | 提取主题色 |
| `pnpm optimize-assets` | 优化图片 |

## 📄 License

[MIT](LICENSE)

---

<p align="center">
  用 ❤️ 和 ☕ 构建<br>
  Powered by <a href="https://astro.build">Astro</a> · Oniichan Style ✨
</p>
