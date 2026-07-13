/**
 * Fetches the rendered public GrasshopperExampleModels definition pages and
 * extracts App Builder links.
 *
 * Returns an array of { slug, url, source } objects where:
 *   - slug  = the value of the ?slug= query parameter
 *   - url   = the full original App URL (points to /latest/)
 *   - source = which definition page the link came from
 */

export type AppLinkSource = "11-AppBuilder" | "BETA";

export interface AppLink {
	slug: string;
	url: string;
	source: AppLinkSource;
}

const PUBLIC_DEFINITION_URLS: Record<AppLinkSource, string> = {
	"11-AppBuilder":
		"https://shapediver.github.io/GrasshopperExampleModels/11-AppBuilder/definitions.html",
	BETA: "https://shapediver.github.io/GrasshopperExampleModels/BETA/definitions.html",
};

const APP_BUILDER_LINK_RE =
	/https:\/\/www\.shapediver\.com\/app\/builder\/v1\/main\/latest\/\?[^"'\s<>)]+/g;

function normalizeHtmlUrl(url: string): string {
	return url
		.replaceAll("&amp;", "&")
		.replaceAll("&#38;", "&")
		.replaceAll("%26amp%3B", "&");
}

function extractLinks(html: string, source: AppLinkSource): AppLink[] {
	const links = new Map<string, AppLink>();
	let match: RegExpExecArray | null;

	while ((match = APP_BUILDER_LINK_RE.exec(html)) !== null) {
		const url = normalizeHtmlUrl(match[0]);
		const parsed = new URL(url);
		const slug = parsed.searchParams.get("slug");
		if (!slug) continue;

		links.set(slug, {slug, url, source});
	}

	return [...links.values()].sort((a, b) => a.slug.localeCompare(b.slug));
}

export async function fetchAppLinks(): Promise<AppLink[]> {
	const results = await Promise.all(
		(Object.entries(PUBLIC_DEFINITION_URLS) as [AppLinkSource, string][]).map(
			async ([source, pageUrl]) => {
				const res = await fetch(pageUrl);
				if (!res.ok)
					throw new Error(
						`Failed to fetch ${pageUrl}: ${res.status} ${res.statusText}`,
					);
				const html = await res.text();
				const links = extractLinks(html, source);
				if (links.length === 0) {
					throw new Error(
						`No App Builder links found in public definition page ${pageUrl}`,
					);
				}
				return links;
			},
		),
	);

	// Deduplicate by slug (a slug may appear in both sources via cross-references).
	const seen = new Set<string>();
	return results.flat().filter(({slug}) => {
		if (seen.has(slug)) return false;
		seen.add(slug);
		return true;
	});
}
