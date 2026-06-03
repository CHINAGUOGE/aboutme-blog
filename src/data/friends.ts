/**
 * friends.ts
 * 友链数据
 *
 * 添加友链：在对应分组下添加新条目即可。
 * 字段说明：
 *   name: 必填，显示名称
 *   avatar: 必填，头像 URL
 *   url: 必填，博客链接
 *   description: 可选，简介
 */

export interface FriendItem {
  name: string;
  avatar: string;
  url: string;
  description?: string;
}

export interface FriendGroups {
  [group: string]: FriendItem[];
}

const friendsData: FriendGroups = {
  小伙伴: [
    {
      name: "示例友链 A",
      avatar: "https://api.dicebear.com/7.x/fun-emoji/svg?seed=alice",
      url: "https://example.com",
      description: "热爱前端开发的小伙伴 ✨",
    },
    {
      name: "示例友链 B",
      avatar: "https://api.dicebear.com/7.x/fun-emoji/svg?seed=bob",
      url: "https://example.org",
      description: "全栈开发者，喜欢折腾新技术",
    },
    {
      name: "示例友链 C",
      avatar: "https://api.dicebear.com/7.x/fun-emoji/svg?seed=charlie",
      url: "https://example.net",
      description: "设计 & 前端，二次元爱好者",
    },
  ],
  友情链接: [
    {
      name: "Astro 官方",
      avatar: "https://api.dicebear.com/7.x/shapes/svg?seed=astro",
      url: "https://astro.build",
      description: "构建快速、内容驱动的网站",
    },
    {
      name: "Svelte 官方",
      avatar: "https://api.dicebear.com/7.x/shapes/svg?seed=svelte",
      url: "https://svelte.dev",
      description: "Cybernetically enhanced web apps",
    },
  ],
};

export default friendsData;
