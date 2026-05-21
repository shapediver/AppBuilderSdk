import {expect, Page} from "@playwright/test";
import * as fs from "fs";
import * as path from "path";

/**
 * Takes a full-page screenshot and compares it against the stored baseline.
 *
 * Baseline PNGs live in tests/snapshots/ and are committed to git.
 * On the first run (no baseline yet) the screenshot is written as the new
 * baseline and the test passes — no manual --update-snapshots step required.
 * On subsequent runs a pixel diff is performed; the test fails if the
 * difference exceeds maxDiffPixelRatio.
 *
 * To intentionally update baselines after a UI change:
 *   pnpm test-e2e-update-snapshots
 */
export async function takeSnapshot(
	page: Page,
	slug: string,
	options: {
		/**
		 * Maximum ratio of differing pixels (0–1).
		 * 0.02 = allow up to 2% of pixels to differ.
		 * WebGL canvas renders can vary slightly across GPU/OS combinations,
		 * so a small tolerance avoids false positives on CI.
		 */
		maxDiffPixelRatio?: number;
	} = {},
) {
	const {maxDiffPixelRatio = 0.02} = options;

	// Baseline path must match snapshotDir + snapshotPathTemplate in playwright.config.ts:
	//   snapshotDir: "./tests/snapshots"
	//   snapshotPathTemplate: "{snapshotDir}/{arg}{ext}"
	const baselinePath = path.resolve(`tests/snapshots/${slug}.png`);

	if (!fs.existsSync(baselinePath)) {
		// No baseline yet — take screenshot, write it, and pass.
		// This avoids the default Playwright behaviour of failing on first run.
		const screenshot = await page.screenshot({fullPage: true});
		fs.mkdirSync(path.dirname(baselinePath), {recursive: true});
		fs.writeFileSync(baselinePath, screenshot);
		console.log(`[takeSnapshot] New baseline written: ${baselinePath}`);
		return;
	}

	// Baseline exists — do the normal pixel diff.
	await expect(page).toHaveScreenshot(`${slug}.png`, {
		fullPage: true,
		maxDiffPixelRatio,
	});
}
