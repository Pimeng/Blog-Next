import { h } from "hastscript";

function createHiddenError(message) {
	return h("div", { class: "hidden" }, message);
}

function parseOptions(rawOptions) {
	if (!rawOptions) return { options: [], error: 'Missing "options" attribute.' };

	try {
		const parsed = JSON.parse(rawOptions);
		if (!Array.isArray(parsed)) {
			return {
				options: [],
				error: '"options" must be a JSON array.',
			};
		}

		const options = parsed
			.map((item) => ({
				label: String(item?.label || "").trim(),
				value: String(item?.value || item?.probe || "").trim(),
				probe: String(item?.probe || item?.value || "").trim(),
				code: String(item?.code || "").replace(/\r\n/g, "\n"),
			}))
			.filter((item) => item.label && item.code);

		if (options.length === 0) {
			return {
				options: [],
				error: '"options" must contain at least one item with "label" and "code".',
			};
		}

		return { options, error: null };
	} catch (error) {
		return {
			options: [],
			error: `Invalid "options" JSON: ${error instanceof Error ? error.message : String(error)}`,
		};
	}
}

export function MirrorSwitcherComponent(properties, children) {
	if (Array.isArray(children) && children.length !== 0) {
		return createHiddenError(
			'Invalid directive. ("mirror-switcher" must be leaf type "::mirror-switcher{...}")',
		);
	}

	const { options, error } = parseOptions(properties.options);
	if (error) {
		return createHiddenError(error);
	}

	const title = String(properties.title || "镜像可用性探测").trim();
	const description = String(properties.description || "").trim();
	const language = String(properties.language || "bash").trim();
	const defaultLabel = String(properties.default || "").trim();
	const timeout = Number.parseInt(String(properties.timeout || "3500"), 10);
	const switcherId = `MS${Math.random().toString(36).slice(2, 8)}`;

	const defaultIndex = Math.max(
		0,
		options.findIndex((item) => item.label === defaultLabel),
	);
	const initialOption = options[defaultIndex] || options[0];
	const safeTimeout = Number.isFinite(timeout) ? Math.max(1000, timeout) : 3500;
	const optionsJson = JSON.stringify(options);

	return h("section", { id: switcherId, class: "mirror-switcher-card", "data-mirror-switcher": "" }, [
		h("style", `
			#${switcherId} {
				margin: 1rem 0 1.5rem;
				border: 1px solid var(--line-divider);
				border-radius: calc(var(--radius-large) - 0.2rem);
				background: var(--card-bg);
				overflow: hidden;
				box-shadow: 0 10px 30px -24px color-mix(in oklab, var(--primary) 18%, transparent);
			}
			#${switcherId} .ms-header {
				padding: 1rem 1rem 0.75rem;
				border-bottom: 1px dashed var(--line-divider);
			}
			#${switcherId} .ms-title-row {
				display: flex;
				align-items: center;
				justify-content: space-between;
				gap: 0.75rem;
				flex-wrap: wrap;
			}
			#${switcherId} .ms-title {
				font-size: 1rem;
				font-weight: 700;
				color: color-mix(in oklab, currentColor 88%, var(--primary));
			}
			#${switcherId} .ms-summary {
				font-size: 0.82rem;
				color: color-mix(in oklab, currentColor 56%, transparent);
			}
			#${switcherId} .ms-desc {
				margin-top: 0.5rem;
				font-size: 0.9rem;
				color: color-mix(in oklab, currentColor 68%, transparent);
			}
			#${switcherId} .ms-options {
				display: flex;
				flex-wrap: wrap;
				gap: 0.2rem;
				padding: 1rem 1rem 0;
				border-bottom: 1px solid color-mix(in oklab, var(--line-divider) 92%, transparent);
			}
			#${switcherId} .ms-option {
				display: inline-flex;
				align-items: center;
				justify-content: center;
				gap: 0.55rem;
				border: 1px solid transparent;
				border-bottom: 1px solid transparent;
				border-radius: 0.85rem 0.85rem 0 0;
				padding: 0.7rem 1rem 0.72rem;
				margin-bottom: -1px;
				background: transparent;
				color: color-mix(in oklab, currentColor 72%, transparent);
				cursor: pointer;
				transition: all 0.16s ease;
				font: inherit;
			}
			#${switcherId} .ms-option:hover {
				background: color-mix(in oklab, var(--primary) 6%, var(--card-bg));
				color: inherit;
			}
			#${switcherId} .ms-option[data-active="true"] {
				border-color: color-mix(in oklab, var(--primary) 22%, var(--line-divider));
				border-bottom-color: var(--card-bg);
				background: color-mix(in oklab, var(--primary) 10%, var(--card-bg));
				color: inherit;
				box-shadow: inset 0 2px 0 0 color-mix(in oklab, var(--primary) 72%, transparent);
			}
			#${switcherId} .ms-option-label {
				font-weight: 600;
				font-size: 0.92rem;
			}
			#${switcherId} .ms-indicator {
				width: 0.72rem;
				height: 0.72rem;
				border-radius: 999px;
				display: inline-flex;
				align-items: center;
				justify-content: center;
				flex: none;
				font-size: 0.58rem;
				line-height: 1;
				background: color-mix(in oklab, currentColor 16%, transparent);
				color: transparent;
			}
			#${switcherId} .ms-option[data-status="probing"] .ms-indicator {
				background: color-mix(in oklab, currentColor 24%, transparent);
				color: transparent;
				animation: ms-pulse-${switcherId} 1s ease-in-out infinite;
			}
			#${switcherId} .ms-option[data-status="ok"] .ms-indicator {
				background: #22c55e;
				box-shadow: 0 0 0 2px color-mix(in oklab, #22c55e 18%, transparent);
			}
			#${switcherId} .ms-option[data-status="error"] .ms-indicator {
				background: #ef4444;
				color: white;
				font-weight: 700;
			}
			#${switcherId} .ms-panel {
				padding: 0.85rem 1rem 1rem;
			}
			#${switcherId} .ms-code-topbar {
				display: flex;
				align-items: center;
				justify-content: space-between;
				gap: 0.75rem;
				flex-wrap: wrap;
				margin-bottom: 0.65rem;
			}
			#${switcherId} .ms-current {
				display: flex;
				flex-wrap: wrap;
				gap: 0.5rem;
				align-items: center;
				font-size: 0.88rem;
				color: color-mix(in oklab, currentColor 70%, transparent);
			}
			#${switcherId} .ms-current strong {
				color: inherit;
				font-weight: 700;
			}
			#${switcherId} .ms-copy {
				border: 1px solid var(--line-divider);
				border-radius: 0.7rem;
				padding: 0.45rem 0.8rem;
				background: var(--btn-regular-bg);
				color: var(--btn-content);
				cursor: pointer;
				font: inherit;
				font-size: 0.86rem;
				transition: all 0.16s ease;
			}
			#${switcherId} .ms-copy:hover {
				background: var(--btn-regular-bg-hover);
			}
			#${switcherId} .ms-copy:active {
				background: var(--btn-regular-bg-active);
			}
			#${switcherId} .ms-codebox {
				border: 1px solid color-mix(in oklab, var(--line-divider) 90%, transparent);
				border-radius: 0.9rem;
				overflow: hidden;
				background: color-mix(in oklab, var(--card-bg) 72%, black 28%);
			}
			#${switcherId} .ms-codebox-top {
				height: 1.8rem;
				display: flex;
				align-items: center;
				padding: 0 0.75rem;
				background: var(--codeblock-topbar-bg);
				border-bottom: 1px solid color-mix(in oklab, var(--line-divider) 90%, transparent);
				gap: 0.35rem;
			}
			#${switcherId} .ms-dot {
				width: 0.38rem;
				height: 0.38rem;
				border-radius: 999px;
				background: color-mix(in oklab, currentColor 36%, transparent);
				opacity: 0.7;
			}
			#${switcherId} .ms-codebody {
				padding: 0.9rem 1rem;
				overflow-x: auto;
			}
			#${switcherId} .ms-code {
				margin: 0;
				color: #e5e7eb;
				font-size: 0.9rem;
				line-height: 1.65;
				white-space: pre-wrap;
				font-family:
					"JetBrains Mono Variable",
					ui-monospace,
					SFMono-Regular,
					Menlo,
					Monaco,
					Consolas,
					"Liberation Mono",
					"Courier New",
					monospace;
			}
			#${switcherId} .ms-code-line {
				display: grid;
				grid-template-columns: 2rem 1fr;
				gap: 0.6rem;
			}
			#${switcherId} .ms-ln {
				color: color-mix(in oklab, #94a3b8 80%, transparent);
				user-select: none;
				text-align: right;
				padding-right: 0.6rem;
				border-right: 1px solid color-mix(in oklab, var(--line-divider) 88%, transparent);
			}
			#${switcherId} .ms-code-content {
				white-space: pre-wrap;
				word-break: break-word;
			}
			#${switcherId} .ms-tok-cmd {
				color: #61afef;
			}
			#${switcherId} .ms-tok-flag {
				color: #d19a66;
			}
			#${switcherId} .ms-tok-key {
				color: #98c379;
			}
			#${switcherId} .ms-tok-value {
				color: #98c379;
			}
			#${switcherId} .ms-tok-plain {
				color: #e5e7eb;
			}
			#${switcherId} .ms-footnote {
				padding: 0 1rem 1rem;
				font-size: 0.82rem;
				color: color-mix(in oklab, currentColor 58%, transparent);
			}
			@keyframes ms-pulse-${switcherId} {
				0%, 100% { transform: scale(0.72); opacity: 0.45; }
				50% { transform: scale(1); opacity: 0.95; }
			}
			@media (max-width: 640px) {
				#${switcherId} .ms-option {
					width: 100%;
					justify-content: space-between;
					border-bottom: 1px solid transparent;
					border-radius: 0.85rem;
					margin-bottom: 0;
				}
				#${switcherId} .ms-copy {
					width: 100%;
				}
			}
		`),
		h("div", { class: "ms-header" }, [
			h("div", { class: "ms-title-row" }, [
				h("div", { class: "ms-title" }, title),
				h("div", { class: "ms-summary", "data-ms-summary": "" }, "正在使用你的浏览器探测可达性…"),
			]),
			description ? h("div", { class: "ms-desc" }, description) : null,
		].filter(Boolean)),
		h("div", { class: "ms-options", role: "tablist", "aria-label": title }, options.map((item, index) =>
			h("button", {
				type: "button",
				class: "ms-option",
				"data-ms-option": "",
				"data-index": String(index),
				"data-active": String(index === defaultIndex),
				"data-status": "probing",
				"aria-pressed": String(index === defaultIndex),
			}, [
				h("span", {
					class: "ms-option-label",
				}, item.label),
				h("span", {
					class: "ms-indicator",
					"data-ms-indicator": "",
					"aria-hidden": "true",
				}, "·"),
			]),
		)),
		h("div", { class: "ms-panel" }, [
			h("div", { class: "ms-code-topbar" }, [
				h("div", { class: "ms-current" }, [
					h("span", null, "当前命令"),
					h("strong", { "data-ms-current-label": "" }, initialOption.label),
					initialOption.value
						? h("span", { "data-ms-current-value": "" }, `(${initialOption.value})`)
						: h("span", { "data-ms-current-value": "" }, ""),
				]),
				h("button", {
					type: "button",
					class: "ms-copy",
					"data-ms-copy": "",
				}, "复制命令"),
			]),
			h("div", { "data-ms-runtime-code": "" }, [
				h("div", { class: "ms-codebox", "data-ms-language": language }, [
					h("div", { class: "ms-codebox-top", "aria-hidden": "true" }, [
						h("span", { class: "ms-dot" }),
						h("span", { class: "ms-dot" }),
						h("span", { class: "ms-dot" }),
					]),
					h("div", { class: "ms-codebody" }, [
						h("pre", {
							class: "ms-code",
							"data-ms-code": "",
						}, initialOption.code),
					]),
				]),
			]),
		]),
		h("div", { class: "ms-footnote" }, "提示：浏览器探测只能反映你当前网络环境下的连通性，不能替代服务端健康检查。因浏览器局限性，测试结果不一定准确，仅供参考。"),
		h("script", { type: "text/javascript" }, `
			(() => {
				const root = document.getElementById("${switcherId}");
				if (!root || root.dataset.bound === "true") return;
				root.dataset.bound = "true";

				const options = ${optionsJson};
				const timeout = ${safeTimeout};
				const buttons = Array.from(root.querySelectorAll("[data-ms-option]"));
				const summaryEl = root.querySelector("[data-ms-summary]");
				const currentLabelEl = root.querySelector("[data-ms-current-label]");
				const currentValueEl = root.querySelector("[data-ms-current-value]");
				const runtimeCodeRoot = root.querySelector("[data-ms-runtime-code]");
				const copyButton = root.querySelector("[data-ms-copy]");
				let activeIndex = ${defaultIndex};
				let okCount = 0;
				let errorCount = 0;

				const renderCodeBlock = (text) => {
					if (!runtimeCodeRoot) return;

					runtimeCodeRoot.innerHTML =
						'<div class="ms-codebox" data-ms-language="${language}">' +
						'<div class="ms-codebox-top" aria-hidden="true">' +
						'<span class="ms-dot"></span><span class="ms-dot"></span><span class="ms-dot"></span>' +
						'</div>' +
						'<div class="ms-codebody"><pre class="ms-code" data-ms-code=""></pre></div>' +
						'</div>';

					const codeNode = runtimeCodeRoot.querySelector("[data-ms-code]");
					if (!codeNode) return;

					const escapeHtml = (input) =>
						String(input)
							.replaceAll("&", "&amp;")
							.replaceAll("<", "&lt;")
							.replaceAll(">", "&gt;");

					const tokenClass = (token, index) => {
						if (index === 0) return "ms-tok-cmd";
						if (token.startsWith("-")) return "ms-tok-flag";
						if (token.includes("=")) {
							const eqPos = token.indexOf("=");
							const left = token.slice(0, eqPos);
							const right = token.slice(eqPos + 1);
							return (
								'<span class="ms-tok-key">' +
								escapeHtml(left) +
								"</span>" +
								'<span class="ms-tok-plain">=</span>' +
								'<span class="ms-tok-value">' +
								escapeHtml(right) +
								"</span>"
							);
						}
						return '<span class="ms-tok-value">' + escapeHtml(token) + "</span>";
					};

					const highlightLine = (line) => {
						const parts = line.match(/\\S+|\\s+/g) || [];
						let tokenIndex = 0;
						return parts
							.map((part) => {
								if (/^\\s+$/.test(part)) return escapeHtml(part);
								const klassOrHtml = tokenClass(part, tokenIndex++);
								if (klassOrHtml.includes("<span")) return klassOrHtml;
								return (
									'<span class="' +
									klassOrHtml +
									'">' +
									escapeHtml(part) +
									"</span>"
								);
							})
							.join("");
					};

					const lines = String(text).replace(/\\r\\n/g, "\\n").split("\\n");
					codeNode.innerHTML = lines
						.map(
							(line, idx) =>
								'<div class="ms-code-line">' +
								'<span class="ms-ln">' +
								(idx + 1) +
								"</span>" +
								'<span class="ms-code-content">' +
								highlightLine(line) +
								"</span>" +
								"</div>",
						)
						.join("");
				};

				const setIndicator = (button, status) => {
					const indicator = button.querySelector("[data-ms-indicator]");
					if (!indicator) return;
					button.dataset.status = status;
					indicator.textContent = status === "error" ? "!" : "·";
				};

				const renderActive = (index) => {
					activeIndex = index;
					for (const button of buttons) {
						const isActive = Number(button.dataset.index) === index;
						button.dataset.active = String(isActive);
						button.setAttribute("aria-pressed", String(isActive));
					}

					const current = options[index];
					if (!current) return;
					if (currentLabelEl) currentLabelEl.textContent = current.label;
					if (currentValueEl) currentValueEl.textContent = current.value ? "(" + current.value + ")" : "";
					renderCodeBlock(current.code);
				};

				const updateSummary = () => {
					if (!summaryEl) return;
					const pendingCount = options.length - okCount - errorCount;
					if (pendingCount > 0) {
						summaryEl.textContent = "正在探测 " + pendingCount + " 个镜像…";
						return;
					}

					summaryEl.textContent = "可达 " + okCount + " 个，不可达 " + errorCount + " 个";
				};

				const probe = async (option, index) => {
					const button = buttons[index];
					if (!button || !option?.probe) return;

					setIndicator(button, "probing");
					updateSummary();

					const controller = typeof AbortController !== "undefined" ? new AbortController() : null;
					const timer = setTimeout(() => {
						if (controller) controller.abort();
					}, timeout);

					try {
						const target = new URL(option.probe, window.location.href);
						target.searchParams.set("__mirror_probe", Date.now().toString(36));
						await fetch(target.toString(), {
							method: "GET",
							mode: "no-cors",
							cache: "no-store",
							redirect: "follow",
							signal: controller?.signal,
						});
						okCount += 1;
						setIndicator(button, "ok");
					} catch (_) {
						errorCount += 1;
						setIndicator(button, "error");
					} finally {
						clearTimeout(timer);
						updateSummary();
					}
				};

				for (const button of buttons) {
					button.addEventListener("click", () => {
						const index = Number(button.dataset.index || 0);
						renderActive(index);
					});
				}

				if (copyButton) {
					copyButton.addEventListener("click", async () => {
						const text = options[activeIndex]?.code || "";
						if (!text) return;
						try {
							await navigator.clipboard.writeText(text);
							copyButton.textContent = "已复制";
						} catch (_) {
							copyButton.textContent = "复制失败";
						}
						setTimeout(() => {
							copyButton.textContent = "复制命令";
						}, 1500);
					});
				}

				renderActive(${defaultIndex});
				updateSummary();
				Promise.allSettled(options.map((option, index) => probe(option, index)));
			})();
		`),
	]);
}
