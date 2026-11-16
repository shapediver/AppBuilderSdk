import {expect, Page} from "@playwright/test";
import {getParameterElement} from "../helpers/getParameterElement";
import {waitForModelRecomputed} from "../helpers/waitForModelRecomputed";

/**
 * E2E coverage for `settings.decimalplaces` (SS-10216,
 * `public/example-decimalplaces.json`): the "Board Height" parameter (Float,
 * 3 decimal places, -1 to 1) is shown three times, without the setting, with
 * 0 decimal places (accordion parameter) and with 1 decimal place (parameter
 * control).
 */
export async function decimalplacesSettingActions(page: Page) {
	const input = (name: string) =>
		getParameterElement(page, name).getByRole("textbox");
	const model = input("Board Height (model)");
	const none = input("Board Height (0 decimal places)");
	const one = input("Board Height (1 decimal place)");

	await expect(model).toHaveValue("0.000");
	await expect(none).toHaveValue("0");
	await expect(one).toHaveValue("0.0");

	// The control with 1 decimal place takes no second decimal.
	await waitForModelRecomputed(page, async () => {
		await one.fill("0.4");
		await one.press("Enter");
	});
	await expect(model).toHaveValue("0.400");
	await expect(one).toHaveValue("0.4");
	await expect(none).toHaveValue("0");

	// The parameter with 0 decimal places commits whole numbers only.
	await waitForModelRecomputed(page, async () => {
		await none.fill("1");
		await none.press("Enter");
	});
	await expect(model).toHaveValue("1.000");
	await expect(none).toHaveValue("1");
	await expect(one).toHaveValue("1.0");
}
