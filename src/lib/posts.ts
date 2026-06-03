/**
 * posts.ts
 * 博客文章工具函数
 *
 * 提供文章查询、排序、筛选等工具函数。
 * 使用 Astro Content Collections API。
 */

import { getCollection, type CollectionEntry } from "astro:content";

/** 文章类型 */
export type BlogPost = CollectionEntry<"blog">;

/**
 * 获取所有已发布文章（排除草稿）
 * @param includeDraft - 是否包含草稿（开发模式下可用）
 */
export async function getPublishedPosts(includeDraft = false): Promise<BlogPost[]> {
  const posts = await getCollection("blog", ({ data }) => {
    if (includeDraft) return true;
    return !data.draft;
  });

  return sortPosts(posts);
}

/**
 * 按发布日期降序排序（最新在前）
 * 置顶文章始终排在最前面
 */
export function sortPosts(posts: BlogPost[]): BlogPost[] {
  return posts.sort((a, b) => {
    // 置顶优先
    if (a.data.pinned && !b.data.pinned) return -1;
    if (!a.data.pinned && b.data.pinned) return 1;

    // 按日期降序
    return new Date(b.data.pubDate).getTime() - new Date(a.data.pubDate).getTime();
  });
}

/**
 * 获取所有分类（去重 + 计数）
 */
export async function getCategories(): Promise<Map<string, number>> {
  const posts = await getPublishedPosts();
  const categories = new Map<string, number>();

  for (const post of posts) {
    const cat = post.data.category || "未分类";
    categories.set(cat, (categories.get(cat) || 0) + 1);
  }

  return categories;
}

/**
 * 获取所有标签（去重 + 计数）
 */
export async function getTags(): Promise<Map<string, number>> {
  const posts = await getPublishedPosts();
  const tags = new Map<string, number>();

  for (const post of posts) {
    for (const tag of post.data.tags) {
      tags.set(tag, (tags.get(tag) || 0) + 1);
    }
  }

  return tags;
}

/**
 * 按分类筛选文章
 */
export async function getPostsByCategory(category: string): Promise<BlogPost[]> {
  const posts = await getPublishedPosts();
  return posts.filter((post) => (post.data.category || "未分类") === category);
}

/**
 * 按标签筛选文章
 */
export async function getPostsByTag(tag: string): Promise<BlogPost[]> {
  const posts = await getPublishedPosts();
  return posts.filter((post) => post.data.tags.includes(tag));
}

/**
 * 分页获取文章
 * @param page - 页码（从 1 开始）
 * @param pageSize - 每页数量
 */
export async function getPaginatedPosts(
  page: number = 1,
  pageSize: number = 10
): Promise<{
  posts: BlogPost[];
  totalPosts: number;
  totalPages: number;
  currentPage: number;
  hasNext: boolean;
  hasPrev: boolean;
}> {
  const allPosts = await getPublishedPosts();
  const totalPosts = allPosts.length;
  const totalPages = Math.ceil(totalPosts / pageSize);
  const currentPage = Math.max(1, Math.min(page, totalPages));
  const start = (currentPage - 1) * pageSize;
  const posts = allPosts.slice(start, start + pageSize);

  return {
    posts,
    totalPosts,
    totalPages,
    currentPage,
    hasNext: currentPage < totalPages,
    hasPrev: currentPage > 1,
  };
}

/**
 * 获取文章摘要（取 description 或正文前 N 个字符）
 */
export function getExcerpt(post: BlogPost, maxLength: number = 150): string {
  if (post.data.description) return post.data.description;

  // 从 body 中提取纯文本
  const text = post.body
    ?.replace(/[#*`>\[\]!\-_]/g, "")
    .replace(/\n+/g, " ")
    .trim() ?? "";

  return text.length > maxLength ? text.slice(0, maxLength) + "..." : text;
}
