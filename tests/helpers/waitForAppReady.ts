import {Page} from "@playwright/test";

/** Waits until the standard ShapeDiver AppBuilder page is ready to use. */
export async function waitForAppReady(
	page: Page,
	options: {
		timeout?: number;
		interstitial?: (page: Page) => Promise<void>;
	} = {},
): Promise<void> {
	const {timeout = 90_000, interstitial} = options;

	await page
		.locator('[data-component="Loader"]')
		.waitFor({state: "hidden", timeout});

	if (interstitial) await interstitial(page);

	await page.waitForFunction(
		() => {
			const canvas = document.querySelector("canvas");
			if (!canvas) return false;
			const rect = canvas.getBoundingClientRect();
			return rect.width > 0 && rect.height > 0;
		},
		undefined,
		{timeout, polling: 2_000},
	);

	await page.waitForFunction(
		() => !!(window as any).SDV?.viewports,
		undefined,
		{timeout, polling: 100},
	);
	await page.evaluate(() => {
		const SDV = (window as any).SDV;
		const viewports = Object.values(SDV.viewports ?? {}) as any[];
		const state = {
			startedAt: Date.now(),
			beautyRenderFinishedAt: 0,
			busyFreeSince: 0,
			lastBusyOnAt: 0,
			lastBusyOffAt: 0,
			beautyRenderToken: "",
			busyOnToken: "",
			busyOffToken: "",
		};

		if (
			viewports.some(
				(viewport) =>
					viewport.busy === true || viewport.isBusy === true,
			)
		) {
			state.lastBusyOnAt = Date.now();
		}

		state.beautyRenderToken = SDV.addListener(
			SDV.EVENTTYPE?.RENDERING?.BEAUTY_RENDERING_FINISHED ??
				"rendering.beautyRenderingFinished",
			() => {
				const currentViewports = Object.values(
					SDV.viewports ?? {},
				) as any[];
				if (
					currentViewports.every(
						(viewport) =>
							viewport.busy !== true && viewport.isBusy !== true,
					)
				) {
					state.beautyRenderFinishedAt = Date.now();
				}
			},
		);
		state.busyOnToken = SDV.addListener(
			SDV.EVENTTYPE?.VIEWPORT?.BUSY_MODE_ON ?? "viewport.busy.on",
			() => {
				state.beautyRenderFinishedAt = 0;
				state.busyFreeSince = 0;
				state.lastBusyOnAt = Date.now();
			},
		);
		state.busyOffToken = SDV.addListener(
			SDV.EVENTTYPE?.VIEWPORT?.BUSY_MODE_OFF ?? "viewport.busy.off",
			() => {
				state.busyFreeSince = 0;
				state.lastBusyOffAt = Date.now();
			},
		);

		(window as any).__sdvAppReady = state;
	});

	try {
		await page.waitForFunction(
			() => {
				const SDV = (window as any).SDV;
				const state = (window as any).__sdvAppReady;
				const viewports = Object.values(SDV?.viewports ?? {}) as any[];
				if (!state || viewports.length === 0) return false;

				const allViewportsIdle = viewports.every(
					(viewport) =>
						viewport.busy !== true && viewport.isBusy !== true,
				);
				if (!allViewportsIdle) {
					state.beautyRenderFinishedAt = 0;
					state.busyFreeSince = 0;
					state.lastBusyOnAt = Date.now();
					return false;
				}

				const now = Date.now();
				if (!state.busyFreeSince) {
					state.busyFreeSince = now;
					return false;
				}

				const lastModelEventAt = Math.max(
					state.startedAt,
					state.lastBusyOnAt,
					state.lastBusyOffAt,
				);
				if (
					state.beautyRenderFinishedAt >= lastModelEventAt &&
					now -
						Math.max(
							state.beautyRenderFinishedAt,
							state.busyFreeSince,
						) >=
						500
				)
					return true;

				return (
					now - Math.max(lastModelEventAt, state.busyFreeSince) >=
					2_000
				);
			},
			undefined,
			{timeout, polling: 100},
		);
	} finally {
		await page.evaluate(() => {
			const SDV = (window as any).SDV;
			const state = (window as any).__sdvAppReady;
			if (state) {
				if (state.beautyRenderToken)
					SDV.removeListener(state.beautyRenderToken);
				if (state.busyOnToken) SDV.removeListener(state.busyOnToken);
				if (state.busyOffToken) SDV.removeListener(state.busyOffToken);
			}
			delete (window as any).__sdvAppReady;
		});
	}
}
