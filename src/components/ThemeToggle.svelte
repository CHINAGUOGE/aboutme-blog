<!--
  ThemeToggle.svelte
  主题切换器 — 支持亮色 / 暗色 / 跟随系统

  特性：
    - 三态切换：亮色 → 暗色 → 系统 → 亮色
    - 图标动画过渡
    - 持久化至 localStorage
    - 同步更新 <html data-theme>
-->

<script lang="ts">
  import { onMount } from "svelte";

  /** 主题模式 */
  type ThemeMode = "light" | "dark" | "system";

  /** 当前主题 */
  let theme: ThemeMode = "light";
  /** 是否已挂载（防止 SSR 报错） */
  let mounted = false;

  /** 图标映射 */
  const icons: Record<ThemeMode, string> = {
    light: "☀️",
    dark: "🌙",
    system: "💻",
  };

  /** 提示文本映射 */
  const labels: Record<ThemeMode, string> = {
    light: "亮色模式",
    dark: "暗色模式",
    system: "跟随系统",
  };

  /** 解析主题模式为实际的 light/dark */
  function resolveTheme(mode: ThemeMode): "light" | "dark" {
    if (mode === "system") {
      return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    }
    return mode;
  }

  /** 应用主题到 DOM */
  function applyTheme(mode: ThemeMode): void {
    const resolved = resolveTheme(mode);
    document.documentElement.setAttribute("data-theme", resolved);
  }

  /** 使用 View Transition 切换主题（平滑动画） */
  function toggle(): void {
    const order: ThemeMode[] = ["light", "dark", "system"];
    const currentIndex = order.indexOf(theme);
    theme = order[(currentIndex + 1) % order.length];

    try {
      localStorage.setItem("theme", theme);
    } catch {
      // localStorage 不可用时静默失败
    }

    // 使用 View Transition API 实现平滑主题切换
    if (document.startViewTransition) {
      document.startViewTransition(() => {
        applyTheme(theme);
      });
    } else {
      applyTheme(theme);
    }
  }

  /** 键盘事件处理 */
  function handleKeydown(event: KeyboardEvent): void {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      toggle();
    }
  }

  onMount(() => {
    mounted = true;

    // 读取存储的主题
    try {
      const stored = localStorage.getItem("theme") as ThemeMode | null;
      if (stored && ["light", "dark", "system"].includes(stored)) {
        theme = stored;
      }
    } catch {
      // localStorage 不可用
    }

    applyTheme(theme);

    // 监听系统主题变化（仅 system 模式生效）
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    mediaQuery.addEventListener("change", () => {
      if (theme === "system") {
        applyTheme("system");
      }
    });
  });
</script>

<button
  class="theme-toggle"
  on:click={toggle}
  on:keydown={handleKeydown}
  aria-label="切换主题：{labels[theme]}"
  title={labels[theme]}
  type="button"
>
  <span class="theme-toggle-icon" class:mounted>
    {#if mounted}
      {icons[theme]}
    {:else}
      ☀️
    {/if}
  </span>
</button>

<style>
  .theme-toggle {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 2.25rem;
    height: 2.25rem;
    padding: 0;
    border: none;
    border-radius: var(--radius-base);
    background-color: transparent;
    cursor: pointer;
    color: var(--color-theme-text);
    transition:
      background-color 200ms ease,
      transform 200ms ease;
  }

  .theme-toggle:hover {
    background-color: color-mix(in srgb, var(--color-theme-accent) 12%, transparent);
    transform: none;
    box-shadow: none;
  }

  .theme-toggle:active {
    transform: scale(0.9);
  }

  .theme-toggle-icon {
    font-size: 1.125rem;
    line-height: 1;
    display: inline-block;
    transition: transform 300ms cubic-bezier(0.34, 1.56, 0.64, 1);
    transform: scale(0);
  }

  .theme-toggle-icon.mounted {
    transform: scale(1);
  }

  .theme-toggle:hover .theme-toggle-icon {
    transform: scale(1.15) rotate(15deg);
  }
</style>
