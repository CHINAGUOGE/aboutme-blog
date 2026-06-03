/**
 * rehype-lazy-images.mjs
 * Rehype 插件 — 为 Markdown 图片添加懒加载属性
 *
 * 在 Astro 的 Markdown 渲染管线中自动为所有 <img> 添加：
 *   - loading="lazy"
 *   - decoding="async"
 *   - 合理的尺寸默认值
 */

/**
 * @type {import('unified').Plugin<[], import('hast').Root>}
 */
export default function rehypeLazyImages() {
  return (tree) => {
    walk(tree);
  };
}

/**
 * 递归遍历 HAST 树，修改 img 节点
 * @param {import('hast').Node} node
 */
function walk(node) {
  if (!node || typeof node !== "object") return;

  // 处理 img 元素
  if (node.type === "element" && node.tagName === "img") {
    const props = node.properties || {};

    // 添加懒加载（如果没有显式设置）
    if (!props.loading) {
      props.loading = "lazy";
    }

    // 添加异步解码
    if (!props.decoding) {
      props.decoding = "async";
    }

    // 确保有 alt 属性
    if (props.alt === undefined) {
      props.alt = "";
    }

    node.properties = props;
  }

  // 递归处理子节点
  if (Array.isArray(node.children)) {
    for (const child of node.children) {
      walk(child);
    }
  }
}
