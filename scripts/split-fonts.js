// 字体分片脚本
// -------------------------------------------------------------------------
// 1. MiSans（中文正文字体）：用 cn-font-split 切成上百个带 unicode-range 的
//    小 woff2 分片 + result.css，浏览器按需只下载当前页面用到的字形，
//    弱网下由原来的 4.7MB 单文件降到每页几十 KB。
// 2. Inter（Latin 字体）：从自托管的 @fontsource/inter 复制 latin 子集 woff2，
//    生成本地 result.css，彻底去掉对 Google Fonts 的外链依赖。
//
// 产物输出到 public/assets/fonts/{MiSans,Inter}/ 并提交到仓库。
// 字体源文件放在仓库根 fonts-src/（不参与部署）。
// 运行：pnpm fonts:split
// -------------------------------------------------------------------------

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { fontSplit } from "cn-font-split";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const fontsOut = path.join(root, "public", "assets", "fonts");

// @fontsource/inter latin 子集的 unicode-range（基础拉丁 + 常用标点/符号）
const INTER_LATIN_RANGE =
	"U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD";
const INTER_WEIGHTS = [300, 400, 500, 600, 700];

/** 清空目录（存在则递归删除后重建） */
function resetDir(dir) {
	fs.rmSync(dir, { recursive: true, force: true });
	fs.mkdirSync(dir, { recursive: true });
}

async function splitMiSans() {
	const src = path.join(root, "fonts-src", "MiSans-Regular.woff2");
	const out = path.join(fontsOut, "MiSans");

	if (!fs.existsSync(src)) {
		throw new Error(`[split-fonts] 找不到 MiSans 源字体: ${src}`);
	}

	console.log("[split-fonts] 正在分片 MiSans ...");
	resetDir(out);

	await fontSplit({
		input: src,
		outDir: out,
		targetType: "woff2",
		// 关闭汇报产物（reporter.bin / 预览图），保持输出目录干净
		reporter: false,
		css: {
			fontFamily: "MiSans",
			// 用权重范围覆盖所有字重，保证中文在任意 font-weight 下都用 MiSans
			fontWeight: "100 900",
			fontStyle: "normal",
			fontDisplay: "swap",
		},
		silent: true,
	});

	// 清除 cn-font-split 生成的预览/汇报文件，只保留 woff2 分片与 result.css
	for (const stray of ["index.html", "index.proto"]) {
		fs.rmSync(path.join(out, stray), { force: true });
	}

	const shardCount = fs
		.readdirSync(out)
		.filter((f) => f.endsWith(".woff2")).length;
	console.log(`[split-fonts] MiSans 完成：${shardCount} 个分片 -> ${path.relative(root, out)}`);
}

function buildInter() {
	const filesDir = path.join(
		root,
		"node_modules",
		"@fontsource",
		"inter",
		"files",
	);
	const out = path.join(fontsOut, "Inter");

	if (!fs.existsSync(filesDir)) {
		throw new Error(
			`[split-fonts] 找不到 @fontsource/inter 文件目录，请先安装依赖: ${filesDir}`,
		);
	}

	console.log("[split-fonts] 正在生成 Inter latin 子集 ...");
	resetDir(out);

	let css = "/* Inter latin 子集，由 scripts/split-fonts.js 从 @fontsource/inter 生成 */\n";
	for (const weight of INTER_WEIGHTS) {
		const file = `inter-latin-${weight}-normal.woff2`;
		const srcFile = path.join(filesDir, file);
		if (!fs.existsSync(srcFile)) {
			console.warn(`[split-fonts] 跳过缺失的 Inter 字重文件: ${file}`);
			continue;
		}
		fs.copyFileSync(srcFile, path.join(out, file));
		css +=
			`@font-face{` +
			`font-family:"Inter";` +
			`font-style:normal;` +
			`font-display:swap;` +
			`font-weight:${weight};` +
			`src:url("./${file}") format("woff2");` +
			`unicode-range:${INTER_LATIN_RANGE};` +
			`}\n`;
	}
	fs.writeFileSync(path.join(out, "result.css"), css, "utf-8");
	console.log(`[split-fonts] Inter 完成 -> ${path.relative(root, out)}`);
}

async function main() {
	// --if-missing：产物已存在则跳过（用于 build 守卫，不拖慢日常构建）
	if (process.argv.includes("--if-missing")) {
		const misansCss = path.join(fontsOut, "MiSans", "result.css");
		const interCss = path.join(fontsOut, "Inter", "result.css");
		if (fs.existsSync(misansCss) && fs.existsSync(interCss)) {
			console.log("[split-fonts] 字体产物已存在，跳过分片");
			return;
		}
		console.log("[split-fonts] 未检测到字体产物，开始生成 ...");
	}

	await splitMiSans();
	buildInter();
	console.log("[split-fonts] 全部完成 ✅");
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});
