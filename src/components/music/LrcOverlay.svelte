<!--
  LrcOverlay.svelte
  独立歌词浮层组件

  可放置在页面任意位置，与 MusicPlayer 共享歌词状态。
  特性：
    - 逐行高亮当前歌词
    - 自动滚动到当前行
    - 支持点击歌词跳转播放位置（需配合 MusicPlayer）
    - 平滑过渡动画
-->

<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import { parseLrc, findCurrentLine, type LrcLine } from "@/lib/lrc";

  /** LRC 歌词文本或 URL */
  export let lrc: string = "";
  /** 当前播放时间（秒），由外部传入 */
  export let currentTime: number = 0;
  /** 是否显示 */
  export let visible: boolean = true;

  /** 解析后的歌词行 */
  let lines: LrcLine[] = [];
  /** 当前行索引 */
  let currentIndex: number = -1;
  /** 歌词容器 */
  let container: HTMLDivElement;
  /** 是否已加载 */
  let loaded = false;

  /** 解析 LRC */
  async function loadLrc(lrcSource: string): Promise<void> {
    if (!lrcSource) {
      lines = [];
      loaded = false;
      return;
    }

    try {
      let text = lrcSource;

      if (lrcSource.startsWith("http") || lrcSource.startsWith("/")) {
        const resp = await fetch(lrcSource);
        text = await resp.text();
      }

      const data = parseLrc(text);
      lines = data.lines;
      loaded = true;
    } catch {
      lines = [];
      loaded = false;
    }
  }

  /** 自动滚动到当前行 */
  function scrollToCurrent(): void {
    if (!container || currentIndex < 0) return;

    const activeLine = container.querySelector(`[data-line-index="${currentIndex}"]`);
    if (activeLine) {
      activeLine.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  }

  /** 响应时间变化 */
  $: if (lines.length > 0) {
    const newIndex = findCurrentLine(lines, currentTime);
    if (newIndex !== currentIndex) {
      currentIndex = newIndex;
      scrollToCurrent();
    }
  }

  /** 响应 LRC 变化 */
  $: loadLrc(lrc);

  onMount(() => {
    if (lrc) loadLrc(lrc);
  });
</script>

{#if visible && loaded && lines.length > 0}
  <div class="lrc-overlay" bind:this={container}>
    <div class="lrc-scroll-area">
      <!-- 顶部空白（使第一行能居中） -->
      <div class="lrc-spacer"></div>

      {#each lines as line, index}
        <p
          class="lrc-line"
          class:active={index === currentIndex}
          class:past={index < currentIndex}
          data-line-index={index}
        >
          {line.text || "···"}
        </p>
      {/each}

      <!-- 底部空白 -->
      <div class="lrc-spacer"></div>
    </div>
  </div>
{/if}

<style>
  .lrc-overlay {
    width: 100%;
    max-height: 300px;
    overflow: hidden;
    position: relative;
    mask-image: linear-gradient(
      to bottom,
      transparent 0%,
      black 15%,
      black 85%,
      transparent 100%
    );
    -webkit-mask-image: linear-gradient(
      to bottom,
      transparent 0%,
      black 15%,
      black 85%,
      transparent 100%
    );
  }

  .lrc-scroll-area {
    overflow-y: auto;
    max-height: 300px;
    padding: 0 1rem;
    scroll-behavior: smooth;
    scrollbar-width: none;
  }

  .lrc-scroll-area::-webkit-scrollbar {
    display: none;
  }

  .lrc-spacer {
    height: 120px;
  }

  .lrc-line {
    text-align: center;
    font-size: 0.9375rem;
    line-height: 2;
    color: var(--color-theme-muted);
    margin: 0;
    padding: 0.25rem 0;
    transition:
      color 0.3s ease,
      font-size 0.3s ease,
      opacity 0.3s ease;
    cursor: default;
  }

  .lrc-line.active {
    color: var(--color-theme-accent);
    font-size: 1.125rem;
    font-weight: 600;
  }

  .lrc-line.past {
    opacity: 0.5;
  }

  @media (max-width: 640px) {
    .lrc-overlay {
      max-height: 200px;
    }

    .lrc-scroll-area {
      max-height: 200px;
    }

    .lrc-spacer {
      height: 80px;
    }

    .lrc-line {
      font-size: 0.875rem;
    }

    .lrc-line.active {
      font-size: 1rem;
    }
  }
</style>
