/**
 * Content Collections 配置
 *
 * 定义博客文章的 Schema，Frontmatter 严格校验。
 * Astro 会在构建时自动验证每篇文章的 frontmatter。
 */

import { defineCollection, z } from "astro:content";

/** 博客文章集合 */
const blogCollection = defineCollection({
  type: "content",
  schema: z.object({
    /** 文章标题 */
    title: z.string().min(1).max(200),

    /** 发布日期（YYYY-MM-DD 格式） */
    pubDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "日期格式：YYYY-MM-DD")
      .or(z.date())
      .transform((val) => (typeof val === "string" ? val : val.toISOString().split("T")[0])),

    /** 文章描述（用于列表页和 SEO） */
    description: z.string().min(1).max(500),

    /** 分类（单个） */
    category: z.string().default("未分类"),

    /** 标签（多个） */
    tags: z.array(z.string()).default([]),

    /** 封面图路径（相对于 src/assets/ 或 public/） */
    cover: z.string().optional(),

    /** 是否为草稿（构建时过滤） */
    draft: z.boolean().default(false),

    /** 最后更新日期 */
    updatedDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/)
      .or(z.date())
      .transform((val) => (typeof val === "string" ? val : val.toISOString().split("T")[0]))
      .optional(),

    /** 是否置顶 */
    pinned: z.boolean().default(false),

    /** 文章密码（为空则不加密） */
    password: z.string().optional(),
  }),
});

export const collections = {
  blog: blogCollection,
};
