import {Page} from "@playwright/test";
import * as path from "path";
import {takeSnapshot} from "../helpers/takeSnapshot";

export interface TestConfig {
	slug: string;
	/**
	 * Optional pre-load setup steps executed after navigation but BEFORE
	 * waitForModelLoaded. Use this for anything the model needs to start
	 * loading at all — e.g. uploading a required input file.
	 * Runs in every test (smoke, visual, and interaction).
	 */
	setup?: (page: Page) => Promise<void>;
	/**
	 * Per-example interaction steps executed after the model has fully loaded.
	 * When defined, an interaction test is generated in addition to the smoke test.
	 * Call waitForModelLoaded again after any action that triggers a new computation.
	 * When undefined, only the smoke test (page loads, canvas visible, no JS errors) runs.
	 * @param page - Playwright Page
	 * @param slug - The slug of the example, use it to name snapshots: `${slug}-state.png`
	 */
	actions?: (page: Page, slug: string) => Promise<void>;
}

/**
 * Per-slug interaction definitions.
 *
 * Slugs not listed here automatically get a smoke-only test.
 * Add entries here when you want to assert specific behaviour beyond "it loads".
 *
 * Guidelines:
 *  - Use page.getByRole / page.getByLabel for UI controls (resilient to DOM changes).
 *  - After any action that triggers a compute, call waitForModelLoaded(page) again.
 *  - Keep interactions minimal — one meaningful user action per example is enough.
 */
export const testConfigs: TestConfig[] = [
	// Only slugs that need special setup or interaction tests are listed here.
	// All other tutorial slugs are smoke + visual tested automatically via the
	// catch-all in appbuilder.spec.ts.

	{
		slug: "appbuilder-tutorial2-contextualui",
		setup: async (page) => {
			// The "Floor Plan" parameter requires a file before the model can load.
			// Mantine FileInput renders a hidden <input type="file"> inside the
			// styled button — setInputFiles targets it directly without opening a
			// native file dialog, which is simpler and avoids filechooser timing issues.
			// path.resolve() uses process.cwd() (repo root) — __dirname is unavailable
			// in Playwright's ESM transform.
			await page
				.locator('input[type="file"]')
				.setInputFiles(
					path.resolve(
						"tests/fixtures/files/11B-AppBuilder_Tutorial2_ExampleInput.3dm",
					),
				);
		},
	},
	{
		slug: "11g-accordionandstackwidgets",
		actions: async (page, slug) => {
			// Expand the Accordion panel and capture it
			await page.getByRole("button", {name: "Accordion"}).click();
			await page
				.getByRole("region", {name: "Accordion"})
				.waitFor({state: "visible"});
			await takeSnapshot(page, `${slug}-accordion`);

			// Navigate into the Stack sub-view and capture it
			await page.getByRole("button", {name: "Stack"}).click();
			await page
				.getByRole("button", {name: "Back"})
				.waitFor({state: "visible"});
			await takeSnapshot(page, `${slug}-stack`);
		},
	},
];

/** Fast lookup by slug */
export const testConfigBySlug = new Map<string, TestConfig>(
	testConfigs.map((c) => [c.slug, c]),
);
