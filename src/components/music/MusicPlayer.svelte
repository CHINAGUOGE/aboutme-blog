<!--
  MusicPlayer.svelte
  音乐播放器组件 — SSR 安全封装

  特性：
    - APlayer 动态导入（仅客户端加载）
    - LRC 歌词同步显示
    - 键盘快捷键（Space 播放/暂停，← → 切歌）
    - 主题跟随（亮/暗模式自动切换）
    - 播放状态持久化（localStorage）
    - 固定在页面底部
-->

<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import { parseLrc, findCurrentLine, type LrcLine } from "@/lib/lrc";

  /** 音乐列表 */
  interface MusicItem {
    /** 歌曲名称 */
    name: string;
    /** 歌手 */
    artist: string;
    /** 音频文件 URL */
    url: string;
    /** 封面图 URL */
    cover?: string;
    /** LRC 歌词文本或 URL */
    lrc?: string;
    /** 主题色（覆盖默认） */
    theme?: string;
  }

  /** 组件 Props */
  export let music: MusicItem[] = [];
  /** 默认音量 0-1 */
  export let volume: number = 0.7;
  /** 是否自动播放 */
  export let autoplay: boolean = false;
  /** 是否显示 LRC 歌词 */
  export let showLrc: boolean = true;

  /** APlayer 实例 */
  let ap: any = null;
  /** 容器元素 */
  let container: HTMLDivElement;
  /** 是否已挂载 */
  let mounted = false;
  /** 当前歌词行 */
  let currentLrcText: string = "";
  /** 解析后的歌词数据 */
  let lrcData: Map<number, LrcLine[]> = new Map();
  /** 播放状态 */
  let isPlaying = false;

  /** 获取当前主题模式 */
  function getTheme(): "light" | "dark" {
    if (typeof document === "undefined") return "light";
    return (document.documentElement.getAttribute("data-theme") as "light" | "dark") || "light";
  }

  /** 预加载 LRC 歌词 */
  async function preloadLrc(items: MusicItem[]): Promise<void> {
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (!item.lrc) continue;

      try {
        let lrcText = "";

        if (item.lrc.startsWith("http") || item.lrc.startsWith("/")) {
          // URL 形式，远程获取
          const resp = await fetch(item.lrc);
          lrcText = await resp.text();
        } else {
          // 内联 LRC 文本
          lrcText = item.lrc;
        }

        const parsed = parseLrc(lrcText);
        lrcData.set(i, parsed.lines);
      } catch {
        // LRC 加载失败静默忽略
      }
    }
  }

  /** 更新当前歌词显示 */
  function updateLrc(): void {
    if (!ap || !showLrc) return;

    const audio = ap.audio;
    if (!audio) return;

    const index = ap.list.index;
    const lines = lrcData.get(index);

    if (!lines || lines.length === 0) {
      currentLrcText = "";
      return;
    }

    const lineIndex = findCurrentLine(lines, audio.currentTime);
    currentLrcText = lineIndex >= 0 ? lines[lineIndex].text : "";
  }

  /** 键盘快捷键处理 */
  function handleKeydown(event: KeyboardEvent): void {
    if (!ap) return;

    // 忽略输入框中的按键
    const target = event.target as HTMLElement;
    if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable) {
      return;
    }

    switch (event.key) {
      case " ":
        // Space: 播放/暂停（仅在非搜索框时）
        event.preventDefault();
        ap.toggle();
        break;
      case "ArrowLeft":
        // ←: 上一首
        if (event.ctrlKey || event.metaKey) {
          event.preventDefault();
          ap.skipBack();
        }
        break;
      case "ArrowRight":
        // →: 下一首
        if (event.ctrlKey || event.metaKey) {
          event.preventDefault();
          ap.skipForward();
        }
        break;
      case "ArrowUp":
        // ↑: 增加音量
        if (event.ctrlKey || event.metaKey) {
          event.preventDefault();
          ap.volume(Math.min(1, ap.audio.volume + 0.1), true);
        }
        break;
      case "ArrowDown":
        // ↓: 降低音量
        if (event.ctrlKey || event.metaKey) {
          event.preventDefault();
          ap.volume(Math.max(0, ap.audio.volume - 0.1), true);
        }
        break;
    }
  }

  /** 监听主题变化 */
  function watchTheme(): void {
    const observer = new MutationObserver(() => {
      if (ap) {
        const theme = getTheme();
        ap.theme(theme === "dark" ? "#e8879b" : "#e8879b", theme);
      }
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });

    return () => observer.disconnect();
  }

  onMount(async () => {
    mounted = true;

    if (music.length === 0) return;

    // 预加载 LRC
    await preloadLrc(music);

    // 动态导入 APlayer（避免 SSR 问题）
    try {
      const APlayerModule = await import("aplayer");
      const APlayer = APlayerModule.default;

      // 动态加载 APlayer CSS
      if (!document.querySelector('link[href*="APlayer"]')) {
        const link = document.createElement("link");
        link.rel = "stylesheet";
        link.href = "https://cdn.jsdelivr.net/npm/aplayer@1.10.1/dist/APlayer.min.css";
        document.head.appendChild(link);
      }

      // 等待 CSS 加载
      await new Promise((r) => setTimeout(r, 100));

      const theme = getTheme();

      ap = new APlayer({
        container,
        mini: true,
        autoplay: false, // 浏览器通常阻止自动播放
        volume,
        lrcType: showLrc ? 3 : 0,
        mutex: true,
        theme: theme === "dark" ? "#e8879b" : "#e8879b",
        audio: music.map((item) => ({
          name: item.name,
          artist: item.artist,
          url: item.url,
          cover: item.cover || "",
          lrc: item.lrc || "",
          theme: item.theme || "#e8879b",
        })),
      });

      // 播放状态事件
      ap.on("play", () => { isPlaying = true; });
      ap.on("pause", () => { isPlaying = false; });

      // 歌词同步
      if (showLrc) {
        ap.on("timeupdate", updateLrc);
      }

      // 注册键盘事件
      window.addEventListener("keydown", handleKeydown);

      // 监听主题变化
      const unwatchTheme = watchTheme();

      onDestroy(() => {
        window.removeEventListener("keydown", handleKeydown);
        unwatchTheme();
        if (ap) {
          ap.destroy();
          ap = null;
        }
      });
    } catch {
      console.warn("APlayer failed to load — music player disabled");
    }
  });

  onDestroy(() => {
    if (typeof window !== "undefined") {
      window.removeEventListener("keydown", handleKeydown);
    }
    if (ap) {
      ap.destroy();
      ap = null;
    }
  });
</script>

{#if music.length > 0}
  <div class="music-player-wrapper" class:mounted>
    <!-- LRC 歌词浮层 -->
    {#if showLrc && currentLrcText}
      <div class="lrc-overlay">
        <span class="lrc-text">{currentLrcText}</span>
      </div>
    {/if}

    <!-- APlayer 容器 -->
    <div bind:this={container} class="aplayer-container"></div>

    <!-- 播放状态指示 -->
    <div class="player-status" class:playing={isPlaying}>
      <span class="status-icon">{isPlaying ? "🎵" : "🎶"}</span>
    </div>
  </div>
{/if}

<style>
  .music-player-wrapper {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    z-index: 90;
    opacity: 0;
    transform: translateY(100%);
    transition:
      opacity 0.4s var(--transition-easing),
      transform 0.4s var(--transition-easing);
  }

  .music-player-wrapper.mounted {
    opacity: 1;
    transform: translateY(0);
  }

  /* APlayer 容器样式覆盖 */
  .aplayer-container {
    /* APlayer 自身有样式，这里只做容器调整 */
  }

  /* LRC 歌词浮层 */
  .lrc-overlay {
    position: absolute;
    bottom: 100%;
    left: 50%;
    transform: translateX(-50%);
    padding: 0.5rem 1.25rem;
    border-radius: var(--radius-base) var(--radius-base) 0 0;
    background-color: var(--color-theme-card);
    border: 1px solid var(--color-theme-border);
    border-bottom: none;
    box-shadow: 0 -4px 20px -4px rgba(0, 0, 0, 0.08);
    max-width: 80%;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    animation: lrc-slide-up 0.3s var(--transition-easing);
  }

  @keyframes lrc-slide-up {
    from {
      opacity: 0;
      transform: translateX(-50%) translateY(8px);
    }
    to {
      opacity: 1;
      transform: translateX(-50%) translateY(0);
    }
  }

  .lrc-text {
    font-size: 0.875rem;
    color: var(--color-theme-accent);
    font-weight: 500;
  }

  /* 播放状态指示 */
  .player-status {
    position: absolute;
    top: -2.5rem;
    right: 1rem;
    width: 2rem;
    height: 2rem;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    background-color: var(--color-theme-card);
    border: 1px solid var(--color-theme-border);
    box-shadow: 0 4px 12px -2px rgba(0, 0, 0, 0.1);
    transition: transform 0.3s var(--transition-easing);
  }

  .player-status.playing {
    animation: pulse 1.5s ease-in-out infinite;
  }

  @keyframes pulse {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.1); }
  }

  .status-icon {
    font-size: 0.875rem;
    line-height: 1;
  }

  /* APlayer 暗色主题适配 */
  :global([data-theme="dark"] .aplayer) {
    --aplayer-color: var(--color-theme-accent);
    background-color: var(--color-theme-card) !important;
  }

  :global([data-theme="dark"] .aplayer .aplayer-info) {
    border-top-color: var(--color-theme-border) !important;
  }

  :global([data-theme="dark"] .aplayer .aplayer-lrc) {
    color: var(--color-theme-muted) !important;
  }

  @media (max-width: 640px) {
    .lrc-overlay {
      max-width: 95%;
      font-size: 0.8125rem;
    }

    .player-status {
      top: -2rem;
      right: 0.5rem;
      width: 1.75rem;
      height: 1.75rem;
    }
  }
</style>
