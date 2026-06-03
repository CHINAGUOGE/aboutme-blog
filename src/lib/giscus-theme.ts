/**
 * giscus-theme.ts
 * Giscus 主题桥接模块
 *
 * 提供博客主题与 Giscus 主题之间的映射和同步功能。
 * 通过 postMessage API 与 Giscus iframe 通信，实现无刷新主题切换。
 *
 * @see https://giscus.app/zh-CN  — Giscus 配置文档
 * @see https://github.com/giscus/giscus/blob/main/ADVANCED.md — 高级 API
 */

/** 博客主题模式 */
export type BlogTheme = "light" | "dark";

/** Giscus 支持的主题 */
export type GiscusTheme =
  | "light"
  | "light_high_contrast"
  | "light_protanopia"
  | "light_tritanopia"
  | "dark"
  | "dark_high_contrast"
  | "dark_protanopia"
  | "dark_tritanopia"
  | "dark_dimmed"
  | "preferred_color_scheme"
  | "transparent_dark"
  | "noborder_light"
  | "noborder_dark"
  | "cobalt"
  | "purple_dark";

/**
 * 博客主题 → Giscus 主题映射表
 *
 * 可通过修改此映射自定义亮/暗模式下 Giscus 的外观。
 * 完整主题列表见：https://github.com/giscus/giscus/tree/main/styles/themes
 */
const THEME_MAP: Record<BlogTheme, GiscusTheme> = {
  light: "light",
  dark: "dark_dimmed",
};

/**
 * 获取当前博客主题
 * @returns 当前主题模式
 */
export function getBlogTheme(): BlogTheme {
  if (typeof document === "undefined") return "light";
  return (document.documentElement.getAttribute("data-theme") as BlogTheme) || "light";
}

/**
 * 将博客主题映射为 Giscus 主题
 * @param blogTheme - 博客主题模式
 * @returns Giscus 主题名称
 */
export function mapTheme(blogTheme: BlogTheme): GiscusTheme {
  return THEME_MAP[blogTheme] || "preferred_color_scheme";
}

/**
 * 向 Giscus iframe 发送主题更新消息
 *
 * 使用 postMessage API 与 Giscus 通信，无需重新加载 iframe。
 * 如果 iframe 尚未就绪，静默失败。
 *
 * @param container - Giscus 容器 DOM 元素
 * @param theme - 要设置的 Giscus 主题
 *
 * @example
 * ```ts
 * const container = document.querySelector(".giscus-container");
 * updateGiscusTheme(container, "dark_dimmed");
 * ```
 */
export function updateGiscusTheme(
  container: HTMLElement | null,
  theme: GiscusTheme
): void {
  if (!container) return;

  const iframe = container.querySelector<HTMLIFrameElement>("iframe.giscus-frame");
  if (!iframe?.contentWindow) return;

  const message = {
    giscus: {
      setConfig: {
        theme,
      },
    },
  };

  iframe.contentWindow.postMessage(message, "https://giscus.app");
}

/**
 * 同步博客主题到 Giscus
 *
 * 读取当前博客主题，映射为 Giscus 主题，并通过 postMessage 更新。
 * 通常在主题切换时调用。
 *
 * @param container - Giscus 容器 DOM 元素
 *
 * @example
 * ```ts
 * // 在主题切换回调中
 * syncThemeToGiscus(document.querySelector(".giscus-container"));
 * ```
 */
export function syncThemeToGiscus(container: HTMLElement | null): void {
  const blogTheme = getBlogTheme();
  const giscusTheme = mapTheme(blogTheme);
  updateGiscusTheme(container, giscusTheme);
}

/**
 * 创建主题变化观察器
 *
 * 监听 `<html data-theme>` 属性变化，自动同步主题到 Giscus。
 * 返回清理函数用于销毁观察器。
 *
 * @param container - Giscus 容器 DOM 元素（或返回容器的函数）
 * @returns 清理函数
 *
 * @example
 * ```ts
 * onMount(() => {
 *   const destroy = createThemeObserver(
 *     document.querySelector(".giscus-container")
 *   );
 *   onDestroy(destroy);
 * });
 * ```
 */
export function createThemeObserver(
  container: HTMLElement | null | (() => HTMLElement | null)
): () => void {
  if (typeof document === "undefined") return () => {};

  const observer = new MutationObserver(() => {
    const el = typeof container === "function" ? container() : container;
    syncThemeToGiscus(el);
  });

  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["data-theme"],
  });

  return () => observer.disconnect();
}

/**
 * 构建 Giscus script URL
 *
 * 根据配置参数生成完整的 Giscus 客户端 script URL。
 * 适用于动态创建 script 标签的场景。
 *
 * @param config - Giscus 配置参数
 * @returns 完整的 script URL
 */
export function buildGiscusUrl(config: {
  repo: string;
  repoId: string;
  category?: string;
  categoryId?: string;
  mapping?: string;
  strict?: boolean;
  reactionsEnabled?: boolean;
  emitMetadata?: boolean;
  inputPosition?: "top" | "bottom";
  lang?: string;
}): string {
  const blogTheme = getBlogTheme();
  const giscusTheme = mapTheme(blogTheme);

  const params = new URLSearchParams({
    repo: config.repo,
    "repo-id": config.repoId,
    category: config.category || "",
    "category-id": config.categoryId || "",
    mapping: config.mapping || "pathname",
    strict: config.strict ? "1" : "0",
    "reactions-enabled": config.reactionsEnabled !== false ? "1" : "0",
    "emit-metadata": config.emitMetadata ? "1" : "0",
    "input-position": config.inputPosition || "top",
    theme: giscusTheme,
    lang: config.lang || "zh-CN",
    loading: "lazy",
  });

  return `https://giscus.app/client?${params.toString()}`;
}
