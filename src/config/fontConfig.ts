// 字体配置
export const fontConfig = {
	// 是否启用自定义字体功能
	enable: true,
	// 是否预加载字体文件
	// 注意：预加载会阻塞页面渲染，对于大体积本地字体建议关闭，让浏览器按需加载
	preload: false,
	// 当前选择的字体，支持多个字体组合
	selected: ["inter","misans-regular"],

	// 字体列表
	// 推荐使用可靠的 CDN 服务商提供的字体链接，它天然做了按需分片加载，且性能较好
	//
	// 也可以使用本地字体文件，需自行进行字体子集化处理，否则会因为字体文件庞大增加带宽负担导致页面加载缓慢甚至无法加载
	// 如果进行字体子集化处理，会导致动态内容（如评论，Bangumi等）无法正确显示字体，因此不推荐使用本地字体文件
	fonts: {
		// 系统字体
		system: {
			id: "system",
			name: "系统字体",
			src: "", // 系统字体无需 src
			family:
				"system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif",
		},

		// Google Fonts - Zen Maru Gothic
		"zen-maru-gothic": {
			id: "zen-maru-gothic",
			name: "Zen Maru Gothic",
			src: "https://fonts.googleapis.com/css2?family=Zen+Maru+Gothic:wght@300;400;500;700;900&display=swap",
			family: "Zen Maru Gothic",
			display: "swap" as const,
		},

		// Inter（本地自托管 latin 子集）
		// 由 scripts/split-fonts.js 从 @fontsource/inter 生成，
		// src 指向本地生成的样式表（含各字重 @font-face），不再依赖 Google Fonts
		inter: {
			id: "inter",
			name: "Inter",
			src: "/assets/fonts/Inter/result.css",
			family: "Inter",
			display: "swap" as const,
		},

		// 小米字体 - MiSans（本地分片按需加载）
		// 由 scripts/split-fonts.js 用 cn-font-split 切分，src 指向生成的
		// result.css（含上百个带 unicode-range 的 @font-face），浏览器只下载
		// 当前页面实际用到的字形分片，弱网下显著降低首屏字体体积。
		// 重新切分：pnpm fonts:split（源字体位于 fonts-src/MiSans-Regular.woff2）
		"misans-regular": {
			id: "misans-regular",
			name: "MiSans",
			src: "/assets/fonts/MiSans/result.css",
			family: "MiSans",
			display: "swap" as const,
		},
	},

	// 全局字体回退
	fallback: [
		"system-ui",
		"-apple-system",
		"BlinkMacSystemFont",
		"Segoe UI",
		"Roboto",
		"sans-serif",
	],
};
