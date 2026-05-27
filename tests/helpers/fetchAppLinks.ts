/**
 * Fetches the raw markdown definition files from the GrasshopperExampleModels
 * repository and extracts all [App](...) links.
 *
 * Returns an array of { slug, url, source } objects where:
 *   - slug  = the value of the ?slug= query parameter
 *   - url   = the full original App URL (points to /latest/)
 *   - source = which definition page the link came from
 */

export interface AppLink {
	slug: string;
	url: string;
	source: "11-AppBuilder" | "BETA";
}

const MARKDOWN_URLS: Record<AppLink["source"], string> = {
	"11-AppBuilder":
		"https://github.com/shapediver/GrasshopperExampleModels/raw/refs/heads/development/src/11-AppBuilder/definitions.md",
	BETA: "https://github.com/shapediver/GrasshopperExampleModels/raw/refs/heads/development/src/BETA/definitions.md",
};

const APP_LINK_RE = /\[App\]\((https?:\/\/[^)]+)\)/g;
const SLUG_RE = /[?&]slug=([^&]+)/;

function extractLinks(markdown: string, source: AppLink["source"]): AppLink[] {
	const links: AppLink[] = [];
	let match: RegExpExecArray | null;

	while ((match = APP_LINK_RE.exec(markdown)) !== null) {
		const url = match[1];
		const slugMatch = SLUG_RE.exec(url);
		if (!slugMatch) continue;
		links.push({slug: slugMatch[1], url, source});
	}

	return links;
}

export async function fetchAppLinks(): Promise<AppLink[]> {
	const results = await Promise.all(
		(Object.entries(MARKDOWN_URLS) as [AppLink["source"], string][]).map(
			async ([source, markdownUrl]) => {
				const res = await fetch(markdownUrl);
				if (!res.ok)
					throw new Error(
						`Failed to fetch ${markdownUrl}: ${res.status} ${res.statusText}`,
					);
				const text = await res.text();
				return extractLinks(text, source);
			},
		),
	);

	// Deduplicate by slug (a slug may appear in both sources via cross-references)
	const seen = new Set<string>();
	return results.flat().filter(({slug}) => {
		if (seen.has(slug)) return false;
		seen.add(slug);
		return true;
	});
}
