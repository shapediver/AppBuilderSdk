import {expect, Page} from "@playwright/test";
import {getParameterElement} from "../helpers/getParameterElement";
import {takeSnapshot} from "../helpers/takeSnapshot";
import {viewportCoords} from "../helpers/viewportCoords";
import {waitForModelRecomputed} from "../helpers/waitForModelRecomputed";
import type {ScenarioNamedAction} from "./scenarioActions";

/**
 * E2E coverage for action slots (`public/example-actionSlots.json`,
 * `public/example-actionSlots-selection.json`,
 * `public/example-actionSlots-parameter.json`).
 *
 * Full suite only (no `quickSuite` in scenarioActions.ts). Smoke + visual of
 * the slugs run in the quick suite.
 */

/** `example-actionSlots-selection`: selection and hover slots on one node. */
export async function actionSlotsSelectionActions(page: Page) {
	await expect(page.getByText("Selection and hover slots")).toBeVisible();
	// Open area of the back panel. 0.49, 0.58 sits ~10px above a
	// shelf edge, so a small camera shift selects a shelf instead.
	const pos = await viewportCoords(page, 0.444, 0.347);
	await page.mouse.move(pos.x, pos.y);
	await expect(page.getByText("The part under the pointer")).toBeVisible();
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

/**
 * `example-actionSlots-parameter` (SS-10191): `computationstart` /
 * `computationend` on parameter controls. Every anchor opens once and
 * stays open (nothing closes it), so each case starts with a fresh page.
 */
// The description repeats the anchor texts in italics, so look for headings.
const anchorHeading = (page: Page, name: string) =>
	page.getByRole("heading", {name, exact: true});
const lengthStarted = (page: Page) => anchorHeading(page, "Length started");
const lengthComputed = (page: Page) => anchorHeading(page, "Length computed");
const doorComputed = (page: Page) => anchorHeading(page, "Door computed");
const rootComputed = (page: Page) => anchorHeading(page, "Root computed");

async function expectNoSlotRan(page: Page) {
	await expect(lengthStarted(page)).toBeHidden();
	await expect(lengthComputed(page)).toBeHidden();
	await expect(doorComputed(page)).toBeHidden();
	await expect(rootComputed(page)).toBeHidden();
}

export const actionSlotsParameterNamedActions: ScenarioNamedAction[] = [
	{
		name: "runs the slots of the changed parameter only",
		run: async (page, slug) => {
			await expectNoSlotRan(page);

			const input = getParameterElement(page, "Length").getByRole(
				"textbox",
			);
			await waitForModelRecomputed(page, async () => {
				await input.fill("4");
				await input.press("Enter");
			});

			// Length ran its slots, and so did the root slot. Hide Door was not
			// part of the computation, so its slot stays silent.
			await expect(lengthStarted(page)).toBeVisible();
			await expect(lengthComputed(page)).toBeVisible();
			await expect(rootComputed(page)).toBeVisible();
			await expect(doorComputed(page)).toBeHidden();
			await takeSnapshot(page, `${slug}-length`);
		},
	},
	{
		name: "runs the slots of every parameter of one computation",
		run: async (page, slug) => {
			await expectNoSlotRan(page);

			// setParameterValues sends Length and Hide Door together, even in
			// accept/reject mode.
			await waitForModelRecomputed(page, async () => {
				await page.getByRole("button", {name: "Change both"}).click();
			});

			await expect(lengthStarted(page)).toBeVisible();
			await expect(lengthComputed(page)).toBeVisible();
			await expect(doorComputed(page)).toBeVisible();
			await expect(rootComputed(page)).toBeVisible();
			await takeSnapshot(page, `${slug}-both`);
		},
	},
	{
		name: "accept/reject mode runs the slots when the change is accepted",
		run: async (page, slug) => {
			await expectNoSlotRan(page);

			const doorControl = getParameterElement(page, "Hide Door");
			const accept = doorControl.getByRole("button", {name: "Accept"});
			const reject = doorControl.getByRole("button", {name: "Reject"});

			// Queuing a change runs nothing, and rejecting it runs nothing.
			await doorControl.locator('input[type="checkbox"]').click({
				force: true,
			});
			await expect(accept).toBeVisible();
			await page.waitForTimeout(1_500);
			await expectNoSlotRan(page);
			await reject.click();
			await expect(accept).toBeHidden();
			await page.waitForTimeout(1_500);
			await expectNoSlotRan(page);

			// Accepting the change computes it and runs the slots.
			await doorControl.locator('input[type="checkbox"]').click({
				force: true,
			});
			await expect(accept).toBeVisible();
			await waitForModelRecomputed(page, async () => {
				await accept.click();
			});

			await expect(doorComputed(page)).toBeVisible();
			await expect(rootComputed(page)).toBeVisible();
			// Length was not part of the computation.
			await expect(lengthStarted(page)).toBeHidden();
			await expect(lengthComputed(page)).toBeHidden();
			await takeSnapshot(page, `${slug}-accepted`);
		},
	},
];

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
