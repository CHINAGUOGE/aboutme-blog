<!--
  KeyboardHints.svelte
  键盘快捷键提示浮层

  按 "?" 键显示/隐藏快捷键列表。
  用于告知用户可用的键盘操作。
-->

<script lang="ts">
  import { onMount, onDestroy } from "svelte";

  /** 是否显示 */
  let visible = false;

  /** 快捷键定义 */
  const shortcuts = [
    { keys: ["Space"], desc: "播放 / 暂停" },
    { keys: ["Ctrl", "←"], desc: "上一首" },
    { keys: ["Ctrl", "→"], desc: "下一首" },
    { keys: ["Ctrl", "↑"], desc: "增加音量" },
    { keys: ["Ctrl", "↓"], desc: "降低音量" },
    { keys: ["Ctrl", "K"], desc: "打开搜索" },
    { keys: ["?"], desc: "显示此帮助" },
    { keys: ["Esc"], desc: "关闭弹窗" },
  ];

  function handleKeydown(event: KeyboardEvent): void {
    // 忽略输入框
    const target = event.target as HTMLElement;
    if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable) {
      return;
    }

    if (event.key === "?") {
      event.preventDefault();
      visible = !visible;
    }

    if (event.key === "Escape" && visible) {
      visible = false;
    }
  }

  onMount(() => {
    window.addEventListener("keydown", handleKeydown);
  });

  onDestroy(() => {
    if (typeof window !== "undefined") {
      window.removeEventListener("keydown", handleKeydown);
    }
  });
</script>

{#if visible}
  <!-- svelte-ignore a11y-click-events-have-key-events -->
  <!-- svelte-ignore a11y-no-static-element-interactions -->
  <div class="hints-overlay" on:click|self={() => (visible = false)}>
    <div class="hints-modal" role="dialog" aria-label="键盘快捷键">
      <div class="hints-header">
        <h2 class="hints-title">⌨️ 键盘快捷键</h2>
        <button class="hints-close" on:click={() => (visible = false)} aria-label="关闭">
          ✕
        </button>
      </div>

      <ul class="hints-list">
        {#each shortcuts as shortcut}
          <li class="hints-item">
            <span class="hints-desc">{shortcut.desc}</span>
            <span class="hints-keys">
              {#each shortcut.keys as key, i}
                {#if i > 0}<span class="hints-plus">+</span>{/if}
                <kbd class="hints-key">{key}</kbd>
              {/each}
            </span>
          </li>
        {/each}
      </ul>
    </div>
  </div>
{/if}

<style>
  .hints-overlay {
    position: fixed;
    inset: 0;
    z-index: 200;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: rgba(0, 0, 0, 0.4);
    backdrop-filter: blur(4px);
    animation: overlay-in 0.2s ease;
  }

  @keyframes overlay-in {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  .hints-modal {
    width: 90%;
    max-width: 420px;
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

  .hints-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1rem 1.25rem;
    border-bottom: 1px solid var(--color-theme-border);
  }

  .hints-title {
    margin: 0;
    font-size: 1.125rem;
    font-weight: 600;
    color: var(--color-theme-text);
  }

  .hints-close {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 2rem;
    height: 2rem;
    border: none;
    border-radius: var(--radius-base);
    background: transparent;
    color: var(--color-theme-muted);
    font-size: 1rem;
    cursor: pointer;
    transition:
      color var(--transition-fast) ease,
      background-color var(--transition-fast) ease;
  }

  .hints-close:hover {
    color: var(--color-theme-accent);
    background-color: color-mix(in srgb, var(--color-theme-accent) 10%, transparent);
    transform: none;
    box-shadow: none;
  }

  .hints-list {
    list-style: none;
    margin: 0;
    padding: 0.75rem 1.25rem;
  }

  .hints-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.625rem 0;
    border-bottom: 1px solid color-mix(in srgb, var(--color-theme-border) 50%, transparent);
  }

  .hints-item:last-child {
    border-bottom: none;
  }

  .hints-desc {
    font-size: 0.9375rem;
    color: var(--color-theme-text);
  }

  .hints-keys {
    display: flex;
    align-items: center;
    gap: 0.25rem;
  }

  .hints-plus {
    font-size: 0.75rem;
    color: var(--color-theme-muted);
  }

  .hints-key {
    display: inline-block;
    padding: 0.1875rem 0.5rem;
    border: 1px solid var(--color-theme-border);
    border-radius: 6px;
    font-size: 0.75rem;
    font-family: monospace;
    background-color: color-mix(in srgb, var(--color-theme-muted) 6%, transparent);
    color: var(--color-theme-text);
    min-width: 1.75rem;
    text-align: center;
  }

  @media (max-width: 640px) {
    .hints-modal {
      width: 95%;
    }

    .hints-item {
      flex-direction: column;
      align-items: flex-start;
      gap: 0.375rem;
    }
  }
</style>
