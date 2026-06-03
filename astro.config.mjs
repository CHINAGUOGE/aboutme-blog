import { defineConfig } from "astro/config";
import svelte from "@astrojs/svelte";
import mdx from "@astrojs/mdx";
import tailwindcss from "@tailwindcss/vite";
import rehypeLazyImages from "./src/plugins/rehype-lazy-images.mjs";
import remarkEncrypt from "./src/plugins/remark-encrypt.mjs";

// https://astro.build/config
export default defineConfig({
  // 基础路径，Cloudflare Pages 部署在根目录
  site: "https://blog.guogepige.dev",
  base: "/",

  integrations: [
    // Svelte Islands 支持
    svelte(),
    // MDX 支持（可在 Markdown 中使用组件）
    mdx(),
  ],

  vite: {
    plugins: [
      // Tailwind CSS 4.x Vite 插件
      tailwindcss(),
    ],
    // 优化依赖预构建
    optimizeDeps: {
      exclude: ["colorthief"],
    },
  },

  // 构建配置
  build: {
    inlineStylesheets: "auto",
  },

  // Markdown 渲染配置
  markdown: {
    // Shiki 代码高亮 — 双主题适配亮/暗模式
    shikiConfig: {
      themes: {
        light: "github-light",
        dark: "github-dark",
      },
      // 不使用默认颜色，让 CSS 变量控制
      defaultColor: false,
      // 自动换行
      wrap: true,
    },
    // 自定义图片渲染组件
    remarkPlugins: [
      // 文章加密（仅对含 password 的文章生效）
      remarkEncrypt,
    ],
    rehypePlugins: [
      // 图片懒加载
      rehypeLazyImages,
    ],
  },

  // 图片优化
  image: {
    // 允许远程图片域名
    remotePatterns: [
      {
        protocol: "https",
      },
    ],
  },
});
