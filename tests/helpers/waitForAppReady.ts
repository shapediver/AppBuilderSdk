import {Page} from "@playwright/test";

/**
 * Waits until the ShapeDiver App Builder has fully loaded.
 *
 * What this does step by step:
 *   1. Wait for the loading spinner to disappear.
 *   1b. Run optional setup (e.g. file upload) before geometry checks.
 *   2. Check that a <canvas> element is visible with non-zero dimensions.
 *   3. Wait until all 3D viewports finish computing (no longer "busy").
 *
 * Use this before every screenshot or interaction to make sure
 * the app is ready and the 3D model is fully rendered.
 */
export async function waitForAppReady(
	page: Page,
	options: {
		timeout?: number;
		/**
		 * Called after the Mantine session loader disappears (step 1) but before
		 * the canvas and viewport-busy checks (steps 2-3). Intended for setup
		 * actions that must be performed after the session is established but
		 * that are required for the model to produce any geometry at all —
		 * e.g. uploading a required file parameter.
		 */
		interstitial?: (page: Page) => Promise<void>;
	} = {},
): Promise<void> {
	const {timeout = 90_000, interstitial} = options;
	// Step 1: React-level loader gone — Mantine Loader renders with data-component="Loader"
	await page
		.locator('[data-component="Loader"]')
		.waitFor({state: "hidden", timeout});

	// Step 1b: Optional interstitial — session is ready.
	// Useful for uploading a file before the model starts computing.
	if (interstitial) await interstitial(page);

	// Step 2: Canvas must be visible with dimensions.
	const CANVAS_POLL_MS = 2_000;
	const CANVAS_TIMEOUT_MS = 60_000;
	await page.waitForFunction(
		() => {
			const canvas = document.querySelector("canvas");
			if (!canvas) return false;
			const rect = canvas.getBoundingClientRect();
			return rect.width > 0 && rect.height > 0;
		},
		{timeout: CANVAS_TIMEOUT_MS, polling: CANVAS_POLL_MS},
	);

	// Step 3: All viewports must be not-busy for 500 ms.
	// The debounce catches models that briefly exit busy mode between passes.
	await page.waitForFunction(
		() => {
			const sdv = (window as any).SDV;
			if (!sdv?.viewports) return false;
			const vps = Object.values(sdv.viewports) as any[];
			if (vps.length === 0) return false;

			if (!vps.every((vp) => !vp.busy)) {
				// Still busy — reset the stable-start timestamp.
				(window as any).__sdvBusyFreeStart = undefined;
				return false;
			}

			// Viewports are currently not-busy. Record when stability began.
			const now = Date.now();
			if (!(window as any).__sdvBusyFreeStart) {
				(window as any).__sdvBusyFreeStart = now;
				return false;
			}

			// Return true only after 500 ms of uninterrupted not-busy state.
			return now - (window as any).__sdvBusyFreeStart >= 500;
		},
		{timeout, polling: 100},
	);
}
