/**
 * rss.xml.ts
 * RSS Feed 端点
 *
 * 自动生成 RSS 2.0 格式的 Feed。
 * 访问地址：/rss.xml
 *
 * 使用 @astrojs/rss 包生成标准 RSS XML。
 */

import rss from "@astrojs/rss";
import type { APIContext } from "astro";
import { siteConfig } from "@/config/site";
import { getPublishedPosts } from "@/lib/posts";

export async function GET(context: APIContext) {
  const posts = await getPublishedPosts();

  return rss({
    /** Feed 标题 */
    title: siteConfig.title,
    /** Feed 描述 */
    description: siteConfig.description,
    /** 站点 URL */
    site: context.site ?? siteConfig.site,
    /** 文章列表 */
    items: posts.map((post) => ({
      title: post.data.title,
      description: post.data.description,
      pubDate: new Date(post.data.pubDate),
      link: `/blog/${post.slug}/`,
      /** 分类标签 */
      categories: [
        post.data.category,
        ...post.data.tags,
      ].filter(Boolean),
    })),
    /** 自定义 XML 头 */
    xmlns: {
      atom: "http://www.w3.org/2005/Atom",
    },
    /** `<atom:link>` 自引用 + 元数据 */
    customData: [
      `<language>${siteConfig.lang}</language>`,
      `<atom:link href="${siteConfig.site}/rss.xml" rel="self" type="application/rss+xml" />`,
      `<lastBuildDate>${new Date().toUTCString()}</lastBuildDate>`,
      `<generator>Astro + @astrojs/rss</generator>`,
    ].join("\n  "),
  });
}
