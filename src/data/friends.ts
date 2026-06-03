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

const friendsData: FriendGroups = {};

export default friendsData;
