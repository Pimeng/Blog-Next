import type { FriendLink } from "../types/config";

// 友链配置
export const friendsConfig: FriendLink[] = [
  {
    title: "Astro",
    imgurl: "https://avatars.githubusercontent.com/u/44914786?v=4&s=640",
    desc: "The web framework for content-driven websites. ⭐️ Star to support our work!",
    siteurl: "https://github.com/withastro/astro",
    tags: ["Framework"],
    weight: 100, // 权重，数字越大排序越靠前
    enabled: true, // 是否启用
  },
  {
    title: "Firefly Docs",
    imgurl: "https://docs-firefly.cuteleaf.cn/logo.png",
    desc: "Firefly主题模板文档",
    siteurl: "https://docs-firefly.cuteleaf.cn",
    tags: ["Docs"],
    weight: 99,
    enabled: true,
  },
  {
    title: "Dmocken 的 Phira下载站",
    imgurl: "https://phira.dmocken.top/Phira.png",
    desc: "Phira/Phira-MP 下载站",
    siteurl: "https://phira.dmocken.top",
    tags: ["Download"],
    weight: 98,
    enabled: true,
  },
  {
    title: "Chongxi の咖啡屋",
    imgurl: "https://blog.chongxi.us/images/14.webp",
    desc: "Lose yourself to find yourself",
    siteurl: "https://blog.chongxi.us/",
    tags: ["Blog"],
    weight: 97,
    enabled: true,
  }
];

// 获取启用的友链并按权重排序
export const getEnabledFriends = (): FriendLink[] => {
  return friendsConfig
    .filter((friend) => friend.enabled)
    .sort((a, b) => b.weight - a.weight); // 按权重降序排序
};
