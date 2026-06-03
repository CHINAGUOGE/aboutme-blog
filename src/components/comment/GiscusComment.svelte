<!--
  GiscusComment.svelte
  Giscus 评论组件 — 基于 GitHub Discussions

  特性：
    - SSR 安全（客户端动态加载）
    - 主题跟随（通过 giscus-theme.ts 桥接）
    - 防闪烁（iframe 加载前不显示）
    - 动态主题切换（postMessage 无刷新更新）
    - 可配置所有 Giscus 参数
-->

<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import {
    getBlogTheme,
    mapTheme,
    updateGiscusTheme,
    createThemeObserver,
    buildGiscusUrl,
    type GiscusTheme,
  } from "@/lib/giscus-theme";

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
  let destroyThemeObserver: (() => void) | null = null;

  /** 加载 Giscus */
  function loadGiscus(): void {
    if (!container || !repo || !repoId) return;

    // 清空容器
    container.innerHTML = "";

    // 使用工具函数生成 URL
    const src = buildGiscusUrl({
      repo,
      repoId,
      category,
      categoryId,
      mapping,
      strict,
      reactionsEnabled,
      emitMetadata,
      inputPosition,
      lang,
    });

    // 创建 script 元素
    const script = document.createElement("script");
    script.src = src;
    script.async = true;
    script.crossOrigin = "anonymous";

    // 监听 iframe 加载
    script.onload = () => {
      const checkIframe = setInterval(() => {
        const iframe = container.querySelector("iframe");
        if (iframe) {
          clearInterval(checkIframe);

          iframe.addEventListener("load", () => {
            iframeLoaded = true;
          });

          // 超时保护：2 秒后显示
          setTimeout(() => {
            iframeLoaded = true;
          }, 2000);
        }
      }, 100);
    };

    container.appendChild(script);

    // 创建主题观察器（使用工具函数）
    destroyThemeObserver = createThemeObserver(() => container);
  }

  onMount(() => {
    mounted = true;

    if (repo && repoId) {
      loadGiscus();
    }

    return () => {
      if (destroyThemeObserver) {
        destroyThemeObserver();
        destroyThemeObserver = null;
      }
    };
  });

  onDestroy(() => {
    mounted = false;
    if (destroyThemeObserver) {
      destroyThemeObserver();
      destroyThemeObserver = null;
    }
  });
</script>

{#if repo && repoId}
  <div class="giscus-wrapper" class:mounted class:loaded={iframeLoaded}>
    <div bind:this={container} class="giscus-container"></div>

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

  :global(.giscus-container iframe) {
    border-radius: var(--radius-card);
  }

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
