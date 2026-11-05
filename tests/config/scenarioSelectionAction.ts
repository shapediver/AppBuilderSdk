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
 * E2E coverage for the `selection` action (SS-10192): toolbar buttons of
 * `public/example-selectionAction.json` select and deselect nodes of the
 * `SelectBox` selection parameter (model `selectioninput-basic-alwaysactive-11-2`,
 * nodes `Boxes.box_1`, `Boxes.box_2`, `Boxes.box_3`, `maximumSelection: 2`).
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

export const scenarioSelectionActionNamedActions: ScenarioNamedAction[] = [
	{
		name: "simple: a wildcard selects the first matches up to the maximum",
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
			expect(errors.errors()).toEqual([]);
		},
	},
	{
		name: "complex: select, replace and deselect go through the parameter",
		run: async (page) => {
			const puts = trackCustomizations(page);
			const errors = collectPageErrors(page);

			// one box does not fill the selection: a draft waits for Confirm
			await actionButton(page, "Select box 1").click();
			await settle(page);
			expect(puts.count()).toBe(0);
			await expect(confirmButton(page)).toBeEnabled();

			// the box targeted by select replaces the others deselected by
			// the wildcard, the box in both lists stays selected
			await actionButton(page, "Only box 3").click();
			await settle(page);
			expect(puts.count()).toBe(0);
			await waitForModelRecomputed(page, async () => {
				await confirmButton(page).click();
			});
			expect(puts.count()).toBe(1);
			expect(committedNames(puts.last())).toEqual(["Boxes.box_3"]);

			// deselect only, limited to the parameter by its name
			await actionButton(page, "Deselect all").click();
			await settle(page);
			expect(puts.count()).toBe(1);
			await waitForModelRecomputed(page, async () => {
				await confirmButton(page).click();
			});
			expect(puts.count()).toBe(2);
			expect(committedNames(puts.last())).toEqual([]);
			expect(errors.errors()).toEqual([]);
		},
	},
];
