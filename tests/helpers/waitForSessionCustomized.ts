import {Page} from "@playwright/test";

/**
 * Waits for the ShapeDiver SESSION_CUSTOMIZED event after an action that
 * triggers a recomputation (e.g. a file upload or parameter change).
 *
 * The listener is registered BEFORE the action runs so the event can never
 * be missed, even if the computation finishes synchronously.
 *
 * Usage:
 *   await waitForSessionCustomized(page, async () => {
 *     await page.locator('input[type="file"]').setInputFiles(filePath, {force: true});
 *   });
 *
 * @param page    - Playwright Page
 * @param action  - async callback that triggers the computation
 * @param timeout - max time to wait for the event in ms (default 90 s)
 */
export async function waitForSessionCustomized(
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
