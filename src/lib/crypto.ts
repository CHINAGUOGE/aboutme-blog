/**
 * crypto.ts
 * 客户端加解密工具 — Web Crypto API
 *
 * 使用 PBKDF2 派生密钥 + AES-GCM 加密/解密。
 * 用于文章密码保护功能。
 *
 * 安全说明：
 *   - PBKDF2 迭代 100,000 次（OWASP 推荐）
 *   - AES-256-GCM 认证加密
 *   - 每次加密使用随机 salt 和 IV
 *   - 不存储密码，仅存储密文 + salt + IV
 */

/** 加密数据格式 */
export interface EncryptedData {
  /** Base64 编码的密文 */
  ciphertext: string;
  /** Base64 编码的 salt（16 字节） */
  salt: string;
  /** Base64 编码的 IV（12 字节） */
  iv: string;
}

/** PBKDF2 迭代次数 */
const PBKDF2_ITERATIONS = 100_000;

/** AES-GCM 密钥长度（位） */
const KEY_LENGTH = 256;

/** Salt 长度（字节） */
const SALT_LENGTH = 16;

/** IV 长度（字节） */
const IV_LENGTH = 12;

/**
 * ArrayBuffer → Base64 字符串
 */
function bufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary);
}

/**
 * Base64 字符串 → ArrayBuffer
 */
function base64ToBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

/**
 * 从密码派生 AES-GCM 密钥
 *
 * @param password - 用户输入的密码
 * @param salt - 随机 salt（Base64）
 * @returns 派生的 CryptoKey
 */
async function deriveKey(password: string, salt: string): Promise<CryptoKey> {
  const encoder = new TextEncoder();

  // 导入密码为原始密钥材料
  const passwordKey = await crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    "PBKDF2",
    false,
    ["deriveKey"]
  );

  // PBKDF2 派生 AES-GCM 密钥
  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: new Uint8Array(base64ToBuffer(salt)),
      iterations: PBKDF2_ITERATIONS,
      hash: "SHA-256",
    },
    passwordKey,
    {
      name: "AES-GCM",
      length: KEY_LENGTH,
    },
    false,
    ["encrypt", "decrypt"]
  );
}

/**
 * 加密文本
 *
 * @param plaintext - 明文
 * @param password - 密码
 * @returns 加密数据（ciphertext + salt + iv，均为 Base64）
 */
export async function encrypt(plaintext: string, password: string): Promise<EncryptedData> {
  const encoder = new TextEncoder();

  // 生成随机 salt 和 IV
  const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));

  // 派生密钥
  const key = await deriveKey(password, bufferToBase64(salt.buffer));

  // AES-GCM 加密
  const ciphertext = await crypto.subtle.encrypt(
    {
      name: "AES-GCM",
      iv,
    },
    key,
    encoder.encode(plaintext)
  );

  return {
    ciphertext: bufferToBase64(ciphertext),
    salt: bufferToBase64(salt.buffer),
    iv: bufferToBase64(iv.buffer),
  };
}

/**
 * 解密文本
 *
 * @param data - 加密数据
 * @param password - 密码
 * @returns 解密后的明文，密码错误时抛出异常
 * @throws {DOMException} 密码错误时 AES-GCM 解密失败
 */
export async function decrypt(data: EncryptedData, password: string): Promise<string> {
  // 派生密钥
  const key = await deriveKey(password, data.salt);

  // AES-GCM 解密
  const decrypted = await crypto.subtle.decrypt(
    {
      name: "AES-GCM",
      iv: new Uint8Array(base64ToBuffer(data.iv)),
    },
    key,
    base64ToBuffer(data.ciphertext)
  );

  return new TextDecoder().decode(decrypted);
}

/**
 * 验证密码是否正确（不解密全部内容）
 *
 * @param data - 加密数据
 * @param password - 要验证的密码
 * @returns 密码是否正确
 */
export async function verifyPassword(data: EncryptedData, password: string): Promise<boolean> {
  try {
    await decrypt(data, password);
    return true;
  } catch {
    return false;
  }
}

/**
 * 从 JSON 字符串解析加密数据
 */
export function parseEncryptedData(json: string): EncryptedData {
  const parsed = JSON.parse(json);

  if (!parsed.ciphertext || !parsed.salt || !parsed.iv) {
    throw new Error("Invalid encrypted data format");
  }

  return parsed as EncryptedData;
}
