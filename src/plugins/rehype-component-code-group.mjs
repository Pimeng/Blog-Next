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
				description: String(item?.description || "").trim(),
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

export function CodeGroupComponent(properties, children) {
	if (Array.isArray(children) && children.length !== 0) {
		return createHiddenError(
			'Invalid directive. ("code-group" must be leaf type "::code-group{...}")',
		);
	}

	const { options, error } = parseOptions(properties.options);
	if (error) {
		return createHiddenError(error);
	}

	const title = String(properties.title || "源码组").trim();
	const description = String(properties.description || "").trim();
	const language = String(properties.language || "text").trim();
	const defaultLabel = String(properties.default || "").trim();
	const groupId = `CG${Math.random().toString(36).slice(2, 8)}`;
	const defaultIndex = Math.max(
		0,
		options.findIndex((item) => item.label === defaultLabel),
	);
	const initialOption = options[defaultIndex] || options[0];
	const optionsJson = JSON.stringify(options);

	return h("section", { id: groupId, class: "code-group-card", "data-code-group": "" }, [
		h("style", `
			#${groupId} {
				margin: 1rem 0 1.5rem;
				border: 1px solid var(--line-divider);
				border-radius: calc(var(--radius-large) - 0.2rem);
				background: var(--card-bg);
				overflow: hidden;
				box-shadow: 0 10px 30px -24px color-mix(in oklab, var(--primary) 18%, transparent);
			}
			#${groupId} .cg-header {
				padding: 1rem 1rem 0.8rem;
				border-bottom: 1px dashed var(--line-divider);
			}
			#${groupId} .cg-title {
				font-size: 1rem;
				font-weight: 700;
				color: color-mix(in oklab, currentColor 88%, var(--primary));
			}
			#${groupId} .cg-desc {
				margin-top: 0.45rem;
				font-size: 0.9rem;
				color: color-mix(in oklab, currentColor 68%, transparent);
			}
			#${groupId} .cg-tabs {
				display: flex;
				flex-wrap: wrap;
				gap: 0.2rem;
				padding: 1rem 1rem 0;
				border-bottom: 1px solid color-mix(in oklab, var(--line-divider) 92%, transparent);
			}
			#${groupId} .cg-tab {
				display: inline-flex;
				align-items: center;
				justify-content: center;
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
				font-size: 0.92rem;
				font-weight: 600;
			}
			#${groupId} .cg-tab:hover {
				background: color-mix(in oklab, var(--primary) 6%, var(--card-bg));
				color: inherit;
			}
			#${groupId} .cg-tab[data-active="true"] {
				border-color: color-mix(in oklab, var(--primary) 22%, var(--line-divider));
				border-bottom-color: var(--card-bg);
				background: color-mix(in oklab, var(--primary) 10%, var(--card-bg));
				color: inherit;
				box-shadow: inset 0 2px 0 0 color-mix(in oklab, var(--primary) 72%, transparent);
			}
			#${groupId} .cg-panel {
				padding: 0.85rem 1rem 1rem;
			}
			#${groupId} .cg-meta {
				display: flex;
				align-items: center;
				justify-content: space-between;
				gap: 0.75rem;
				flex-wrap: wrap;
				margin-bottom: 0.65rem;
			}
			#${groupId} .cg-current {
				font-size: 0.88rem;
				color: color-mix(in oklab, currentColor 70%, transparent);
			}
			#${groupId} .cg-current strong {
				color: inherit;
				font-weight: 700;
			}
			#${groupId} .cg-copy {
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
			#${groupId} .cg-copy:hover {
				background: var(--btn-regular-bg-hover);
			}
			#${groupId} .cg-copy:active {
				background: var(--btn-regular-bg-active);
			}
			#${groupId} .cg-codebox {
				border: 1px solid color-mix(in oklab, var(--line-divider) 90%, transparent);
				border-radius: 0.9rem;
				overflow: hidden;
				background: color-mix(in oklab, var(--card-bg) 72%, black 28%);
			}
			#${groupId} .cg-codebox-top {
				height: 1.8rem;
				display: flex;
				align-items: center;
				padding: 0 0.75rem;
				background: var(--codeblock-topbar-bg);
				border-bottom: 1px solid color-mix(in oklab, var(--line-divider) 90%, transparent);
				gap: 0.35rem;
			}
			#${groupId} .cg-dot {
				width: 0.38rem;
				height: 0.38rem;
				border-radius: 999px;
				background: color-mix(in oklab, currentColor 36%, transparent);
				opacity: 0.7;
			}
			#${groupId} .cg-codebody {
				padding: 0.9rem 1rem;
				overflow-x: auto;
			}
			#${groupId} .cg-code {
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
			#${groupId} .cg-code-line {
				display: block;
			}
			#${groupId} .cg-tok-cmd {
				color: #61afef;
			}
			#${groupId} .cg-tok-flag {
				color: #d19a66;
			}
			#${groupId} .cg-tok-key {
				color: #98c379;
			}
			#${groupId} .cg-tok-value {
				color: #e06c75;
			}
			#${groupId} .cg-tok-str {
				color: #e5c07b;
			}
			#${groupId} .cg-tok-comment {
				color: #7f848e;
			}
			#${groupId} .cg-tok-plain {
				color: #e5e7eb;
			}
			#${groupId} .cg-note {
				margin-top: 0.45rem;
				font-size: 0.82rem;
				color: color-mix(in oklab, currentColor 58%, transparent);
			}
			@media (max-width: 640px) {
				#${groupId} .cg-tab {
					width: 100%;
					justify-content: space-between;
					border-bottom-color: transparent;
					border-radius: 0.85rem;
					margin-bottom: 0;
				}
				#${groupId} .cg-copy {
					width: 100%;
				}
			}
		`),
		h("div", { class: "cg-header" }, [
			h("div", { class: "cg-title" }, title),
			description ? h("div", { class: "cg-desc" }, description) : null,
		].filter(Boolean)),
		h(
			"div",
			{ class: "cg-tabs", role: "tablist", "aria-label": title },
			options.map((item, index) =>
				h(
					"button",
					{
						type: "button",
						class: "cg-tab",
						"data-cg-tab": "",
						"data-index": String(index),
						"data-active": String(index === defaultIndex),
						"aria-pressed": String(index === defaultIndex),
					},
					item.label,
				),
			),
		),
		h("div", { class: "cg-panel" }, [
			h("div", { class: "cg-meta" }, [
				h("div", { class: "cg-current" }, [
					h("span", null, "当前版本："),
					h("strong", { "data-cg-current-label": "" }, initialOption.label),
				]),
				h(
					"button",
					{
						type: "button",
						class: "cg-copy",
						"data-cg-copy": "",
					},
					"复制代码",
				),
			]),
			h("div", { class: "cg-codebox", "data-cg-language": language }, [
				h("div", { class: "cg-codebox-top", "aria-hidden": "true" }, [
					h("span", { class: "cg-dot" }),
					h("span", { class: "cg-dot" }),
					h("span", { class: "cg-dot" }),
				]),
				h("div", { class: "cg-codebody" }, [
					h("pre", { class: "cg-code", "data-cg-code": "" }, initialOption.code),
				]),
			]),
			h("div", { class: "cg-note", "data-cg-description": "" }, initialOption.description),
		]),
		h("script", { type: "text/javascript" }, `
			(() => {
				const root = document.getElementById("${groupId}");
				if (!root || root.dataset.bound === "true") return;
				root.dataset.bound = "true";

				const options = ${optionsJson};
				const tabs = Array.from(root.querySelectorAll("[data-cg-tab]"));
				const codeEl = root.querySelector("[data-cg-code]");
				const currentLabelEl = root.querySelector("[data-cg-current-label]");
				const descriptionEl = root.querySelector("[data-cg-description]");
				const copyButton = root.querySelector("[data-cg-copy]");
				let activeIndex = ${defaultIndex};

				const escapeHtml = (input) =>
					String(input)
						.replaceAll("&", "&amp;")
						.replaceAll("<", "&lt;")
						.replaceAll(">", "&gt;");

				const renderHighlightedCode = (text) => {
					if (!codeEl) return;

					const highlightLine = (line) => {
						const trimmed = line.trimStart();
						if (trimmed.startsWith("#")) {
							return '<span class="cg-tok-comment">' + escapeHtml(line) + "</span>";
						}

						const parts = line.match(/"[^"]*"|'[^']*'|\\S+|\\s+/g) || [];
						let tokenIndex = 0;

						return parts
							.map((part) => {
								if (/^\\s+$/.test(part)) {
									return escapeHtml(part);
								}

								if (
									(part.startsWith('"') && part.endsWith('"')) ||
									(part.startsWith("'") && part.endsWith("'"))
								) {
									tokenIndex += 1;
									return '<span class="cg-tok-str">' + escapeHtml(part) + "</span>";
								}

								if (part.startsWith("#")) {
									tokenIndex += 1;
									return '<span class="cg-tok-comment">' + escapeHtml(part) + "</span>";
								}

								if (part.includes("=") && !part.startsWith("-")) {
									tokenIndex += 1;
									const eqPos = part.indexOf("=");
									const left = part.slice(0, eqPos);
									const right = part.slice(eqPos + 1);
									return (
										'<span class="cg-tok-key">' +
										escapeHtml(left) +
										'</span><span class="cg-tok-plain">=</span><span class="cg-tok-value">' +
										escapeHtml(right) +
										"</span>"
									);
								}

								const className =
									tokenIndex++ === 0
										? "cg-tok-cmd"
										: part.startsWith("-")
											? "cg-tok-flag"
											: "cg-tok-plain";

								return '<span class="' + className + '">' + escapeHtml(part) + "</span>";
							})
							.join("");
					};

					codeEl.innerHTML = String(text)
						.replace(/\\r\\n/g, "\\n")
						.split("\\n")
						.map((line) => '<span class="cg-code-line">' + highlightLine(line) + "</span>")
						.join("\\n");
				};

				const render = (index) => {
					activeIndex = index;
					const current = options[index];
					if (!current) return;

					for (const tab of tabs) {
						const isActive = Number(tab.dataset.index) === index;
						tab.dataset.active = String(isActive);
						tab.setAttribute("aria-pressed", String(isActive));
					}

					if (currentLabelEl) currentLabelEl.textContent = current.label;
					renderHighlightedCode(current.code);
					if (descriptionEl) descriptionEl.textContent = current.description || "";
				};

				for (const tab of tabs) {
					tab.addEventListener("click", () => {
						render(Number(tab.dataset.index || 0));
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
							copyButton.textContent = "复制代码";
						}, 1500);
					});
				}

				render(${defaultIndex});
			})();
		`),
	]);
}
