/**
 * Rewrites an App URL from the /latest/ deployment to a specific branch.
 *
 * Handles both URL shapes used across 11-AppBuilder and BETA:
 *   https://appbuilder.shapediver.com/v1/main/latest/?slug=...
 *   https://www.shapediver.com/app/builder/v1/main/latest/?slug=...
 *
 * The segment `/main/latest/` becomes `/main/<branch>/`.
 */
export function rewriteToTestBranch(url: string, branch: string): string {
	return url.replace("/main/latest/", `/main/${branch}/`);
}

/**
 * Test URL for an App URL on /latest/: the same URL on the test branch, or,
 * when `APPBUILDER_BASE_URL` is set (e.g. a local dev server at
 * `http://127.0.0.1:8080/`), that base with the URL's query.
 */
export function resolveTestUrl(
	url: string,
	branch: string,
	baseUrl = process.env.APPBUILDER_BASE_URL,
): string {
	if (!baseUrl) return rewriteToTestBranch(url, branch);
	const target = new URL(baseUrl);
	target.search = new URL(url).search;
	return target.toString();
}

/**
 * Appends additional query parameters to a URL.
 *
 * Useful for adding optional URL parameters such as:
 *   modelStateId, g (theme), or other AppBuilder query parameters.
 *
 * @example
 *   applyUrlParams("https://.../?slug=xxx", { modelStateId: "abc123", g: "theme.json" })
 *   // → "https://.../?slug=xxx&modelStateId=abc123&g=theme.json"
 */
export function applyUrlParams(
	url: string,
	params?: Record<string, string>,
): string {
	if (!params) return url;
	const parsed = new URL(url);
	for (const [key, value] of Object.entries(params)) {
		parsed.searchParams.set(key, value);
	}
	return parsed.toString();
}
