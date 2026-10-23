import {Page} from "@playwright/test";

/** Replace every root-relative `href` string in a JSON value (recursively). */
function rewriteHrefs(value: unknown, base: string): unknown {
	if (Array.isArray(value)) {
		return value.map((entry) => rewriteHrefs(entry, base));
	}
	if (typeof value !== "object" || value === null) {
		return value;
	}
	return Object.fromEntries(
		Object.entries(value).map(([key, entry]) => [
			key,
			key === "href" && typeof entry === "string" && entry.startsWith("/")
				? new URL(entry.slice(1), base).href
				: rewriteHrefs(entry, base),
		]),
	);
}

/**
 * Serves the `g` settings file with root-relative `href`s (e.g. database
 * sources like `/example-filterableDatabase.csv`) resolved against the
 * directory the settings file was loaded from.
 *
 * Root-relative paths work on the local dev server (`/` is the app base) but
 * not on branch deploys, where the app lives under `/v1/main/<branch>/`. The
 * rewritten URL stays on the app origin, so the deployed CSP (`connect-src
 * 'self'`) allows the fetch. Call before `page.goto`.
 */
export async function routeSettingsHrefsToAppBase(
	page: Page,
	settingsFile: string,
) {
	await page.route(`**/${settingsFile}`, async (route) => {
		const response = await route.fetch();
		const json = await response.json();
		await route.fulfill({
			response,
			json: rewriteHrefs(json, route.request().url()),
		});
	});
}
