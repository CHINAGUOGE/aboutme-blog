/**
 * site.config.ts
 * 站点全局配置 — 由 Zod 严格校验
 *
 * 所有可配置项均通过 Zod Schema 定义类型和默认值。
 * 修改后运行 `pnpm validate-config` 确保格式正确。
 */

import { z } from "zod";

/* ============================================================
   Zod Schema 定义
   ============================================================ */

/** 社交链接 Schema */
const socialLinkSchema = z.object({
  /** 平台名称 */
  platform: z.enum(["github", "twitter", "bilibili", "email", "rss"]),
  /** 链接地址 */
  url: z.string().url().or(z.string().startsWith("mailto:")).or(z.string().startsWith("/")),
  /** 显示顺序，数字越小越靠前 */
  order: z.number().int().min(0).default(0),
});

/** 导航项 Schema */
const navItemSchema = z.object({
  /** 显示文本 */
  label: z.string().min(1),
  /** 链接路径 */
  href: z.string().startsWith("/"),
  /** 图标名称（可选，后续集成 icon 库） */
  icon: z.string().optional(),
});

/** 主题配置 Schema */
const themeSchema = z.object({
  /** 默认主题模式 */
  defaultMode: z.enum(["light", "dark", "system"]).default("light"),
  /** 壁纸路径（相对于 src/assets/） */
  wallpaperPath: z.string().default("wallpaper.jpg"),
  /** 强制使用壁纸提取色，忽略手动覆盖 */
  useExtractedColors: z.boolean().default(true),
  /** 手动覆盖色值（useExtractedColors 为 false 时生效） */
  manualHue: z.number().min(0).max(360).optional(),
  manualSat: z.number().min(0).max(100).optional(),
  manualLight: z.number().min(0).max(100).optional(),
});

/** 音乐播放器配置 Schema */
const musicSchema = z.object({
  /** 是否启用音乐播放器 */
  enabled: z.boolean().default(true),
  /** 音频文件目录（相对于 src/assets/music/） */
  musicDir: z.string().default("src/assets/music"),
  /** 默认音量 0-1 */
  defaultVolume: z.number().min(0).max(1).default(0.7),
  /** 是否自动播放（浏览器通常会阻止） */
  autoplay: z.boolean().default(false),
  /** 是否显示 LRC 歌词 */
  showLrc: z.boolean().default(true),
});

/** 评论系统配置 Schema（Giscus） */
const commentSchema = z.object({
  /** 是否启用评论 */
  enabled: z.boolean().default(true),
  /** Giscus 仓库 */
  repo: z
    .string()
    .regex(/^[a-zA-Z0-9-]+\/[a-zA-Z0-9-]+$/, "格式：owner/repo")
    .default("guogepige/blog-comments"),
  /** Giscus Repository ID */
  repoId: z.string().default(""),
  /** Discussion 分类 */
  category: z.string().default("Announcements"),
  /** 分类 ID */
  categoryId: z.string().default(""),
  /** 映射方式 */
  mapping: z.enum(["pathname", "url", "title", "og:title"]).default("pathname"),
  /** 是否启用严格匹配 */
  strict: z.boolean().default(true),
  /** 是否启用 reactions */
  reactionsEnabled: z.boolean().default(true),
  /** 是否在评论区上方发送按钮 */
  emitMetadata: z.boolean().default(false),
  /** 输入框位置 */
  inputPosition: z.enum(["top", "bottom"]).default("top"),
  /** 评论语言 */
  lang: z.string().default("zh-CN"),
});

/** 友链配置 Schema */
const friendLinkSchema = z.object({
  /** 名称 */
  name: z.string().min(1),
  /** 头像 URL（支持绝对 URL 或相对路径） */
  avatar: z.string().url().or(z.string().startsWith("/")),
  /** 博客链接 */
  url: z.string().url(),
  /** 简介 */
  description: z.string().default(""),
  /** 分组（可选） */
  group: z.string().optional(),
});

/** 关于页时间轴事件 Schema */
const timelineEventSchema = z.object({
  /** 日期文本 */
  date: z.string().min(1),
  /** 事件标题 */
  title: z.string().min(1),
  /** 事件描述 */
  description: z.string().default(""),
  /** 图标（可选） */
  icon: z.string().optional(),
});

/* ============================================================
   主配置 Schema
   ============================================================ */

export const siteConfigSchema = z.object({
  /** 站点标题 */
  title: z.string().min(1).max(100),
  /** 站点副标题 */
  subtitle: z.string().max(200).default(""),
  /** 站点描述 */
  description: z.string().min(1).max(500),
  /** 站点语言 */
  lang: z.string().default("zh-CN"),
  /** 站点 URL（不含尾斜杠） */
  site: z.string().url(),
  /** 基础路径 */
  base: z.string().startsWith("/").default("/"),

  /** 作者信息 */
  author: z.object({
    /** 昵称 */
    name: z.string().min(1),
    /** 头像路径（相对于 public/） */
    avatar: z.string().default("/avatar.webp"),
    /** 个人简介 */
    bio: z.string().max(300).default(""),
    /** 所在地 */
    location: z.string().default(""),
  }),

  /** 社交链接列表 */
  socials: z.array(socialLinkSchema).default([]),

  /** 导航栏项目 */
  navItems: z.array(navItemSchema).default([
    { label: "首页", href: "/" },
    { label: "文章", href: "/blog" },
    { label: "友链", href: "/friends" },
    { label: "关于", href: "/about" },
  ]),

  /** 主题配置 */
  theme: themeSchema.default({}),

  /** 音乐播放器配置 */
  music: musicSchema.default({}),

  /** 评论系统配置 */
  comment: commentSchema.default({}),

  /** 友链列表 */
  friends: z.array(friendLinkSchema).default([]),

  /** 关于页时间轴 */
  timeline: z.array(timelineEventSchema).default([]),

  /** ICP 备案号（可选，中国大陆部署需要） */
  icp: z.string().optional(),

  /** 公安备案号（可选） */
  police: z.string().optional(),
});

/* ============================================================
   类型导出
   ============================================================ */

/** 站点配置完整类型 */
export type SiteConfig = z.infer<typeof siteConfigSchema>;

/** 社交链接类型 */
export type SocialLink = z.infer<typeof socialLinkSchema>;

/** 导航项类型 */
export type NavItem = z.infer<typeof navItemSchema>;

/** 友链类型 */
export type FriendLink = z.infer<typeof friendLinkSchema>;

/** 时间轴事件类型 */
export type TimelineEvent = z.infer<typeof timelineEventSchema>;

/* ============================================================
   实际配置值
   ============================================================ */

export const siteConfig = siteConfigSchema.parse({
  title: "Guoge's Blog",
  subtitle: "咕咕咕咕咕咕咕咕咕",
  description: "果鸽的博客，记录一些小事",
  lang: "zh-CN",
  site: "https://me.51320721.xyz",
  base: "/",

  author: {
    name: "果鸽",
    avatar: "/avatar.png",
    bio: "一只MTX鸽子，无证HRT中",
    location: "果鸽星",
  },

  socials: [
    { platform: "github", url: "https://github.com/guogepige", order: 0 },
    { platform: "bilibili", url: "https://space.bilibili.com/guogepige", order: 1 },
    { platform: "email", url: "mailto:hi@guogepige.dev", order: 2 },
    { platform: "rss", url: "/rss.xml", order: 3 },
  ],

  navItems: [
    { label: "首页", href: "/" },
    { label: "文章", href: "/blog" },
    { label: "友链", href: "/friends" },
    { label: "关于", href: "/about" },
  ],

  theme: {
    defaultMode: "system",
    wallpaperPath: "wallpaper.jpg",
    useExtractedColors: true,
  },

  music: {
    enabled: true,
    musicDir: "src/assets/music",
    defaultVolume: 0.7,
    autoplay: false,
    showLrc: true,
  },

  comment: {
    enabled: true,
    repo: "CHINAGUOGE/aboutme-blog",
    repoId: "",
    category: "Announcements",
    categoryId: "",
    mapping: "pathname",
    strict: true,
    reactionsEnabled: true,
    emitMetadata: false,
    inputPosition: "top",
    lang: "zh-CN",
  },

  friends: [
    {
      name: "W.S.S-Wiki",
      avatar: "/wiki.png",
      url: "https://wiki.51320721.xyz",
      description: "我运营的Wiki",
      group: "我的项目",
    },
  ],

  timeline: [
    {
      date: "2026",
      title: "开始写博客",
      description: "使用 Astro 搭建了这个可爱的博客 ✨",
    },
  ],
});
