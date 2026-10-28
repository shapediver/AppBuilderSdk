import {Page} from "@playwright/test";
import {getParameterElement} from "../helpers/getParameterElement";
import {takeSnapshot} from "../helpers/takeSnapshot";
import {viewportCoords} from "../helpers/viewportCoords";
import {waitForModelRecomputed} from "../helpers/waitForModelRecomputed";

/**
 * E2E coverage for `settings.resetValue`: the model sends a value back that
 * resets a parameter after it was committed.
 *
 * Full suite only (no `quickSuite` in scenarioActions.ts). Smoke + visual of
 * the slugs run in the quick suite.
 */

/** `textinput-resetvalue-3`: multiline text input committed with Tab. */
export async function textInputResetValueActions(page: Page, slug: string) {
	const textarea = getParameterElement(page, "textInput").getByRole(
		"textbox",
	);
	await waitForModelRecomputed(page, async () => {
		await textarea.fill("Default\nExample\nTest");
		await textarea.press("Tab");
	});
	await takeSnapshot(page, `${slug}-newValue`);
}

/**
 * `selectioninput-resetvalue-6` and `selectioninput-resetvalue-dynamic-3`:
 * select an object in the viewport, then change a color parameter.
 * Use with `example-simple-interaction-colors.json` so the selection is
 * painted in plain colors; the default pulsing effect never gives two equal
 * screenshots in a row.
 */
export async function selectionInputResetValueActions(
	page: Page,
	slug: string,
) {
	const pos = await viewportCoords(page, 0.64, 0.554);
	await waitForModelRecomputed(page, async () => {
		await page.mouse.click(pos.x, pos.y);
	});
	await takeSnapshot(page, `${slug}-select`);

	await waitForModelRecomputed(page, async () => {
		// change one of the color params
		const colorParam = getParameterElement(page, "Box Color").getByRole(
			"textbox",
		);
		await colorParam.fill("#ff0000");
		await colorParam.press("Enter");
	});
	await takeSnapshot(page, `${slug}-changedColor`);
}
