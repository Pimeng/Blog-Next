import { adConfig1, adConfig2 } from "./config/adConfig";
import { fontConfig } from "./config/fontConfig";
import { sidebarLayoutConfig } from "./config/sidebarConfig";
import type {
	AnnouncementConfig,
	CommentConfig,
	ExpressiveCodeConfig,
	FooterConfig,
	LicenseConfig,
	ProfileConfig,
	SakuraConfig,
	SiteConfig,
} from "./types/config";

// 更多配置在/src/config/目录下
// 路径以 '/' 开头，则相对于 /public 目录

// 定义站点语言
const SITE_LANG = "zh_CN"; // 语言代码，例如：'en', 'zh_CN', 'ja' 等。

export const siteConfig: SiteConfig = {
	title: "Blog Next",
	subtitle: "Pimeng's Blog",
	keywords: [
		"皮梦的个人博客",
		"Pimeng's Blog",
		"Pimeng Blog",
	],

	lang: SITE_LANG,

	themeColor: {
		hue: 250, // 主题色的默认色相，范围从 0 到 360。例如：红色：0，青色：200，蓝绿色：250，粉色：345
		fixed: false, // 对访问者隐藏主题色选择器
		defaultMode: "system", // 默认模式："light" 浅色，"dark" 深色，"system" 跟随系统
	},

	favicon: [
		// 留空以使用默认 favicon
		{
			src: "/assets/images/favicon.ico", // 图标文件路径
			theme: "light", // 可选，指定主题 'light' | 'dark'
			sizes: "32x32", // 可选，图标大小
		},
	],

	// 网站Logo
	// logoIcon 支持三种类型：Astro图标库，本地图片，网络图片
	// { type: "icon", value: "material-symbols:home-pin-outline" }
	// { type: "image", value: "/assets/images/logo.webp", alt: "Firefly Logo" }
	// { type: "image", value: "https://example.com/logo.png", alt: "Firefly Logo" }
	logoIcon: {
		type: "image",
		value: "/assets/images/favicon.ico",
		alt: "PM",
	},

	// 追番配置
	bangumi: {
		userId: "0", // 在此处设置你的Bangumi用户ID
	},

	// 文章页底部的“上次编辑时间”卡片开关
	showLastModified: true,

	// OpenGraph图片功能,注意开启后要渲染很长时间，不建议本地调试的时候开启
	generateOgImages: false,

	backgroundWallpaper: {
		// 是否启用背景壁纸功能
		enable: true,
		// 壁纸模式："banner" Banner壁纸模式，"overlay" 全屏透明覆盖模式
		mode: "banner",

		// 背景图片配置
		src: {
			// 桌面背景图片
			desktop: "/assets/images/d1.webp",
			// 移动背景图片
			mobile: "/assets/images/m1.webp",
		},

		// 图片位置
		// 支持所有CSS object-position值，如: 'top', 'center', 'bottom', 'left top', 'right bottom', '25% 75%', '10px 20px'..
		// 如果不知道怎么配置百分百之类的配置，推荐直接使用：'center'居中，'top'顶部居中，'bottom' 底部居中，'left'左侧居中，'right'右侧居中
		position: "10% 20%",

		// Banner模式特有配置
		banner: {
			homeText: {
				// 主页显示自定义文本（全局开关）
				enable: true,
				// 主页横幅主标题
				title: "这里是皮梦！",
				// 主页横幅副标题
				subtitle: [
					"一个杂鱼皮梦", 
					"全栈开发者",
					"正在学习使用AI",
				],
				typewriter: {
					enable: true, // 启用副标题打字机效果
					speed: 100, // 打字速度（毫秒）
					deleteSpeed: 50, // 删除速度（毫秒）
					pauseTime: 2000, // 完全显示后的暂停时间（毫秒）
				},
			},
			credit: {
				enable: {
					desktop: false, // 桌面端显示横幅图片来源文本
					mobile: false, // 移动端显示横幅图片来源文本
				},
				text: {
					desktop: "", // 桌面端要显示的来源文本
					mobile: "Mobile Credit", // 移动端要显示的来源文本
				},
				url: {
					desktop: "", // 桌面端原始艺术品或艺术家页面的 URL 链接
					mobile: "", // 移动端原始艺术品或艺术家页面的 URL 链接
				},
			},
			navbar: {
				transparentMode: "semifull", // 导航栏透明模式："semi" 半透明加圆角，"full" 完全透明，"semifull" 动态透明
			},
			waves: {
				enable: {
					desktop: true, // 桌面端启用波浪动画效果
					mobile: true, // 移动端启用波浪动画效果
				},
			},
		},

		// 全屏透明覆盖模式特有配置
		overlay: {
			zIndex: -1, // 层级，确保壁纸在背景层
			opacity: 0.8, // 壁纸透明度
			blur: 1, // 背景模糊程度
		},
	},

	// 目录功能
	toc: {
		// 目录功能开关
		enable: true,
		// 目录深度，1-3，1 表示只显示 h1 标题，2 表示显示 h1 和 h2 标题，依此类推
		// depth在新版已弃用
		depth: 3,
	},

	// 字体配置
	// 在src/config/fontConfig.ts中配置具体字体
	font: fontConfig,
};

export const profileConfig: ProfileConfig = {
	avatar: "/assets/images/avatar.webp",
	name: "皮梦",
	bio: "这里是皮梦！",
	links: [
		{
			name: "Bilibli",
			icon: "fa6-brands:bilibili",
			url: "https://space.bilibili.com/36191664",
		},
		{
			name: "GitHub",
			icon: "fa6-brands:github",
			url: "https://github.com/Pimeng",
		},
	],
};

export const licenseConfig: LicenseConfig = {
	enable: true,
	name: "CC BY-NC-SA 4.0",
	url: "https://creativecommons.org/licenses/by-nc-sa/4.0/",
};

export const expressiveCodeConfig: ExpressiveCodeConfig = {
	// 注意：某些样式（如背景颜色）已被覆盖，请参阅 astro.config.mjs 文件。
	// 请选择深色主题，因为此博客主题目前仅支持深色背景
	theme: "github-dark",
};

export const commentConfig: CommentConfig = {
	enable: false, // 启用评论功能。当设置为 false 时，评论组件将不会显示在文章区域。
	twikoo: {
		envId: "https://twikoo.vercel.app",
		lang: "en", // 设置 Twikoo 评论系统语言为英文
	},
};

export const announcementConfig: AnnouncementConfig = {
	title: "公告", // 公告标题
	content: "test", // 公告内容
	closable: true, // 允许用户关闭公告
	link: {
		enable: true, // 启用链接
		text: "了解更多", // 链接文本
		url: "/about/", // 链接 URL
		external: false, // 内部链接
	},
};

export const footerConfig: FooterConfig = {
	enable: true, // 是否启用Footer HTML注入功能
};

// 直接编辑 FooterConfig.html 文件来添加备案号等自定义内容

export const sakuraConfig: SakuraConfig = {
	enable: false, // 默认关闭樱花特效
	sakuraNum: 21, // 樱花数量
	limitTimes: -1, // 樱花越界限制次数，-1为无限循环
	size: {
		min: 0.5, // 樱花最小尺寸倍数
		max: 1.1, // 樱花最大尺寸倍数
	},
	speed: {
		horizontal: {
			min: -1.7, // 水平移动速度最小值
			max: -1.2, // 水平移动速度最大值
		},
		vertical: {
			min: 1.5, // 垂直移动速度最小值
			max: 2.2, // 垂直移动速度最大值
		},
		rotation: 0.03, // 旋转速度
	},
	zIndex: 100, // 层级，确保樱花在合适的层级显示
};

// 导出所有配置的统一接口
export const widgetConfigs = {
	profile: profileConfig,
	announcement: announcementConfig,
	layout: sidebarLayoutConfig,
	sakura: sakuraConfig,
	advertisement: adConfig1,
	advertisement2: adConfig2,
} as const;

export const umamiConfig = {
	enabled: false, // 是否显示Umami统计
	apiKey: "api_XXXXXXXXXX", // 你的API密钥
	baseUrl: "https://api.umami.is", // Umami Cloud API地址
	scripts: `
<script defer src="XXXX.XXX" data-website-id="ABCD1234"></script>
  `.trim(), // 上面填你要插入的Script,不用再去Layout中插入
} as const;
