import {expect, Page} from "@playwright/test";
import {confirmButton, settle} from "../helpers/interactionExamples";
import {
	collectPageErrors,
	trackCustomizations,
	transformValueFromBody,
} from "../helpers/sceneCoords";
import {waitForModelRecomputed} from "../helpers/waitForModelRecomputed";
import type {ScenarioNamedAction} from "./scenarioActions";

/**
 * E2E coverage for the `selection` action (SS-10192) on
 * `public/example-selectionAction.json` (model
 * `selectioninput-basic-alwaysactive-11-2`, nodes `Boxes.box_1`,
 * `Boxes.box_2`, `Boxes.box_3`).
 *
 * Without `parameter`, the action changes the root `selecton` / `selectoff`
 * group (`nameFilter: Boxes.*`, `maximumSelection: 2`). `selecton` toggles
 * the "Root selection" anchor; `selectoff` closes it. The SelectBox parameter
 * is not customized.
 *
 * With `parameter`, the action changes SelectBox (`maximumSelection: 2`) and
 * leaves the root anchor alone.
 *
 * Full suite only (no `quickSuite` in scenarioActions.ts).
 */

const PARAMETER = "SelectBox";

const actionButton = (page: Page, name: string) =>
	page.getByRole("button", {name, exact: true});

/** The selection committed by the last customization request. */
const committedNames = (body: string) =>
	transformValueFromBody(body, PARAMETER).names;

/** Warnings of the selection action written to the browser console. */
function collectSelectionWarnings(page: Page) {
	const warnings: string[] = [];
	page.on("console", (message) => {
		if (message.text().includes("Selection action:")) {
			warnings.push(message.text());
		}
	});
	return {warnings: () => [...warnings]};
}

const rootSelection = (page: Page) =>
	page.getByRole("heading", {name: "Root selection"});

export const scenarioSelectionActionNamedActions: ScenarioNamedAction[] = [
	{
		name: "simple: without a parameter the root selection changes and the parameter does not",
		run: async (page) => {
			const puts = trackCustomizations(page);
			const errors = collectPageErrors(page);

			await actionButton(page, "Select box 1").click();
			await settle(page);
			await expect(rootSelection(page)).toBeVisible();
			expect(puts.count()).toBe(0);

			// the same selection does not run selecton again (the anchor toggles)
			await actionButton(page, "Select box 1").click();
			await settle(page);
			await expect(rootSelection(page)).toBeVisible();
			expect(puts.count()).toBe(0);

			await actionButton(page, "Deselect scene").click();
			await settle(page);
			await expect(rootSelection(page)).toBeHidden();
			expect(puts.count()).toBe(0);
			expect(errors.errors()).toEqual([]);
		},
	},
	{
		name: "complex: a named parameter selects, replaces and deselects",
		run: async (page) => {
			const puts = trackCustomizations(page);
			const errors = collectPageErrors(page);
			const logs = collectSelectionWarnings(page);

			// three boxes match, two fit: the selection is full and commits
			// by itself, like a user selection of the second box
			await waitForModelRecomputed(page, async () => {
				await actionButton(page, "Select all").click();
			});
			expect(puts.count()).toBe(1);
			expect(committedNames(puts.last())).toEqual([
				"Boxes.box_1",
				"Boxes.box_2",
			]);
			expect(logs.warnings()).toHaveLength(1);
			await expect(rootSelection(page)).toBeHidden();

			// the box targeted by select replaces the others deselected by
			// the wildcard, the box in both lists stays selected
			await actionButton(page, "Only box 3").click();
			await settle(page);
			expect(puts.count()).toBe(1);
			await expect(confirmButton(page)).toBeEnabled();
			await waitForModelRecomputed(page, async () => {
				await confirmButton(page).click();
			});
			expect(puts.count()).toBe(2);
			expect(committedNames(puts.last())).toEqual(["Boxes.box_3"]);

			await actionButton(page, "Deselect parameter").click();
			await settle(page);
			expect(puts.count()).toBe(2);
			await waitForModelRecomputed(page, async () => {
				await confirmButton(page).click();
			});
			expect(puts.count()).toBe(3);
			expect(committedNames(puts.last())).toEqual([]);
			await expect(rootSelection(page)).toBeHidden();
			expect(errors.errors()).toEqual([]);
		},
	},
];
