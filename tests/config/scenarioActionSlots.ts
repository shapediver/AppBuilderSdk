import {expect, Page} from "@playwright/test";
import {getParameterElement} from "../helpers/getParameterElement";
import {takeSnapshot} from "../helpers/takeSnapshot";
import {viewportCoords} from "../helpers/viewportCoords";
import {waitForModelRecomputed} from "../helpers/waitForModelRecomputed";

/**
 * E2E coverage for action slots (`public/example-actionSlots.json`,
 * `public/example-actionSlots-selection.json`).
 *
 * Full suite only (no `quickSuite` in scenarioActions.ts). Smoke + visual of
 * the slugs run in the quick suite.
 */

/** `example-actionSlots-selection`: selection and hover slots on one node. */
export async function actionSlotsSelectionActions(page: Page) {
	// Open area of the back panel. 0.49, 0.58 sits ~10px above a
	// shelf edge, so a small camera shift selects a shelf instead.
	const pos = await viewportCoords(page, 0.444, 0.347);
	await page.mouse.click(pos.x, pos.y);
	await expect(page.getByText("Selection changed")).toBeVisible();
	// selecton sets highlight colors and the hover slots do not, so
	// they are two interaction groups painting the same node. The
	// resulting red/blue/purple mix is not stable enough to snapshot.
	const away = await viewportCoords(page, 0.05, 0.02);
	await page.mouse.move(away.x, away.y);
	await expect(page.getByText("Hovered")).toBeHidden();
	await expect(page.getByText("Selection changed")).toBeVisible();
}

/** `example-actionSlots`: tab and parameter slots trigger computations. */
export async function actionSlotsActions(page: Page, slug: string) {
	await waitForModelRecomputed(page, async () => {
		await page.getByRole("tab", {name: "Show doors"}).click();
	});
	await takeSnapshot(page, `${slug}-show-doors`);

	await waitForModelRecomputed(page, async () => {
		await page.getByRole("tab", {name: "Hide doors"}).click();
	});
	await takeSnapshot(page, `${slug}-hide-doors`);

	const input = getParameterElement(page, "Length").getByRole("textbox");
	await waitForModelRecomputed(page, async () => {
		await input.fill("4");
		await input.press("Enter");
	});
	await takeSnapshot(page, `${slug}-computation`);
}
