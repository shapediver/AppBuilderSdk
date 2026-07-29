import {Page} from "@playwright/test";

/**
 * Performs an action and waits for the 3D model to finish recalculating and
 * for its final beauty render to complete.
 *
 * Use this when your action (slider change, text input, button click, etc.)
 * triggers a Grasshopper recomputation. Without this, screenshots taken
 * right after the action may show the old geometry.
 *
 * Both listeners are registered BEFORE the action runs. The beauty-render
 * event is only accepted after `session.customized`, so a render already in
 * progress cannot make the helper resolve early.
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
	await page.evaluate(() => {
		const SDV = (window as any).SDV;
		const state = {
			customized: false,
			beautyRenderFinished: false,
			customizationToken: "",
			beautyRenderToken: "",
		};

		(window as any).__sdvModelRecomputed = state;

		state.customizationToken = SDV.addListener(
			SDV.EVENTTYPE?.SESSION?.SESSION_CUSTOMIZED ?? "session.customized",
			() => {
				state.customized = true;
			},
		);
		state.beautyRenderToken = SDV.addListener(
			SDV.EVENTTYPE?.RENDERING?.BEAUTY_RENDERING_FINISHED ??
				"rendering.beautyRenderingFinished",
			() => {
				if (state.customized) state.beautyRenderFinished = true;
			},
		);
	});

	try {
		await action();

		await page.waitForFunction(
			() => {
				const state = (window as any).__sdvModelRecomputed;
				return state?.customized === true && state?.beautyRenderFinished === true;
			},
			{timeout},
		);
	} finally {
		await page.evaluate(() => {
			const SDV = (window as any).SDV;
			const state = (window as any).__sdvModelRecomputed;

			if (state) {
				SDV.removeListener(state.customizationToken);
				SDV.removeListener(state.beautyRenderToken);
			}
			delete (window as any).__sdvModelRecomputed;
		});
	}
}
