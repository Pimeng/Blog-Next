import type { FriendLink, FriendsPageConfig } from "../types/config";

// 可以在src/content/spec/friends.md中编写友链页面下方的自定义内容

// 友链页面配置
export const friendsPageConfig: FriendsPageConfig = {
	// 页面标题，如果留空则使用 i18n 中的翻译
	title: "",

	// 页面描述文本，如果留空则使用 i18n 中的翻译
	description: "",

	// 是否显示底部自定义内容（friends.mdx 中的内容）
	showCustomContent: true,

	// 是否显示评论区，需要先在commentConfig.ts启用评论系统
	showComment: false,

	// 是否开启随机排序配置，如果开启，就会忽略权重，构建时进行一次随机排序
	randomizeSort: false,
};

// 友链配置
export const friendsConfig: FriendLink[] = [
  {
    title: "夏夜流萤",
    imgurl: "https://weavatar.com/avatar/d252655d40d6874417a720bad0a6c5f77f8f6a1fd2f882f8f338402dc37e4190?s=640",
    desc: "飞萤之火自无梦的长夜亮起，绽放在终竟的明天。",
    siteurl: "https://blog.cuteleaf.cn",
    tags: ["Blog"],
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
    imgurl: "https://xice.cx/images/14.webp",
    desc: "Lose yourself to find yourself",
    siteurl: "https://xice.cx/",
    tags: ["Blog"],
    weight: 97,
    enabled: true,
  },
  {
    title: "chuzouX Blog",
    imgurl: "https://q2.qlogo.cn/headimg_dl?dst_uin=3451860760&spec=0",
    desc: "技术分享与实践",
    siteurl: "https://chuzoux.top/",
    tags: ["Blog"],
    weight: 96,
    enabled: true,
  },
  {
    title: "星晨伴月的个人博客",
    imgurl: "https://q1.qlogo.cn/g?b=qq&nk=7618557&s=640",
    desc: "飞萤扑火，向死而生",
    siteurl: "https://xcby.top",
    tags: ["Blog"],
    weight: 95,
    enabled: true,
  },
  {
    title: "HINS's Blog",
    imgurl: "https://avatars.githubusercontent.com/u/105108428?v=4",
    desc: "HINS的温馨小猫窝",
    siteurl: "https://blog.hinswu.top",
    tags: ["Blog"],
    weight: 94,
    enabled: true,
  },
  {
    title: "雨核の博客",
    imgurl: "https://q1.qlogo.cn/g?b=qq&nk=105823395&s=640",
    desc: "这里是雨核的博客",
    siteurl: "https://blog.baka86.love",
    tags: ["Blog"],
    weight: 93,
    enabled: true,
  }
];

// 获取启用的友链并进行排序
export const getEnabledFriends = (): FriendLink[] => {
	const friends = friendsConfig.filter((friend) => friend.enabled);

	if (friendsPageConfig.randomizeSort) {
		return friends.sort(() => Math.random() - 0.5);
	}

	return friends.sort((a, b) => b.weight - a.weight);
};
