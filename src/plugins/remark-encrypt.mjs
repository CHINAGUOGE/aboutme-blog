/**
 * remark-encrypt.mjs
 * Remark 插件 — 构建时文章加密
 *
 * 检测 frontmatter 中的 password 字段。
 * 如果存在密码，将文章正文替换为加密数据块。
 *
 * 工作流：
 *   1. 检测 frontmatter.password
 *   2. 提取 Markdown 正文
 *   3. 使用密码加密正文（AES-256-GCM）
 *   4. 替换正文为 <encrypted-content> 自定义元素
 *
 * 注意：此插件使用 Node.js crypto 模块（构建时），
 * 而非 Web Crypto API（浏览器端）。最终解密在客户端完成。
 */

import crypto from "node:crypto";

/** PBKDF2 迭代次数（与客户端一致） */
const PBKDF2_ITERATIONS = 100_000;

/** Salt 长度 */
const SALT_LENGTH = 16;

/** IV 长度 */
const IV_LENGTH = 12;

/**
 * 从密码派生密钥（Node.js crypto）
 * @param {string} password
 * @param {Buffer} salt
 * @returns {Buffer}
 */
function deriveKey(password, salt) {
  return crypto.pbkdf2Sync(password, salt, PBKDF2_ITERATIONS, 32, "sha-256");
}

/**
 * 加密文本
 * @param {string} plaintext
 * @param {string} password
 * @returns {{ ciphertext: string, salt: string, iv: string }}
 */
function encryptSync(plaintext, password) {
  const salt = crypto.randomBytes(SALT_LENGTH);
  const iv = crypto.randomBytes(IV_LENGTH);
  const key = deriveKey(password, salt);

  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  let encrypted = cipher.update(plaintext, "utf8");
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  const authTag = cipher.getAuthTag();

  // 密文 + auth tag 拼接
  const ciphertext = Buffer.concat([encrypted, authTag]);

  return {
    ciphertext: ciphertext.toString("base64"),
    salt: salt.toString("base64"),
    iv: iv.toString("base64"),
  };
}

/**
 * @type {import('unified').Plugin<[], import('mdast').Root>}
 */
export default function remarkEncrypt() {
  return (tree, file) => {
    const frontmatter = file.data.astro?.frontmatter;

    // 没有密码则跳过
    if (!frontmatter?.password) return;

    const password = frontmatter.password;

    // 提取正文文本（排除 frontmatter）
    const bodyText = extractBodyText(tree);

    if (!bodyText.trim()) return;

    // 加密正文
    const encrypted = encryptSync(bodyText, password);

    // 清空原始正文，替换为加密数据占位
    tree.children = [
      {
        type: "html",
        value: `<encrypted-content data-encrypted='${JSON.stringify(encrypted)}'></encrypted-content>`,
      },
    ];
  };
}

/**
 * 从 Markdown AST 提取纯文本
 * @param {import('mdast').Root} tree
 * @returns {string}
 */
function extractBodyText(tree) {
  const lines = [];

  for (const node of tree.children) {
    const text = nodeToText(node);
    if (text) lines.push(text);
  }

  return lines.join("\n\n");
}

/**
 * 递归提取节点文本
 * @param {import('mdast').Node} node
 * @returns {string}
 */
function nodeToText(node) {
  if (!node) return "";

  switch (node.type) {
    case "text":
      return node.value || "";
    case "paragraph":
    case "heading":
    case "listItem":
    case "emphasis":
    case "strong":
      return (node.children || []).map(nodeToText).join("");
    case "link":
      const text = (node.children || []).map(nodeToText).join("");
      return node.url ? `[${text}](${node.url})` : text;
    case "code":
      return node.value ? "```\n" + node.value + "\n```" : "";
    case "blockquote":
      return (node.children || []).map(nodeToText).map((l) => "> " + l).join("\n");
    case "list":
      return (node.children || []).map(nodeToText).join("\n");
    case "thematicBreak":
      return "---";
    case "image":
      return `![${node.alt || ""}](${node.url || ""})`;
    case "html":
      return ""; // 跳过 HTML
    default:
      if (node.children) {
        return node.children.map(nodeToText).join("");
      }
      return "";
  }
}
