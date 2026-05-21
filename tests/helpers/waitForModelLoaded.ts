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

	// Step 2: Wait until window.SDV is available, at least one viewport exists,
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
