/**
 * admin-config.ts
 * 配置管理页面客户端脚本
 */

interface SocialLink {
  platform: string;
  url: string;
  order: number;
}

interface NavItem {
  label: string;
  href: string;
}

interface TimelineEvent {
  date: string;
  title: string;
  description: string;
}

interface SiteConfig {
  title: string;
  subtitle: string;
  description: string;
  site: string;
  lang: string;
  base: string;
  author: {
    name: string;
    avatar: string;
    bio: string;
    location: string;
  };
  socials: SocialLink[];
  navItems: NavItem[];
  theme: {
    defaultMode: string;
    wallpaperPath: string;
    useExtractedColors: boolean;
  };
  music: {
    enabled: boolean;
    musicDir: string;
    defaultVolume: number;
    autoplay: boolean;
    showLrc: boolean;
  };
  comment: {
    enabled: boolean;
    repo: string;
    repoId: string;
    category: string;
    categoryId: string;
    mapping: string;
    strict: boolean;
    reactionsEnabled: boolean;
    emitMetadata: boolean;
    inputPosition: string;
    lang: string;
  };
  friends: unknown[];
  timeline: TimelineEvent[];
  icp: string | undefined;
  police: string | undefined;
}

const DEFAULT_CONFIG: SiteConfig = {
  title: "果鸽的博客",
  subtitle: "别当欧尼酱了！",
  description: "果鸽的个人博客",
  site: "https://blog.guogepige.dev",
  lang: "zh-CN",
  base: "/",
  author: {
    name: "果鸽",
    avatar: "/avatar.webp",
    bio: "",
    location: "",
  },
  socials: [],
  navItems: [
    { label: "首页", href: "/" },
    { label: "文章", href: "/blog" },
    { label: "友链", href: "/friends" },
    { label: "关于", href: "/about" },
  ],
  theme: {
    defaultMode: "light",
    wallpaperPath: "wallpaper.jpg",
    useExtractedColors: true,
  },
  music: {
    enabled: true,
    musicDir: "src/assets/music",
    defaultVolume: 0.7,
    autoplay: false,
    showLrc: true,
  },
  comment: {
    enabled: true,
    repo: "",
    repoId: "",
    category: "Announcements",
    categoryId: "",
    mapping: "pathname",
    strict: true,
    reactionsEnabled: true,
    emitMetadata: false,
    inputPosition: "top",
    lang: "zh-CN",
  },
  friends: [],
  timeline: [],
  icp: undefined,
  police: undefined,
};

let config: SiteConfig = JSON.parse(JSON.stringify(DEFAULT_CONFIG));

/* ============================================================
   DOM 工具
   ============================================================ */

function $(id: string): HTMLElement | null {
  return document.getElementById(id);
}

function gv(id: string): string {
  return (document.getElementById(id) as HTMLInputElement)?.value ?? "";
}

function gc(id: string): boolean {
  return (document.getElementById(id) as HTMLInputElement)?.checked ?? false;
}

function esc(str: string): string {
  return String(str || "").replace(/"/g, "&quot;").replace(/</g, "&lt;");
}

function showToast(msg: string): void {
  const toast = document.createElement("div");
  toast.textContent = msg;
  toast.style.cssText =
    "position:fixed;bottom:2rem;left:50%;transform:translateX(-50%);padding:0.75rem 1.5rem;border-radius:12px;background:var(--color-theme-accent);color:#fff;font-size:0.9375rem;font-weight:500;z-index:999;animation:fadeIn 0.3s ease;";
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 2000);
}

/* ============================================================
   表单填充
   ============================================================ */

function fillForm(): void {
  setVal("site-title", config.title);
  setVal("site-subtitle", config.subtitle);
  setVal("site-description", config.description);
  setVal("site-url", config.site);
  setVal("site-lang", config.lang);

  setVal("author-name", config.author.name);
  setVal("author-bio", config.author.bio);
  setVal("author-avatar", config.author.avatar);
  setVal("author-location", config.author.location);

  setVal("theme-mode", config.theme.defaultMode);
  setVal("theme-wallpaper", config.theme.wallpaperPath);
  setChecked("theme-extract", config.theme.useExtractedColors);

  setChecked("music-enabled", config.music.enabled);
  setVal("music-volume", String(config.music.defaultVolume));
  setChecked("music-lrc", config.music.showLrc);
  setChecked("music-autoplay", config.music.autoplay);

  setChecked("comment-enabled", config.comment.enabled);
  setVal("comment-repo", config.comment.repo);
  setVal("comment-repoId", config.comment.repoId);
  setVal("comment-category", config.comment.category);
  setVal("comment-categoryId", config.comment.categoryId);
  setVal("comment-mapping", config.comment.mapping);
  setVal("comment-lang", config.comment.lang);
  setVal("comment-inputPosition", config.comment.inputPosition);

  setVal("icp", config.icp || "");
  setVal("police", config.police || "");

  renderSocials();
  renderNav();
  renderTimeline();
}

function setVal(id: string, val: string): void {
  const el = document.getElementById(id) as HTMLInputElement;
  if (el) el.value = val ?? "";
}

function setChecked(id: string, val: boolean): void {
  const el = document.getElementById(id) as HTMLInputElement;
  if (el) el.checked = !!val;
}

/* ============================================================
   动态列表：社交链接
   ============================================================ */

function renderSocials(): void {
  const container = $("socials-container")!;
  container.innerHTML = "";

  config.socials.forEach((s, i) => {
    const item = document.createElement("div");
    item.className = "dynamic-item";
    item.innerHTML = [
      '<div class="form-group"><label>平台</label>',
      '<select data-field="platform">',
      '<option value="github"' + (s.platform === "github" ? " selected" : "") + ">GitHub</option>",
      '<option value="bilibili"' + (s.platform === "bilibili" ? " selected" : "") + ">Bilibili</option>",
      '<option value="twitter"' + (s.platform === "twitter" ? " selected" : "") + ">Twitter</option>",
      '<option value="email"' + (s.platform === "email" ? " selected" : "") + ">Email</option>",
      '<option value="rss"' + (s.platform === "rss" ? " selected" : "") + ">RSS</option>",
      "</select></div>",
      '<div class="form-group" style="flex:2"><label>链接</label>',
      '<input type="text" data-field="url" value="' + esc(s.url) + '" placeholder="https://example.com" /></div>',
      '<button type="button" class="btn-remove" data-index="' + i + '">✕</button>',
    ].join("");
    container.appendChild(item);
  });

  bindDynamicList(container, config.socials, renderSocials);
}

function addSocial(): void {
  config.socials.push({ platform: "github", url: "", order: config.socials.length });
  renderSocials();
}

/* ============================================================
   动态列表：导航
   ============================================================ */

function renderNav(): void {
  const container = $("nav-container")!;
  container.innerHTML = "";

  config.navItems.forEach((n, i) => {
    const item = document.createElement("div");
    item.className = "dynamic-item";
    item.innerHTML = [
      '<div class="form-group"><label>名称</label>',
      '<input type="text" data-field="label" value="' + esc(n.label) + '" /></div>',
      '<div class="form-group"><label>路径</label>',
      '<input type="text" data-field="href" value="' + esc(n.href) + '" placeholder="/" /></div>',
      '<button type="button" class="btn-remove" data-index="' + i + '">✕</button>',
    ].join("");
    container.appendChild(item);
  });

  bindDynamicList(container, config.navItems, renderNav);
}

function addNav(): void {
  config.navItems.push({ label: "新页面", href: "/" });
  renderNav();
}

/* ============================================================
   动态列表：时间轴
   ============================================================ */

function renderTimeline(): void {
  const container = $("timeline-container")!;
  container.innerHTML = "";

  config.timeline.forEach((t, i) => {
    const item = document.createElement("div");
    item.className = "dynamic-item";
    item.innerHTML = [
      '<div class="form-group"><label>日期</label>',
      '<input type="text" data-field="date" value="' + esc(t.date) + '" placeholder="2024" /></div>',
      '<div class="form-group"><label>标题</label>',
      '<input type="text" data-field="title" value="' + esc(t.title) + '" /></div>',
      '<div class="form-group" style="flex:2"><label>描述</label>',
      '<input type="text" data-field="description" value="' + esc(t.description || "") + '" /></div>',
      '<button type="button" class="btn-remove" data-index="' + i + '">✕</button>',
    ].join("");
    container.appendChild(item);
  });

  bindDynamicList(container, config.timeline, renderTimeline);
}

function addTimeline(): void {
  config.timeline.push({ date: "2024", title: "新事件", description: "" });
  renderTimeline();
}

/* ============================================================
   通用动态列表绑定
   ============================================================ */

function bindDynamicList(container: HTMLElement, arr: unknown[], rerender: () => void): void {
  container.querySelectorAll(".btn-remove").forEach((btn) => {
    btn.addEventListener("click", () => {
      arr.splice(Number((btn as HTMLElement).dataset.index), 1);
      rerender();
    });
  });

  container.querySelectorAll("input, select").forEach((el) => {
    el.addEventListener("change", () => {
      const item = (el as HTMLElement).closest(".dynamic-item");
      if (!item) return;
      const idx = Array.from(container.children).indexOf(item);
      const field = (el as HTMLElement).dataset.field;
      if (field && arr[idx]) {
        (arr[idx] as Record<string, unknown>)[field] = (el as HTMLInputElement).value;
      }
    });
  });
}

/* ============================================================
   收集表单数据
   ============================================================ */

function collectForm(): void {
  config.title = gv("site-title");
  config.subtitle = gv("site-subtitle");
  config.description = gv("site-description");
  config.site = gv("site-url");
  config.lang = gv("site-lang");

  config.author.name = gv("author-name");
  config.author.bio = gv("author-bio");
  config.author.avatar = gv("author-avatar");
  config.author.location = gv("author-location");

  config.theme.defaultMode = gv("theme-mode");
  config.theme.wallpaperPath = gv("theme-wallpaper");
  config.theme.useExtractedColors = gc("theme-extract");

  config.music.enabled = gc("music-enabled");
  config.music.defaultVolume = parseFloat(gv("music-volume")) || 0.7;
  config.music.showLrc = gc("music-lrc");
  config.music.autoplay = gc("music-autoplay");

  config.comment.enabled = gc("comment-enabled");
  config.comment.repo = gv("comment-repo");
  config.comment.repoId = gv("comment-repoId");
  config.comment.category = gv("comment-category");
  config.comment.categoryId = gv("comment-categoryId");
  config.comment.mapping = gv("comment-mapping");
  config.comment.lang = gv("comment-lang");
  config.comment.inputPosition = gv("comment-inputPosition");

  config.icp = gv("icp") || undefined;
  config.police = gv("police") || undefined;
}

/* ============================================================
   生成配置代码
   ============================================================ */

function q(s: string): string {
  return '"' + s.replace(/"/g, '\\"') + '"';
}

function generateCode(): string {
  collectForm();

  const socialsLines = config.socials.map(
    (s) => "    { platform: " + q(s.platform) + ", url: " + q(s.url) + ", order: " + (s.order ?? 0) + " }"
  );

  const navLines = config.navItems.map(
    (n) => "    { label: " + q(n.label) + ", href: " + q(n.href) + " }"
  );

  const timelineLines = config.timeline.map(
    (t) =>
      "    {\n" +
      '      date: "' + t.date + '",\n' +
      '      title: "' + t.title + '",\n' +
      '      description: "' + (t.description || "") + '",\n' +
      "    }"
  );

  const icpVal = config.icp ? q(config.icp) : "undefined";
  const policeVal = config.police ? q(config.police) : "undefined";

  const lines = [
    "export const siteConfig = siteConfigSchema.parse({",
    "  title: " + q(config.title) + ",",
    "  subtitle: " + q(config.subtitle) + ",",
    "  description: " + q(config.description) + ",",
    "  lang: " + q(config.lang) + ",",
    "  site: " + q(config.site) + ",",
    '  base: "/",',
    "",
    "  author: {",
    "    name: " + q(config.author.name) + ",",
    "    avatar: " + q(config.author.avatar) + ",",
    "    bio: " + q(config.author.bio) + ",",
    "    location: " + q(config.author.location) + ",",
    "  },",
    "",
    "  socials: [",
    socialsLines.join(",\n"),
    "  ],",
    "",
    "  navItems: [",
    navLines.join(",\n"),
    "  ],",
    "",
    "  theme: {",
    '    defaultMode: "' + config.theme.defaultMode + '",',
    '    wallpaperPath: "' + config.theme.wallpaperPath + '",',
    "    useExtractedColors: " + config.theme.useExtractedColors + ",",
    "  },",
    "",
    "  music: {",
    "    enabled: " + config.music.enabled + ",",
    '    musicDir: "src/assets/music",',
    "    defaultVolume: " + config.music.defaultVolume + ",",
    "    autoplay: " + config.music.autoplay + ",",
    "    showLrc: " + config.music.showLrc + ",",
    "  },",
    "",
    "  comment: {",
    "    enabled: " + config.comment.enabled + ",",
    "    repo: " + q(config.comment.repo) + ",",
    "    repoId: " + q(config.comment.repoId) + ",",
    "    category: " + q(config.comment.category) + ",",
    "    categoryId: " + q(config.comment.categoryId) + ",",
    "    mapping: " + q(config.comment.mapping) + ",",
    "    strict: true,",
    "    reactionsEnabled: true,",
    "    emitMetadata: false,",
    "    inputPosition: " + q(config.comment.inputPosition) + ",",
    "    lang: " + q(config.comment.lang) + ",",
    "  },",
    "",
    "  friends: [],",
    "",
    "  timeline: [",
    timelineLines.join(",\n"),
    "  ],",
    "",
    "  icp: " + icpVal + ",",
    "  police: " + policeVal + ",",
    "});",
  ];

  return lines.join("\n");
}

/* ============================================================
   事件绑定
   ============================================================ */

function init(): void {
  $("btn-generate")?.addEventListener("click", () => {
    const code = generateCode();
    const outputCode = $("output-code") as HTMLTextAreaElement;
    outputCode.value = code;
    ($("output-modal") as HTMLDialogElement).showModal();
  });

  $("modal-close")?.addEventListener("click", () => {
    ($("output-modal") as HTMLDialogElement).close();
  });

  $("btn-copy")?.addEventListener("click", async () => {
    const code = ($("output-code") as HTMLTextAreaElement).value;
    await navigator.clipboard.writeText(code);
    showToast("✅ 已复制到剪贴板");
  });

  $("btn-download")?.addEventListener("click", () => {
    const code = ($("output-code") as HTMLTextAreaElement).value;
    const blob = new Blob([code], { type: "text/plain" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "site-config.ts";
    a.click();
    URL.revokeObjectURL(a.href);
  });

  $("btn-reset")?.addEventListener("click", () => {
    if (confirm("确定重置为默认配置？")) {
      config = JSON.parse(JSON.stringify(DEFAULT_CONFIG));
      fillForm();
      showToast("↩️ 已重置");
    }
  });

  $("btn-export")?.addEventListener("click", () => {
    collectForm();
    const blob = new Blob([JSON.stringify(config, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "site-config.json";
    a.click();
    URL.revokeObjectURL(a.href);
  });

  $("import-file")?.addEventListener("change", (e) => {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        config = JSON.parse(reader.result as string);
        fillForm();
        showToast("✅ 配置已导入");
      } catch {
        alert("JSON 格式错误");
      }
    };
    reader.readAsText(file);
  });

  $("btn-add-social")?.addEventListener("click", addSocial);
  $("btn-add-nav")?.addEventListener("click", addNav);
  $("btn-add-timeline")?.addEventListener("click", addTimeline);

  $("output-modal")?.addEventListener("click", (e) => {
    if (e.target === $("output-modal")) {
      ($("output-modal") as HTMLDialogElement).close();
    }
  });

  fillForm();
}

init();
