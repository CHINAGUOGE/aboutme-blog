/**
 * hydrate-encrypted.ts
 * 加密内容客户端水合脚本
 *
 * 在页面加载后查找 <encrypted-content> 自定义元素，
 * 将其替换为 Svelte EncryptedContent 组件。
 *
 * 由 BlogPostLayout 在加密文章页中引入。
 */

import { mount } from "svelte";
import EncryptedContent from "@/components/encryption/EncryptedContent.svelte";

/**
 * 查找并水合所有加密内容块
 */
export function hydrateEncryptedContent(): void {
  const elements = document.querySelectorAll("encrypted-content");

  for (const el of elements) {
    const encryptedData = el.getAttribute("data-encrypted");

    if (!encryptedData) {
      console.warn("Encrypted content element missing data-encrypted attribute");
      continue;
    }

    // 创建容器
    const container = document.createElement("div");
    container.className = "encrypted-content-mount";
    el.parentNode?.replaceChild(container, el);

    // 挂载 Svelte 组件
    mount(EncryptedContent, {
      target: container,
      props: { encryptedData },
    });
  }
}

// 页面加载后执行
if (typeof document !== "undefined") {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", hydrateEncryptedContent);
  } else {
    hydrateEncryptedContent();
  }
}
