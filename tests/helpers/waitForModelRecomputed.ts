import {Page} from "@playwright/test";

/**
 * Performs an action and waits for the resulting model computation to settle.
 *
 * A `session.customized` event alone is too early when AppBuilder instances are
 * involved. Any busy cycle invalidates an earlier beauty render, so a normal
 * rendering path waits for a beauty render after the final busy cycle. Some
 * continuously rendered viewports never emit beauty-finished; they use the
 * longer uninterrupted idle fallback instead.
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
			beautyRenderFinishedAt: 0,
			busyFreeSince: 0,
			lastBusyOnAt: 0,
			lastBusyOffAt: 0,
			lastCustomizationAt: 0,
			customizationToken: "",
			beautyRenderToken: "",
			busyOnToken: "",
			busyOffToken: "",
		};

		(window as any).__sdvModelRecomputed = state;

		const viewports = Object.values(SDV.viewports ?? {}) as any[];
		if (
			viewports.some(
				(viewport) =>
					viewport.busy === true || viewport.isBusy === true,
			)
		) {
			state.lastBusyOnAt = Date.now();
		}

		state.customizationToken = SDV.addListener(
			SDV.EVENTTYPE?.SESSION?.SESSION_CUSTOMIZED ?? "session.customized",
			() => {
				state.customized = true;
				state.beautyRenderFinished = false;
				state.beautyRenderFinishedAt = 0;
				state.busyFreeSince = 0;
				state.lastCustomizationAt = Date.now();
			},
		);
		state.beautyRenderToken = SDV.addListener(
			SDV.EVENTTYPE?.RENDERING?.BEAUTY_RENDERING_FINISHED ??
				"rendering.beautyRenderingFinished",
			() => {
				const currentViewports = Object.values(
					SDV.viewports ?? {},
				) as any[];
				const allViewportsIdle = currentViewports.every(
					(viewport) =>
						viewport.busy !== true && viewport.isBusy !== true,
				);
				if (state.customized && allViewportsIdle) {
					state.beautyRenderFinished = true;
					state.beautyRenderFinishedAt = Date.now();
				}
			},
		);
		state.busyOnToken = SDV.addListener(
			SDV.EVENTTYPE?.VIEWPORT?.BUSY_MODE_ON ?? "viewport.busy.on",
			() => {
				state.beautyRenderFinished = false;
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
	});

	try {
		await action();

		await page.waitForFunction(
			() => {
				const state = (window as any).__sdvModelRecomputed;
				if (!state?.customized) return false;

				const viewports = Object.values(
					(window as any).SDV?.viewports ?? {},
				) as any[];
				if (viewports.length === 0) return false;
				const allViewportsIdle = viewports.every(
					(viewport) =>
						viewport.busy !== true && viewport.isBusy !== true,
				);
				if (!allViewportsIdle) {
					// Fallback for bundles which do not emit viewport busy events.
					state.beautyRenderFinished = false;
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
					state.lastCustomizationAt,
					state.lastBusyOnAt,
					state.lastBusyOffAt,
				);
				if (
					state.beautyRenderFinished &&
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
			{timeout},
		);
	} finally {
		await page.evaluate(() => {
			const SDV = (window as any).SDV;
			const state = (window as any).__sdvModelRecomputed;
			if (state) {
				if (state.customizationToken)
					SDV.removeListener(state.customizationToken);
				if (state.beautyRenderToken)
					SDV.removeListener(state.beautyRenderToken);
				if (state.busyOnToken) SDV.removeListener(state.busyOnToken);
				if (state.busyOffToken) SDV.removeListener(state.busyOffToken);
			}
			delete (window as any).__sdvModelRecomputed;
		});
	}
}
