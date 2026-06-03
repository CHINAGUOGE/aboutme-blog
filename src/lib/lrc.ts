/**
 * lrc.ts
 * LRC 歌词解析器
 *
 * 解析标准 LRC 格式歌词为时间-文本对数组。
 * 支持：
 *   - 标准时间标签 [mm:ss.xx]
 *   - 多时间标签共享一行歌词
 *   - 元数据标签（ti, ar, al, by 等，自动忽略）
 */

/** 解析后的歌词行 */
export interface LrcLine {
  /** 时间（秒） */
  time: number;
  /** 歌词文本 */
  text: string;
}

/** 解析结果 */
export interface LrcData {
  /** 元数据 */
  meta: Record<string, string>;
  /** 歌词行（按时间排序） */
  lines: LrcLine[];
}

/** 时间标签正则：[mm:ss.xx] 或 [mm:ss] */
const TIME_TAG_RE = /\[(\d{1,3}):(\d{2})(?:[.:](\d{2,3}))?\]/g;

/** 元数据标签正则 */
const META_TAG_RE = /^\[([a-z]+):(.+)\]$/;

/**
 * 解析 LRC 歌词文本
 * @param lrcText - 原始 LRC 文本
 * @returns 解析后的歌词数据
 */
export function parseLrc(lrcText: string): LrcData {
  const meta: Record<string, string> = {};
  const lines: LrcLine[] = [];

  for (const rawLine of lrcText.split("\n")) {
    const line = rawLine.trim();
    if (!line) continue;

    // 检查是否为纯元数据行（无歌词文本）
    const metaMatch = line.match(META_TAG_RE);
    if (metaMatch && !line.includes("]") || (metaMatch && line.lastIndexOf("]") === line.indexOf("]") + metaMatch[1].length + metaMatch[2].length + 2)) {
      // 只有当行内只有一个时间标签且匹配元数据格式时
      const singleTagLine = /^\[[a-z]+:.+\]$/.test(line);
      if (singleTagLine) {
        meta[metaMatch[1]] = metaMatch[2].trim();
        continue;
      }
    }

    // 提取所有时间标签
    const times: number[] = [];
    let lastTimeIndex = 0;
    let match: RegExpExecArray | null;

    TIME_TAG_RE.lastIndex = 0;
    while ((match = TIME_TAG_RE.exec(line)) !== null) {
      const minutes = parseInt(match[1], 10);
      const seconds = parseInt(match[2], 10);
      const centis = match[3] ? parseInt(match[3].padEnd(3, "0"), 10) : 0;

      const time = minutes * 60 + seconds + centis / 1000;
      times.push(time);
      lastTimeIndex = match.index + match[0].length;
    }

    if (times.length === 0) continue;

    // 提取歌词文本（时间标签之后的内容）
    const text = line.slice(lastTimeIndex).trim();

    // 为每个时间标签创建一行
    for (const time of times) {
      lines.push({ time, text });
    }
  }

  // 按时间排序
  lines.sort((a, b) => a.time - b.time);

  return { meta, lines };
}

/**
 * 查找当前时间对应的歌词行索引
 * @param lines - 歌词行数组
 * @param currentTime - 当前播放时间（秒）
 * @returns 当前行索引，-1 表示未找到
 */
export function findCurrentLine(lines: LrcLine[], currentTime: number): number {
  if (lines.length === 0) return -1;

  // 从后往前找第一个时间 <= currentTime 的行
  for (let i = lines.length - 1; i >= 0; i--) {
    if (lines[i].time <= currentTime) {
      return i;
    }
  }

  return 0;
}
