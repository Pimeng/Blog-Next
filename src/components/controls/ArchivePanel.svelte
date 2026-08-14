<script lang="ts">
import { onMount } from "svelte";

import I18nKey from "@/i18n/i18nKey";
import { i18n } from "@/i18n/translation";
import { getPostUrlBySlug } from "@/utils/url-utils";

export let tags: string[] = [];
export let categories: string[] = [];
export let sortedPosts: Post[] = [];

const params = new URLSearchParams(window.location.search);
tags = params.has("tag") ? params.getAll("tag") : [];
categories = params.has("category") ? params.getAll("category") : [];
const uncategorized = params.get("uncategorized");

interface Post {
	id: string;
	data: {
		title: string;
		tags: string[];
		category?: string | null;
		published: Date;
		pinned?: boolean;
	};
}

interface Group {
	year: number | null;
	pinned?: boolean;
	posts: Post[];
}

let groups: Group[] = [];
type SortKey = "latest" | "oldest" | "views" | "views-asc";
const sortKeys = new Set<SortKey>(["latest", "oldest", "views", "views-asc"]);
const viewsCache = new Map<string, number>();
let sortRequestId = 0;

function formatDate(date: Date) {
	const month = (date.getMonth() + 1).toString().padStart(2, "0");
	const day = date.getDate().toString().padStart(2, "0");
	return `${month}-${day}`;
}

function formatTag(tagList: string[]) {
	return tagList.map((t) => `#${t}`).join(" ");
}

function isSortKey(value: string | null): value is SortKey {
	return value !== null && sortKeys.has(value as SortKey);
}

function getSortPreference(): SortKey {
	const querySort = new URL(window.location.href).searchParams.get("sort");
	if (isSortKey(querySort)) return querySort;

	try {
		const storedSort = localStorage.getItem("firefly-post-sort");
		if (isSortKey(storedSort)) return storedSort;
	} catch {
		// localStorage may be unavailable in private browsing modes.
	}

	return "latest";
}

function getPageviews(stats: unknown): number {
	if (!stats || typeof stats !== "object") return 0;

	const rawValue = (stats as { pageviews?: unknown }).pageviews;
	if (typeof rawValue === "number") return Number.isFinite(rawValue) ? rawValue : 0;
	if (rawValue && typeof rawValue === "object") {
		const value = (rawValue as { value?: unknown }).value;
		const parsed = Number(value);
		return Number.isFinite(parsed) ? parsed : 0;
	}
	return 0;
}

async function getPostViews(post: Post): Promise<number> {
	const cached = viewsCache.get(post.id);
	if (cached !== undefined) return cached;

	const stats = window.FireflyUmamiStats;
	if (!stats?.fetchStats) return 0;

	try {
		const views = getPageviews(await stats.fetchStats(getPostUrlBySlug(post.id)));
		viewsCache.set(post.id, views);
		return views;
	} catch {
		viewsCache.set(post.id, 0);
		return 0;
	}
}

function getFilteredPosts(): Post[] {
	let filteredPosts: Post[] = sortedPosts;

	if (tags.length > 0) {
		filteredPosts = filteredPosts.filter(
			(post) =>
				Array.isArray(post.data.tags) &&
				post.data.tags.some((tag) => tags.includes(tag)),
		);
	}

	if (categories.length > 0) {
		filteredPosts = filteredPosts.filter(
			(post) => post.data.category && categories.includes(post.data.category),
		);
	}

	if (uncategorized) {
		filteredPosts = filteredPosts.filter((post) => !post.data.category);
	}

	return filteredPosts;
}

async function sortPosts(posts: Post[], sort: SortKey): Promise<Post[]> {
	const pinnedPosts = posts.filter((post) => post.data.pinned === true);
	const sortablePosts = posts.filter((post) => post.data.pinned !== true);
	const sorted = sortablePosts.slice();
	const originalOrder = new Map(sorted.map((post, index) => [post.id, index]));
	const views = new Map<string, number>();

	if (sort === "views" || sort === "views-asc") {
		await Promise.all(sorted.map(async (post) => views.set(post.id, await getPostViews(post))));
	}

	// 置顶文章始终优先，其余文章按当前排序方式排列
	sorted.sort((a, b) => {
		if (sort === "views" || sort === "views-asc") {
			const difference = (views.get(b.id) || 0) - (views.get(a.id) || 0);
			if (difference !== 0) return sort === "views" ? difference : -difference;
		}

		const publishedDifference =
			b.data.published.getTime() - a.data.published.getTime();
		if (publishedDifference !== 0) {
			return sort === "oldest" ? -publishedDifference : publishedDifference;
		}
		return (originalOrder.get(a.id) || 0) - (originalOrder.get(b.id) || 0);
	});

	return [...pinnedPosts, ...sorted];
}

function setGroups(posts: Post[], sort: SortKey) {
	if (sort === "views" || sort === "views-asc") {
		groups = [{ year: null, posts }];
		return;
	}

	const pinnedPosts = posts.filter((post) => post.data.pinned === true);
	const grouped = posts.filter((post) => post.data.pinned !== true).reduce(
		(acc, post) => {
			const year = post.data.published.getFullYear();
			if (!acc[year]) {
				acc[year] = [];
			}
			acc[year].push(post);
			return acc;
		},
		{} as Record<number, Post[]>,
	);

	const groupedPostsArray = Object.keys(grouped).map((yearStr) => ({
		year: Number.parseInt(yearStr, 10),
		posts: grouped[Number.parseInt(yearStr, 10)],
	}));

	groupedPostsArray.sort((a, b) =>
		sort === "oldest" ? a.year - b.year : b.year - a.year,
	);

	groups = pinnedPosts.length
		? [{ year: null, pinned: true, posts: pinnedPosts }, ...groupedPostsArray]
		: groupedPostsArray;
}

async function updateGroups(sort: SortKey) {
	const requestId = ++sortRequestId;
	const filteredPosts = await sortPosts(getFilteredPosts(), sort);
	if (requestId !== sortRequestId) return;
	setGroups(filteredPosts, sort);
}

onMount(() => {
	const handleSort = (event: Event) => {
		const sort = (event as CustomEvent<{ sort?: string }>).detail?.sort;
		if (isSortKey(sort || null)) void updateGroups(sort);
	};

	window.addEventListener("firefly:sort-posts", handleSort);
	void updateGroups(getSortPreference());

	return () => window.removeEventListener("firefly:sort-posts", handleSort);
});
</script>

<div class="card-base px-8 py-6">
    {#each groups as group (group.pinned ? "pinned" : group.year ?? "all")}
        <div>
            <div class="flex flex-row w-full items-center h-15">
                <div class="w-[15%] md:w-[10%] transition text-2xl font-bold text-right text-75">
                    {group.pinned ? i18n(I18nKey.pinned) : group.year ?? i18n(I18nKey.all)}
                </div>
                <div class="w-[15%] md:w-[10%]">
                    <div
                            class="h-3 w-3 bg-none rounded-full outline outline-(--primary) mx-auto
                  -outline-offset-2 z-50 outline-3"
                    ></div>
                </div>
                <div class="w-[70%] md:w-[80%] transition text-left text-50">
                    {group.posts.length} {i18n(group.posts.length === 1 ? I18nKey.postCount : I18nKey.postsCount)}
                </div>
            </div>

            {#each group.posts as post (post.id)}
                <a
                        href={getPostUrlBySlug(post.id)}
                        aria-label={post.data.title}
                        class="group btn-plain block! h-10 w-full rounded-lg hover:text-[initial]"
                >
                    <div class="flex flex-row justify-start items-center h-full">
                        <!-- date -->
                        <div class="w-[15%] md:w-[10%] transition text-sm text-right text-50">
                            {formatDate(post.data.published)}
                        </div>

                        <!-- dot and line -->
                        <div class="w-[15%] md:w-[10%] relative dash-line h-full flex items-center">
                            <div
                                    class="transition-all mx-auto w-1 h-1 rounded group-hover:h-5
                       bg-[oklch(0.5_0.05_var(--hue))] group-hover:bg-(--primary)
                       outline outline-4 z-50
                       outline-(--card-bg)
                       group-hover:outline-(--btn-plain-bg-hover)
                       group-active:outline-(--btn-plain-bg-active)"
                            ></div>
                        </div>

                        <!-- post title -->
                        <div
                                class="w-[70%] md:max-w-[65%] md:w-[65%] text-left font-bold
                     group-hover:translate-x-1 transition-all group-hover:text-(--primary)
                     text-75 pr-8 whitespace-nowrap text-ellipsis overflow-hidden"
                        >
                            {post.data.title}
                        </div>

                        <!-- tag list -->
                        <div
                                class="hidden md:block md:w-[15%] text-left text-sm transition
                     whitespace-nowrap text-ellipsis overflow-hidden text-30"
                        >
                            {formatTag(post.data.tags)}
                        </div>
                    </div>
                </a>
            {/each}
        </div>
    {/each}
</div>
