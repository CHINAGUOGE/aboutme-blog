<!--
  EncryptedContent.svelte
  加密内容解密组件

  特性：
    - 密码输入框 + 解密按钮
    - Web Crypto API 解密（PBKDF2 + AES-GCM）
    - 解密后渲染 Markdown 为 HTML
    - 密码错误提示 + 重试
    - 解密成功后内容渐入显示
    - 密码缓存（sessionStorage，关闭标签页自动清除）
-->

<script lang="ts">
  import { onMount } from "svelte";
  import {
    decrypt,
    parseEncryptedData,
    type EncryptedData,
  } from "@/lib/crypto";

  /** 加密数据 JSON 字符串 */
  export let encryptedData: string = "";

  /** 解密后的 HTML 内容 */
  let decryptedHtml: string = "";
  /** 是否正在解密 */
  let isDecrypting: boolean = false;
  /** 错误消息 */
  let error: string = "";
  /** 用户输入的密码 */
  let password: string = "";
  /** 是否已解密 */
  let decrypted: boolean = false;
  /** 密码输入框引用 */
  let passwordInput: HTMLInputElement;
  /** 解析后的加密数据 */
  let parsedData: EncryptedData | null = null;

  /** 缓存键（基于密文哈希） */
  let cacheKey: string = "";

  /** 解析加密数据 */
  function parseData(): void {
    try {
      parsedData = parseEncryptedData(encryptedData);
      // 生成缓存键（使用密文前 32 字符作为标识）
      cacheKey = `decrypt_${parsedData.ciphertext.slice(0, 32)}`;
    } catch {
      error = "加密数据格式错误";
      parsedData = null;
    }
  }

  /** 检查 sessionStorage 中的缓存密码 */
  function checkCache(): string | null {
    try {
      return sessionStorage.getItem(cacheKey);
    } catch {
      return null;
    }
  }

  /** 缓存密码到 sessionStorage */
  function cachePassword(pwd: string): void {
    try {
      sessionStorage.setItem(cacheKey, pwd);
    } catch {
      // sessionStorage 不可用时静默失败
    }
  }

  /** 尝试解密 */
  async function handleDecrypt(): Promise<void> {
    if (!parsedData || !password.trim()) {
      error = "请输入密码";
      return;
    }

    isDecrypting = true;
    error = "";

    try {
      const plaintext = await decrypt(parsedData, password.trim());

      // 解密成功，渲染 Markdown
      decryptedHtml = renderMarkdown(plaintext);
      decrypted = true;

      // 缓存密码
      cachePassword(password.trim());
    } catch (err) {
      if (err instanceof DOMException && err.name === "OperationError") {
        error = "密码错误，请重试";
      } else {
        error = "解密失败：" + (err instanceof Error ? err.message : "未知错误");
      }
    } finally {
      isDecrypting = false;
    }
  }

  /** 键盘事件 */
  function handleKeydown(event: KeyboardEvent): void {
    if (event.key === "Enter") {
      event.preventDefault();
      handleDecrypt();
    }
  }

  /**
   * 简易 Markdown → HTML 渲染
   * 支持基础语法：标题、粗体、斜体、链接、代码、列表、引用
   */
  function renderMarkdown(text: string): string {
    return text
      // 代码块
      .replace(/```(\w*)\n([\s\S]*?)```/g, '<pre><code class="language-$1">$2</code></pre>')
      // 标题
      .replace(/^### (.+)$/gm, "<h3>$1</h3>")
      .replace(/^## (.+)$/gm, "<h2>$1</h2>")
      .replace(/^# (.+)$/gm, "<h1>$1</h1>")
      // 粗体 + 斜体
      .replace(/\*\*\*(.+?)\*\*\*/g, "<strong><em>$1</em></strong>")
      .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.+?)\*/g, "<em>$1</em>")
      // 行内代码
      .replace(/`([^`]+)`/g, "<code>$1</code>")
      // 链接
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>')
      // 图片
      .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" loading="lazy" />')
      // 引用
      .replace(/^> (.+)$/gm, "<blockquote><p>$1</p></blockquote>")
      // 无序列表
      .replace(/^- (.+)$/gm, "<li>$1</li>")
      .replace(/(<li>.*<\/li>\n?)+/g, "<ul>$&</ul>")
      // 有序列表
      .replace(/^\d+\. (.+)$/gm, "<li>$1</li>")
      // 分割线
      .replace(/^---$/gm, "<hr>")
      // 段落（双换行）
      .replace(/\n\n/g, "</p><p>")
      // 单换行
      .replace(/\n/g, "<br>")
      // 包裹在段落中
      .replace(/^(.+)/, "<p>$1")
      .replace(/(.+)$/, "$1</p>");
  }

  onMount(() => {
    parseData();

    // 检查缓存
    const cachedPwd = checkCache();
    if (cachedPwd) {
      password = cachedPwd;
      handleDecrypt();
    }
  });
</script>

{#if decrypted}
  <!-- 解密成功：显示内容 -->
  <div class="decrypted-content">
    {@html decryptedHtml}
  </div>
{:else}
  <!-- 密码输入界面 -->
  <div class="encrypt-prompt">
    <div class="encrypt-icon">🔒</div>
    <h2 class="encrypt-title">这篇文章已加密</h2>
    <p class="encrypt-desc">请输入密码查看内容</p>

    <div class="encrypt-form">
      <input
        bind:this={passwordInput}
        bind:value={password}
        on:keydown={handleKeydown}
        type="password"
        class="encrypt-input"
        placeholder="输入密码..."
        autocomplete="off"
        spellcheck="false"
        disabled={isDecrypting}
      />
      <button
        class="encrypt-btn"
        on:click={handleDecrypt}
        disabled={isDecrypting || !password.trim()}
      >
        {#if isDecrypting}
          <span class="btn-spinner"></span>
          解密中...
        {:else}
          解密
        {/if}
      </button>
    </div>

    {#if error}
      <p class="encrypt-error">{error}</p>
    {/if}
  </div>
{/if}

<style>
  /* 解密后内容 */
  .decrypted-content {
    animation: fade-in 0.5s var(--transition-easing);
  }

  @keyframes fade-in {
    from {
      opacity: 0;
      transform: translateY(8px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  /* 密码输入界面 */
  .encrypt-prompt {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    padding: 4rem 2rem;
    border-radius: var(--radius-card);
    background-color: var(--color-theme-card);
    border: 1px solid var(--color-theme-border);
    margin: 2rem 0;
  }

  .encrypt-icon {
    font-size: 3rem;
    margin-bottom: 1rem;
    animation: bounce 2s ease-in-out infinite;
  }

  @keyframes bounce {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-8px); }
  }

  .encrypt-title {
    font-size: 1.5rem;
    font-weight: 700;
    margin: 0 0 0.5rem;
    color: var(--color-theme-text);
  }

  .encrypt-desc {
    font-size: 0.9375rem;
    color: var(--color-theme-muted);
    margin: 0 0 1.5rem;
  }

  .encrypt-form {
    display: flex;
    gap: 0.75rem;
    width: 100%;
    max-width: 360px;
  }

  .encrypt-input {
    flex: 1;
    padding: 0.75rem 1rem;
    border: 1px solid var(--color-theme-border);
    border-radius: var(--radius-input);
    background-color: var(--color-theme-bg);
    color: var(--color-theme-text);
    font-size: 0.9375rem;
    font-family: inherit;
    outline: none;
    transition: border-color var(--transition-fast) ease;
  }

  .encrypt-input:focus {
    border-color: var(--color-theme-accent);
    box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-theme-accent) 15%, transparent);
  }

  .encrypt-input::placeholder {
    color: var(--color-theme-muted);
  }

  .encrypt-input:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .encrypt-btn {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1.25rem;
    border: none;
    border-radius: var(--radius-input);
    background-color: var(--color-theme-accent);
    color: white;
    font-size: 0.9375rem;
    font-weight: 600;
    font-family: inherit;
    cursor: pointer;
    white-space: nowrap;
    transition:
      background-color var(--transition-fast) ease,
      transform var(--transition-fast) ease;
  }

  .encrypt-btn:hover:not(:disabled) {
    background-color: color-mix(in srgb, var(--color-theme-accent) 85%, black);
    transform: translateY(-1px);
  }

  .encrypt-btn:active:not(:disabled) {
    transform: translateY(0);
  }

  .encrypt-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }

  .btn-spinner {
    width: 16px;
    height: 16px;
    border: 2px solid rgba(255, 255, 255, 0.3);
    border-top-color: white;
    border-radius: 50%;
    animation: spin 0.6s linear infinite;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  .encrypt-error {
    margin-top: 1rem;
    font-size: 0.875rem;
    color: #e74c3c;
    animation: shake 0.3s ease;
  }

  @keyframes shake {
    0%, 100% { transform: translateX(0); }
    25% { transform: translateX(-4px); }
    75% { transform: translateX(4px); }
  }

  @media (max-width: 640px) {
    .encrypt-prompt {
      padding: 2.5rem 1.25rem;
    }

    .encrypt-form {
      flex-direction: column;
    }

    .encrypt-btn {
      justify-content: center;
    }
  }
</style>
