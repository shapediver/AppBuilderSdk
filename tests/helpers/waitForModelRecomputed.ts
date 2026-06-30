import {Page} from "@playwright/test";

/**
 * Performs an action and waits for the 3D model to finish recalculating.
 *
 * Use this when your action (slider change, text input, button click, etc.)
 * triggers a Grasshopper recomputation. Without this, screenshots taken
 * right after the action may show the old geometry.
 *
 * The listener is registered BEFORE the action runs so the event can never
 * be missed, even if the computation finishes instantly.
 *
 * Usage:
 *   await waitForModelRecomputed(page, async () => {
 *     await page.getByRole("button", {name: "Update"}).click();
 *   });
 *
 * @param page    - Playwright Page
 * @param action  - async callback that triggers the computation
 * @param timeout - max time to wait in ms (default 90 s)
 */
export async function waitForModelRecomputed(
	page: Page,
	action: () => Promise<void>,
	timeout = 90_000,
): Promise<void> {
	// Plant a flag on window BEFORE triggering the action so the event can't
	// be missed if the computation completes before waitForFunction starts polling.
	await page.evaluate(() => {
		(window as any).__sdvSessionCustomized = false;
		const SDV = (window as any).SDV;
		const token = SDV.addListener("session.customized", () => {
			(window as any).__sdvSessionCustomized = true;
			SDV.removeListener(token);
		});
	});

	await action();

	await page.waitForFunction(
		() => (window as any).__sdvSessionCustomized === true,
		{timeout},
	);

	// Clean up the flag
	await page.evaluate(() => {
		delete (window as any).__sdvSessionCustomized;
	});
}
