import { defineConfig } from "astro/config";
import svelte from "@astrojs/svelte";
import tailwindcss from "@tailwindcss/vite";

// https://astro.build/config
export default defineConfig({
  // 基础路径，Cloudflare Pages 部署在根目录
  site: "https://blog.guogepige.dev",
  base: "/",

  integrations: [
    // Svelte Islands 支持
    svelte(),
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
    // 合并 head 脚本
    inlineStylesheets: "auto",
  },

  // Markdown 渲染配置
  markdown: {
    // 使用 Shiki 代码高亮（后续 Task 2.1 详细配置）
    shikiConfig: {
      theme: "github-dark",
      wrap: true,
    },
  },

  // 图片优化
  image: {
    // 允许远程图片域名（后续可按需扩展）
    remotePatterns: [],
  },
});
