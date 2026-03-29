import type { ProfileConfig } from "../types/config";

export const profileConfig: ProfileConfig = {
	// 头像
	// 图片路径支持三种格式：
	// 1. public 目录（以 "/" 开头，不优化）："/assets/images/avatar.webp"
	// 2. src 目录（不以 "/" 开头，自动优化但会增加构建时间，推荐）："assets/images/avatar.webp"
	// 3. 远程 URL："https://example.com/avatar.jpg"
	avatar: "https://thirdqq.qlogo.cn/ek_qqapp/AQBYdE3HOBBJWzCia3BjOePcJ5icmcwpTW0cEWXlZsib48hLvjwq5KYMmdBlpKtRB3cqt3Kmgfb5v69WGKRvB3Q6av6EV7Jfmc9n5SK9ZRxnAchmKJBILw/640",

	// 名字
	name: "Pimeng",

	// 个人签名
	bio: "你吼！我系皮梦！",

	// 链接配置
	// 已经预装的图标集：fa7-brands，fa7-regular，fa7-solid，material-symbols，simple-icons
	// 访问https://icones.js.org/ 获取图标代码，
	// 如果想使用尚未包含相应的图标集，则需要安装它
	// `pnpm add @iconify-json/<icon-set-name>`
	// showName: true 时显示图标和名称，false 时只显示图标
	links: [
		{
			name: "qq",
			icon: "fa7-brands:qq",
			url: "https://qm.qq.com/cgi-bin/qm/qr?k=hsFXJNxXDUkOKvBdb_cQWN0FoPJI2mvZ&s=1",
			showName: false,
		},
		{
			name: "GitHub",
			icon: "fa7-brands:github",
			url: "https://github.com/Pimeng",
			showName: false,
		},
		{
			name: "Email",
			icon: "fa7-solid:envelope",
			url: "mailto:i@pmya.xyz",
			showName: false,
		},
		{
			name: "RSS",
			icon: "fa7-solid:rss",
			url: "/rss/",
			showName: false,
		},
	],
};
