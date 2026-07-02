import {expect, test} from "@playwright/test";
import * as fs from "fs";
import * as path from "path";
import {scenarioActionById, scenarioActions} from "../config/scenarioActions";
import {AppLink} from "../helpers/fetchAppLinks";
import {applyUrlParams, rewriteToTestBranch} from "../helpers/resolveTargetUrl";
import {takeSnapshot} from "../helpers/takeSnapshot";
import {waitForAppReady} from "../helpers/waitForAppReady";

// ---------------------------------------------------------------------------
// Branch to test — set TEST_BRANCH env var before running, e.g.:
//   TEST_BRANCH=my-feature pnpm test:e2e
// Defaults to "testing" which matches the pre-release deploy step.
// ---------------------------------------------------------------------------
const TEST_BRANCH = process.env.TEST_BRANCH ?? "testing";

// ---------------------------------------------------------------------------
// App links — written by global-setup.ts before spec files are evaluated.
// Falls back to empty array if the file doesn't exist (shouldn't happen in
// normal usage since globalSetup always runs first).
// ---------------------------------------------------------------------------
const linksPath = path.resolve("tests/config/.app-links.json");
const allLinks: AppLink[] = fs.existsSync(linksPath)
	? (JSON.parse(fs.readFileSync(linksPath, "utf-8")) as AppLink[])
	: [];

// Merge fetched links with scenarioActions entries so that slugs listed in
// scenarioActions but absent from the markdown still get tests.
const allEntries = new Map(
	allLinks.map((l) => [l.slug, {slug: l.slug, url: l.url}]),
);
for (const config of scenarioActions) {
	if (!allEntries.has(config.slug)) {
		allEntries.set(config.slug, {
			slug: config.slug,
			url: `https://appbuilder.shapediver.com/v1/main/latest/?slug=${config.slug}`,
		});
	}
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Return the rewritten test URL. */
function testUrl(url: string): string {
	return rewriteToTestBranch(url, TEST_BRANCH);
}

/** Core smoke assertions: page loads, canvas visible, no JS errors. */
async function runSmoke(
	page: import("@playwright/test").Page,
	url: string,
	slug: string,
	setup?: (page: import("@playwright/test").Page) => Promise<void>,
) {
	const jsErrors: string[] = [];
	page.on("pageerror", (err) => jsErrors.push(err.message));

	await page.goto(url, {waitUntil: "domcontentloaded"});
	await waitForAppReady(page, {interstitial: setup});

	const canvas = page.locator("canvas").first();
	await expect(canvas).toBeVisible();
	const box = await canvas.boundingBox();
	expect(box, `Canvas has no bounding box for ${slug}`).not.toBeNull();
	expect(box!.width, `Canvas width is 0 for ${slug}`).toBeGreaterThan(0);
	expect(box!.height, `Canvas height is 0 for ${slug}`).toBeGreaterThan(0);

	expect(
		jsErrors,
		`Unhandled JS errors on ${slug}:\n  ${jsErrors.join("\n  ")}`,
	).toHaveLength(0);
}

// ---------------------------------------------------------------------------
// One describe block per discovered slug. Generated at module load time from
// the JSON written by global-setup.ts so Playwright's discovery step sees all
// tests before any run — enabling full parallelism across all examples.
// scenarioActions supplies optional setup/actions for slugs that need them.
// ---------------------------------------------------------------------------
for (const {slug, url} of allEntries.values()) {
	const config = scenarioActionById.get(slug);
	const setup = config?.setup;
	const params = config?.params;
	const actions = config?.actions;
	const resolvedUrl = applyUrlParams(testUrl(url), params);

	test.describe(slug, () => {
		test("smoke: loads without error", async ({page}) => {
			await runSmoke(page, resolvedUrl, slug, setup);
		});

		test("visual: matches baseline", async ({page}) => {
			await page.goto(resolvedUrl, {waitUntil: "domcontentloaded"});
			await waitForAppReady(page, {interstitial: setup});
			await takeSnapshot(page, slug);
		});

		if (actions) {
			test("interaction: user actions complete successfully", async ({
				page,
			}) => {
				await page.goto(resolvedUrl, {waitUntil: "domcontentloaded"});
				await waitForAppReady(page, {interstitial: setup});
				await actions(page, slug);
			});
		}
	});
}
