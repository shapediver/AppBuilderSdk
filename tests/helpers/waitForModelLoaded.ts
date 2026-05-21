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
export async function waitForModelLoaded(
	page: Page,
	timeout = 90_000,
): Promise<void> {
	// Step 1: React-level loader gone — Mantine Loader renders with data-component="Loader"
	await page
		.locator('[data-component="Loader"]')
		.waitFor({state: "hidden", timeout});

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
	// and no viewport is in busy mode.
	await page.waitForFunction(
		() => {
			const sdv = (window as any).SDV;
			if (!sdv?.viewports) return false;
			const vps = Object.values(sdv.viewports) as any[];
			return vps.length > 0 && vps.every((vp) => !vp.busy);
		},
		{timeout, polling: 500},
	);
}
