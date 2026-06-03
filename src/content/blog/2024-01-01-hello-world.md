---
title: "你好，这是果鸽的博客！"
pubDate: "2024-01-01"
description: "欢迎来到果鸽的个人博客！这里记录开发日常与二次元生活。"
category: "随笔"
tags: ["博客", "Astro", "开始"]
cover: ""
draft: false
pinned: true
---

# 你好，这是果鸽的博客！ 👋

欢迎来到这个由 **Astro + Svelte + Tailwind CSS** 搭建的可爱博客！

## 关于这个博客

这个博客使用了以下技术栈：

- **Astro 4.x** — 静态站点生成框架
- **Svelte 4.x** — 交互组件（Islands 架构）
- **Tailwind CSS 4.x** — 原子化样式
- **Cloudflare Pages** — 部署平台

## 代码高亮示例

```typescript
// TypeScript 代码高亮
interface BlogPost {
  title: string;
  pubDate: string;
  tags: string[];
}

function getExcerpt(post: BlogPost, maxLength: number = 150): string {
  return post.title.length > maxLength
    ? post.title.slice(0, maxLength) + "..."
    : post.title;
}
```

```css
/* CSS 代码高亮 */
.cute-card {
  border-radius: 18px;
  background: var(--color-card);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  transition: transform 200ms ease;
}

.cute-card:hover {
  transform: translateY(-2px);
}
```

## 引用示例

> 代码是写给人看的，顺便让机器执行。
> — Harold Abelson

## 列表示例

1. 第一件事：写代码
2. 第二件事：看番
3. 第三件事：摸鱼（划掉）

## 表格示例

| 技术 | 用途 | 特点 |
|---|---|---|
| Astro | 框架 | 零 JS 默认 |
| Svelte | 组件 | 编译时优化 |
| Tailwind | 样式 | 原子化 CSS |

---

感谢阅读！接下来会陆续更新更多内容 ✨
