<!--
  GiscusComment.svelte
  Giscus 评论组件 — 基于 GitHub Discussions

  特性：
    - SSR 安全（客户端动态加载）
    - 主题跟随（亮/暗模式自动切换 Giscus 主题）
    - 防闪烁（FOUC prevention）：iframe 加载前不显示
    - 动态主题桥接（postMessage 更新 Giscus 主题）
    - 可配置所有 Giscus 参数
-->

<script lang="ts">
  import { onMount, onDestroy } from "svelte";

  /** Giscus 配置 */
  export let repo: string = "";
  export let repoId: string = "";
  export let category: string = "Announcements";
  export let categoryId: string = "";
  export let mapping: string = "pathname";
  export let strict: boolean = true;
  export let reactionsEnabled: boolean = true;
  export let emitMetadata: boolean = false;
  export let inputPosition: "top" | "bottom" = "top";
  export let lang: string = "zh-CN";

  /** 组件状态 */
  let container: HTMLDivElement;
  let mounted = false;
  let iframeLoaded = false;
  let currentTheme: "light" | "dark" = "light";

  /** Giscus 主题 URL 映射 */
  const GISCUS_THEMES = {
    light: "light",
    dark: "dark_dimmed",
  };

  /** 获取当前页面主题 */
  function getTheme(): "light" | "dark" {
    if (typeof document === "undefined") return "light";
    return (document.documentElement.getAttribute("data-theme") as "light" | "dark") || "light";
  }

  /** 生成 Giscus script src */
  function getGiscusSrc(): string {
    const params = new URLSearchParams({
      repo,
      "repo-id": repoId,
      category,
      "category-id": categoryId,
      "mapping": mapping,
      "strict": strict ? "1" : "0",
      "reactions-enabled": reactionsEnabled ? "1" : "0",
      "emit-metadata": emitMetadata ? "1" : "0",
      "input-position": inputPosition,
      "theme": GISCUS_THEMES[currentTheme],
      "lang": lang,
      loading: "lazy",
    });

    return `https://giscus.app/client?${params.toString()}`;
  }

  /** 加载 Giscus */
  function loadGiscus(): void {
    if (!container || !repo || !repoId) return;

    // 清空容器
    container.innerHTML = "";

    // 创建 script 元素
    const script = document.createElement("script");
    script.src = getGiscusSrc();
    script.async = true;
    script.crossOrigin = "anonymous";

    // 监听 iframe 加载完成
    script.onload = () => {
      // 等待 iframe 渲染
      const checkIframe = setInterval(() => {
        const iframe = container.querySelector("iframe");
        if (iframe) {
          clearInterval(checkIframe);

          // 监听 iframe 内部的主题消息
          iframe.addEventListener("load", () => {
            iframeLoaded = true;
          });

          // 超时保护：2 秒后无论如何显示
          setTimeout(() => {
            iframeLoaded = true;
          }, 2000);
        }
      }, 100);
    };

    container.appendChild(script);
  }

  /** 更新 Giscus 主题（postMessage） */
  function updateGiscusTheme(theme: "light" | "dark"): void {
    if (!container) return;

    const iframe = container.querySelector("iframe");
    if (!iframe || !iframe.contentWindow) return;

    const message = {
      giscus: {
        setConfig: {
          theme: GISCUS_THEMES[theme],
        },
      },
    };

    iframe.contentWindow.postMessage(message, "https://giscus.app");
  }

  /** 监听主题变化 */
  function watchTheme(): () => void {
    const observer = new MutationObserver(() => {
      const newTheme = getTheme();
      if (newTheme !== currentTheme) {
        currentTheme = newTheme;
        updateGiscusTheme(newTheme);
      }
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });

    return () => observer.disconnect();
  }

  onMount(() => {
    mounted = true;
    currentTheme = getTheme();

    // 加载 Giscus
    loadGiscus();

    // 监听主题变化
    const unwatchTheme = watchTheme();

    onDestroy(() => {
      unwatchTheme();
    });
  });

  onDestroy(() => {
    mounted = false;
  });
</script>

{#if repo && repoId}
  <div class="giscus-wrapper" class:mounted class:loaded={iframeLoaded}>
    <div bind:this={container} class="giscus-container"></div>

    <!-- 加载占位符 -->
    {#if !iframeLoaded}
      <div class="giscus-placeholder">
        <div class="placeholder-spinner"></div>
        <span>评论加载中…</span>
      </div>
    {/if}
  </div>
{:else}
  <div class="giscus-missing">
    <p>💬 评论功能未配置 — 请在 <code>site.config.ts</code> 中填写 Giscus 的 <code>repo</code> 和 <code>repoId</code></p>
  </div>
{/if}

<style>
  .giscus-wrapper {
    margin-top: 2rem;
    opacity: 0;
    transform: translateY(12px);
    transition:
      opacity 0.4s var(--transition-easing),
      transform 0.4s var(--transition-easing);
  }

  .giscus-wrapper.mounted {
    opacity: 1;
    transform: translateY(0);
  }

  .giscus-wrapper.loaded .giscus-placeholder {
    display: none;
  }

  .giscus-container {
    min-height: 200px;
  }

  /* Giscus iframe 样式覆盖 */
  :global(.giscus-container iframe) {
    border-radius: var(--radius-card);
  }

  /* 加载占位符 */
  .giscus-placeholder {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 0.75rem;
    padding: 3rem 1rem;
    color: var(--color-theme-muted);
    font-size: 0.875rem;
  }

  .placeholder-spinner {
    width: 24px;
    height: 24px;
    border: 2px solid var(--color-theme-border);
    border-top-color: var(--color-theme-accent);
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  /* 未配置提示 */
  .giscus-missing {
    margin-top: 2rem;
    padding: 1.25rem;
    border-radius: var(--radius-card);
    background-color: color-mix(in srgb, var(--color-theme-accent) 6%, transparent);
    border: 1px dashed var(--color-theme-border);
    text-align: center;
    color: var(--color-theme-muted);
    font-size: 0.875rem;
  }

  .giscus-missing code {
    padding: 0.125rem 0.375rem;
    border-radius: 4px;
    background-color: color-mix(in srgb, var(--color-theme-accent) 10%, transparent);
    color: var(--color-theme-accent);
    font-size: 0.8125rem;
  }
</style>
