import {defineConfig, devices} from "@playwright/test";

/**
 * Branch to test against. Override with TEST_BRANCH env var.
 * Corresponds to the version segment in the deployed URL:
 *   https://appbuilder.shapediver.com/v1/main/<branch>/
 */
const TEST_BRANCH = process.env.TEST_BRANCH ?? "testing";

export {TEST_BRANCH};

export default defineConfig({
	testDir: "./tests/specs",
	globalSetup: "./tests/global-setup",
	tsconfig: "./tests/tsconfig.json",
	// true — tests across files AND within files can run concurrently across workers.
	// Without this a single spec file uses only 1 worker regardless of the workers setting.
	fullyParallel: true,
	forbidOnly: !!process.env.CI,
	retries: process.env.CI ? 1 : 0,
	// Limit concurrency — too many parallel sessions may hit ShapeDiver API rate limits
	workers: process.env.CI ? 3 : 2,
	reporter: [["html", {open: "never"}], ["list"]],
	timeout: 120_000,
	// Baseline PNGs are stored here and committed to git.
	// Failed-run actuals and diffs land in test-results/ (already gitignored).
	snapshotDir: "./tests/snapshots",
	snapshotPathTemplate: "{snapshotDir}/{arg}{ext}",
	expect: {
		toHaveScreenshot: {
			// Allow up to 2% pixel difference — accounts for WebGL/GPU variation
			// across machines and OS. Tighten per-test via takeSnapshot options.
			maxDiffPixelRatio: 0.02,
		},
	},
	use: {
		// All tests share the same base; individual URLs are fully qualified
		baseURL: undefined,
		trace: "retain-on-failure",
		screenshot: "only-on-failure",
		video: "retain-on-failure",
		actionTimeout: 30_000,
		navigationTimeout: 60_000,
		// Snapshots always capture the full page
		viewport: {width: 1280, height: 800},
	},
	projects: [
		{
			name: "chromium",
			use: {...devices["Desktop Chrome"]},
		},
	],
});
