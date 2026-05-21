import {expect, test} from "@playwright/test";
import {exampleConfigBySlug, exampleConfigs} from "../fixtures/exampleActions";
import {AppLink, fetchAppLinks} from "../helpers/fetchAppLinks";
import {rewriteToTestBranch} from "../helpers/rewriteUrl";
import {waitForModelLoaded} from "../helpers/waitForModelLoaded";

// ---------------------------------------------------------------------------
// Branch to test — set TEST_BRANCH env var before running, e.g.:
//   TEST_BRANCH=my-feature pnpm test:e2e
// Defaults to "testing" which matches the pre-release deploy step.
// ---------------------------------------------------------------------------
const TEST_BRANCH = process.env.TEST_BRANCH ?? "testing";

// ---------------------------------------------------------------------------
// Discovered links — populated once by beforeAll, read by all tests.
// ---------------------------------------------------------------------------
let appLinks: AppLink[] = [];

test.beforeAll(async () => {
	appLinks = await fetchAppLinks();
	if (appLinks.length === 0) {
		throw new Error(
			"No App links discovered — check fetchAppLinks markdown URLs",
		);
	}
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Return the rewritten test URL for a slug, preferring the discovered URL. */
function testUrl(slug: string): string {
	const discovered = appLinks.find((l) => l.slug === slug);
	const baseUrl =
		discovered?.url ??
		`https://appbuilder.shapediver.com/v1/main/latest/?slug=${slug}`;
	return rewriteToTestBranch(baseUrl, TEST_BRANCH);
}

/** Core smoke assertions: page loads, canvas visible, no JS errors. */
async function runSmoke(
	page: import("@playwright/test").Page,
	url: string,
	slug: string,
) {
	const jsErrors: string[] = [];
	page.on("pageerror", (err) => jsErrors.push(err.message));

	await page.goto(url, {waitUntil: "domcontentloaded"});
	await waitForModelLoaded(page);

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
// One describe block per known example (declared at module-load time so
// Playwright's test-discovery step sees all tests before any run).
// ---------------------------------------------------------------------------
for (const config of exampleConfigs) {
	const {slug, label, actions} = config;

	test.describe(label, () => {
		test("smoke: loads without error", async ({page}) => {
			await runSmoke(page, testUrl(slug), slug);
		});

		if (actions) {
			test("interaction: user actions complete successfully", async ({
				page,
			}) => {
				await page.goto(testUrl(slug), {waitUntil: "domcontentloaded"});
				await waitForModelLoaded(page);
				await actions(page);
			});
		}
	});
}

// ---------------------------------------------------------------------------
// Catch-all: smoke-test any links discovered at runtime that are NOT listed
// in the fixtures file. New examples added to the markdown are covered
// automatically without having to touch the fixtures file.
// ---------------------------------------------------------------------------
test.describe("auto-discovered unlisted examples", () => {
	test("all unlisted slugs load without error", async ({page}) => {
		const unlisted = appLinks.filter(
			(l) => !exampleConfigBySlug.has(l.slug),
		);

		if (unlisted.length === 0) {
			console.log(
				"No unlisted examples — all discovered slugs are in the fixtures file.",
			);
			return;
		}

		for (const link of unlisted) {
			console.log(`Testing unlisted slug: ${link.slug}`);
			await runSmoke(
				page,
				rewriteToTestBranch(link.url, TEST_BRANCH),
				link.slug,
			);
		}
	});
});
