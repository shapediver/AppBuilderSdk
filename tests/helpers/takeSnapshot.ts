import {expect, Page} from "@playwright/test";

/**
 * Takes a full-page screenshot and compares it against the stored baseline.
 *
 * Baseline PNGs live in tests/snapshots/ and are committed to git.
 * On the first run (no baseline yet) Playwright writes the screenshot and
 * the test passes — that becomes the new baseline.
 * On subsequent runs a pixel diff is performed; the test fails if the
 * difference exceeds maxDiffPixelRatio.
 *
 * To intentionally update baselines after a UI change:
 *   pnpm test-e2e:update-snapshots
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

	await expect(page).toMatchSnapshot(`${slug}.png`, {maxDiffPixelRatio});
}
