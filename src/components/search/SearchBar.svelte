<!--
  SearchBar.svelte
  全文搜索组件 — 基于 Pagefind

  特性：
    - 模态搜索框（点击搜索图标或 Ctrl+K 打开）
    - 实时搜索结果（防抖 300ms）
    - 键盘导航（↑↓ 选择，Enter 跳转，Esc 关闭）
    - 结果高亮关键词
    - SSR 安全（动态导入 Pagefind JS）
-->

<script lang="ts">
  import { onMount, onDestroy } from "svelte";

  /** 搜索状态 */
  let isOpen = false;
  let query = "";
  let results: PagefindResult[] = [];
  let isLoading = false;
  let activeIndex = -1;
  let searchInput: HTMLInputElement;
  let debounceTimer: ReturnType<typeof setTimeout>;

  /** Pagefind 类型 */
  interface PagefindResult {
    id: string;
    url: string;
    title: string;
    excerpt: string;
    meta?: { title?: string; description?: string };
  }

  /** Pagefind 实例 */
  let pagefind: any = null;

  /** 加载 Pagefind JS（通过 script 标签，避免 Vite 解析） */
  async function loadPagefind(): Promise<void> {
    if (pagefind) return;

    try {
      // Pagefind 在构建时生成，运行时通过 script 标签加载
      await new Promise<void>((resolve, reject) => {
        const script = document.createElement("script");
        script.src = "/pagefind/pagefind.js";
        script.async = true;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error("Pagefind script failed to load"));
        document.head.appendChild(script);
      });

      // @ts-ignore — Pagefind 在 window 上注册全局对象
      pagefind = window.pagefind;
      if (pagefind) {
        await pagefind.options({
          highlightParam: "highlight",
          showImages: false,
        });
      }
    } catch {
      console.warn("Pagefind not available — search disabled (run build first)");
    }
  }

  /** 执行搜索 */
  async function search(term: string): Promise<void> {
    if (!pagefind || !term.trim()) {
      results = [];
      isLoading = false;
      return;
    }

    isLoading = true;

    try {
      const searchResult = await pagefind.debouncedSearch(term, {}, 300);
      if (searchResult === null) return; // 被后续搜索取消

      results = (searchResult.results || []).slice(0, 10);

      // 获取每条结果的详细数据
      const detailed = await Promise.all(
        results.map(async (r) => {
          const data = await r.data();
          return {
            ...r,
            title: data.meta?.title || data.url,
            excerpt: data.excerpt || "",
            url: data.url,
          };
        })
      );

      results = detailed;
      activeIndex = -1;
    } catch {
      results = [];
    } finally {
      isLoading = false;
    }
  }

  /** 防抖搜索 */
  function handleInput(): void {
    clearTimeout(debounceTimer);
    isLoading = true;
    debounceTimer = setTimeout(() => search(query), 300);
  }

  /** 打开搜索框 */
  function open(): void {
    isOpen = true;
    query = "";
    results = [];
    activeIndex = -1;
    // 等 DOM 更新后聚焦输入框
    tick().then(() => searchInput?.focus());
  }

  /** 关闭搜索框 */
  function close(): void {
    isOpen = false;
    query = "";
    results = [];
    activeIndex = -1;
  }

  /** 键盘导航 */
  function handleKeydown(event: KeyboardEvent): void {
    if (!isOpen) return;

    switch (event.key) {
      case "Escape":
        event.preventDefault();
        close();
        break;
      case "ArrowDown":
        event.preventDefault();
        activeIndex = Math.min(activeIndex + 1, results.length - 1);
        scrollToActive();
        break;
      case "ArrowUp":
        event.preventDefault();
        activeIndex = Math.max(activeIndex - 1, -1);
        scrollToActive();
        break;
      case "Enter":
        event.preventDefault();
        if (activeIndex >= 0 && results[activeIndex]) {
          window.location.href = results[activeIndex].url;
        }
        break;
    }
  }

  /** 滚动到当前选中项 */
  function scrollToActive(): void {
    const el = document.querySelector(`[data-result-index="${activeIndex}"]`);
    el?.scrollIntoView({ block: "nearest" });
  }

  /** 全局快捷键 Ctrl+K / Cmd+K */
  function handleGlobalKeydown(event: KeyboardEvent): void {
    if ((event.ctrlKey || event.metaKey) && event.key === "k") {
      event.preventDefault();
      isOpen ? close() : open();
    }
  }

  /** tick 函数 */
  function tick(): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, 0));
  }

  onMount(() => {
    loadPagefind();
    window.addEventListener("keydown", handleGlobalKeydown);
  });

  onDestroy(() => {
    window.removeEventListener("keydown", handleGlobalKeydown);
    clearTimeout(debounceTimer);
  });
</script>

<!-- 搜索触发按钮 -->
<button
  class="search-trigger"
  on:click={open}
  aria-label="搜索文章 (Ctrl+K)"
  title="搜索 (Ctrl+K)"
>
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
  <span class="search-trigger-hint">⌘K</span>
</button>

<!-- 搜索模态框 -->
{#if isOpen}
  <!-- svelte-ignore a11y-click-events-have-key-events -->
  <!-- svelte-ignore a11y-no-static-element-interactions -->
  <div class="search-overlay" on:click|self={close}>
    <div class="search-modal" role="dialog" aria-label="搜索">
      <!-- 搜索输入框 -->
      <div class="search-input-wrapper">
        <svg class="search-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input
          bind:this={searchInput}
          bind:value={query}
          on:input={handleInput}
          on:keydown={handleKeydown}
          class="search-input"
          type="text"
          placeholder="搜索文章..."
          autocomplete="off"
          spellcheck="false"
        />
        {#if isLoading}
          <span class="search-loading">搜索中…</span>
        {/if}
        <button class="search-close" on:click={close} aria-label="关闭搜索">
          Esc
        </button>
      </div>

      <!-- 搜索结果 -->
      <div class="search-results">
        {#if results.length > 0}
          <ul class="search-result-list">
            {#each results as result, index}
              <li>
                <a
                  href={result.url}
                  class="search-result-item"
                  class:active={index === activeIndex}
                  data-result-index={index}
                  on:mouseenter={() => (activeIndex = index)}
                >
                  <span class="search-result-title">{result.title}</span>
                  <span class="search-result-excerpt">{@html result.excerpt}</span>
                  <span class="search-result-url">{result.url}</span>
                </a>
              </li>
            {/each}
          </ul>
        {:else if query.trim().length > 0 && !isLoading}
          <div class="search-empty">
            <p>🐦 没有找到匹配「{query}」的文章</p>
          </div>
        {:else}
          <div class="search-hints">
            <p>输入关键词开始搜索</p>
            <div class="search-hint-keys">
              <span><kbd>↑</kbd><kbd>↓</kbd> 导航</span>
              <span><kbd>Enter</kbd> 打开</span>
              <span><kbd>Esc</kbd> 关闭</span>
            </div>
          </div>
        {/if}
      </div>
    </div>
  </div>
{/if}

<style>
  /* ---- 触发按钮 ---- */
  .search-trigger {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 0.75rem;
    border: 1px solid var(--color-theme-border);
    border-radius: var(--radius-base);
    background-color: var(--color-theme-card);
    color: var(--color-theme-muted);
    cursor: pointer;
    font-size: 0.875rem;
    transition:
      color var(--transition-fast) ease,
      border-color var(--transition-fast) ease,
      background-color var(--transition-fast) ease;
  }

  .search-trigger:hover {
    color: var(--color-theme-accent);
    border-color: var(--color-theme-accent);
    transform: none;
    box-shadow: none;
  }

  .search-trigger-hint {
    font-size: 0.6875rem;
    padding: 0.0625rem 0.375rem;
    border-radius: 4px;
    background-color: color-mix(in srgb, var(--color-theme-muted) 10%, transparent);
    color: var(--color-theme-muted);
    font-family: monospace;
  }

  /* ---- 模态框 ---- */
  .search-overlay {
    position: fixed;
    inset: 0;
    z-index: 100;
    display: flex;
    align-items: flex-start;
    justify-content: center;
    padding-top: 10vh;
    background-color: rgba(0, 0, 0, 0.4);
    backdrop-filter: blur(4px);
    animation: overlay-in 0.2s ease;
  }

  @keyframes overlay-in {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  .search-modal {
    width: 90%;
    max-width: 600px;
    max-height: 70vh;
    display: flex;
    flex-direction: column;
    border-radius: var(--radius-card);
    background-color: var(--color-theme-card);
    border: 1px solid var(--color-theme-border);
    box-shadow: 0 20px 60px -15px rgba(0, 0, 0, 0.2);
    overflow: hidden;
    animation: modal-in 0.25s var(--transition-easing);
  }

  @keyframes modal-in {
    from {
      opacity: 0;
      transform: scale(0.95) translateY(-10px);
    }
    to {
      opacity: 1;
      transform: scale(1) translateY(0);
    }
  }

  /* ---- 输入区域 ---- */
  .search-input-wrapper {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.875rem 1.25rem;
    border-bottom: 1px solid var(--color-theme-border);
  }

  .search-icon {
    flex-shrink: 0;
    color: var(--color-theme-muted);
  }

  .search-input {
    flex: 1;
    border: none;
    outline: none;
    background: transparent;
    font-size: 1rem;
    color: var(--color-theme-text);
    font-family: inherit;
  }

  .search-input::placeholder {
    color: var(--color-theme-muted);
  }

  .search-loading {
    font-size: 0.8125rem;
    color: var(--color-theme-muted);
    white-space: nowrap;
  }

  .search-close {
    flex-shrink: 0;
    padding: 0.25rem 0.5rem;
    border: 1px solid var(--color-theme-border);
    border-radius: 6px;
    background: transparent;
    color: var(--color-theme-muted);
    font-size: 0.75rem;
    font-family: monospace;
    cursor: pointer;
    transition: color var(--transition-fast) ease;
  }

  .search-close:hover {
    color: var(--color-theme-accent);
    transform: none;
    box-shadow: none;
  }

  /* ---- 结果列表 ---- */
  .search-results {
    overflow-y: auto;
    flex: 1;
    min-height: 120px;
    max-height: 50vh;
  }

  .search-result-list {
    list-style: none;
    margin: 0;
    padding: 0.5rem;
  }

  .search-result-item {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    padding: 0.75rem 1rem;
    border-radius: var(--radius-base);
    text-decoration: none;
    color: var(--color-theme-text);
    transition: background-color var(--transition-fast) ease;
  }

  .search-result-item:hover,
  .search-result-item.active {
    background-color: color-mix(in srgb, var(--color-theme-accent) 8%, transparent);
    transform: none;
    box-shadow: none;
  }

  .search-result-title {
    font-size: 0.9375rem;
    font-weight: 600;
    line-height: 1.3;
  }

  .search-result-excerpt {
    font-size: 0.8125rem;
    color: var(--color-theme-muted);
    line-height: 1.5;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  :global(.search-result-excerpt mark) {
    background-color: color-mix(in srgb, var(--color-theme-accent) 25%, transparent);
    color: var(--color-theme-accent);
    padding: 0 2px;
    border-radius: 2px;
  }

  .search-result-url {
    font-size: 0.75rem;
    color: var(--color-theme-muted);
    opacity: 0.6;
  }

  /* ---- 空状态 ---- */
  .search-empty,
  .search-hints {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 2.5rem 1rem;
    text-align: center;
    color: var(--color-theme-muted);
    font-size: 0.9375rem;
  }

  .search-hint-keys {
    display: flex;
    gap: 1rem;
    margin-top: 0.75rem;
    font-size: 0.8125rem;
  }

  .search-hint-keys kbd {
    display: inline-block;
    padding: 0.0625rem 0.375rem;
    border: 1px solid var(--color-theme-border);
    border-radius: 4px;
    font-size: 0.75rem;
    font-family: monospace;
    background-color: color-mix(in srgb, var(--color-theme-muted) 6%, transparent);
  }

  @media (max-width: 640px) {
    .search-overlay {
      padding-top: 5vh;
    }

    .search-modal {
      width: 95%;
      max-height: 80vh;
    }

    .search-trigger-hint {
      display: none;
    }
  }
</style>
