import {Page} from "@playwright/test";

/**
 * Waits until the ShapeDiver App Builder has fully loaded:
 *
 *   1. The React-level LoaderPage (Mantine <Loader>) has disappeared,
 *      meaning the session API is ready and the viewport is mounted.
 *
 *   2. All ShapeDiver viewports have exited busy mode, meaning geometry
 *      computation is complete and the 3D scene is rendered.
 *
 * Both conditions are checked against window.SDV, which is exposed by
 * AppBuilderBase.tsx as a combination of @shapediver/viewer.session and
 * @shapediver/viewer.viewport exports.
 *
 * Event reference:
 *   EVENTTYPE_VIEWPORT.VIEWPORT_VISIBLE = "viewport.visible"
 *   EVENTTYPE_VIEWPORT.BUSY_MODE_OFF    = "viewport.busy.off"
 */
/**
 * Waits until the ShapeDiver App Builder has fully loaded:
 *
 *   1. The React-level LoaderPage (Mantine <Loader>) has disappeared,
 *      meaning the session API is ready and the viewport is mounted.
 *
 *   1b. Optional interstitial callback — runs immediately after the session is
 *       ready but before the canvas/busy checks. Use this for any input the
 *       model needs before it can start computing (e.g. uploading a file).
 *
 *   2. The <canvas> element is visible with non-zero dimensions.
 *
 *   3. All ShapeDiver viewports have exited busy mode, meaning geometry
 *      computation is complete and the 3D scene is rendered.
 */
export async function waitForModelLoaded(
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

	// Step 1b: Optional interstitial — session is ready, file inputs are in the DOM.
	// Run any pre-compute setup (e.g. file upload) before checking canvas/busy state.
	if (interstitial) await interstitial(page);

	// Step 2: Canvas element must be visible — poll every 2 s for up to 60 s.
	// Fails immediately if the canvas never appears (e.g. WebGL blocked or layout broken).
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

	// Step 3: Wait until window.SDV is available, at least one viewport exists,
	// and all viewports have been continuously not-busy for 500 ms.
	// The debounce catches models that briefly exit busy mode between render
	// passes (e.g. an initial SESSION_CUSTOMIZED triggers a second computation
	// immediately after the first finishes).
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
