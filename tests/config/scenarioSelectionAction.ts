import {expect, Page} from "@playwright/test";
import {
	cancelButton,
	confirmButton,
	gestures,
	settle,
} from "../helpers/interactionExamples";
import {
	collectPageErrors,
	type CustomizationTracker,
	isIdentity,
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

/**
 * E2E coverage for the `selection` action on exclusive rectangle transforms
 * (SS-10192 with SS-10334) on `public/example-selectionAction-exclusive.json`
 * (testing-account model `ss-10024-one-parameter-per-box-2`). RectOriginal
 * transforms `box_original`, RectTranslated `box_translated`; both are
 * exclusive with `minimumSelection: 1` and offer Confirm / Cancel (shown as
 * soon as a box is selected: the new gizmo reports its placement).
 *
 * The boxes of `example-selectionAction.json` are claimed by SelectBox and
 * the root slots, so a rectangle transform there would be blocked by the
 * interaction ownership. This example uses its own model.
 */

const ORIGINAL = {box: "box_original", parameter: "RectOriginal"};
const TRANSLATED = {box: "box_translated", parameter: "RectTranslated"};

/** Rectangles shown in the viewport (one scene root child per gizmo). */
const shownRectangles = (page: Page) =>
	page.evaluate(
		() =>
			(window as any).SDV.sceneTree.root.children.filter(
				(child: {name: string}) =>
					child.name === "RectangleTransformDTParent",
			).length,
	);

/** The last request carries a real transformation of the box. */
const expectBoxSent = (
	puts: CustomizationTracker,
	{box, parameter}: {box: string; parameter: string},
) => {
	const value = transformValueFromBody(puts.last(), parameter);
	const index = value.names.indexOf(`Boxes.${box}`);
	expect(index, JSON.stringify(value)).toBeGreaterThanOrEqual(0);
	expect(isIdentity(value.transformations[index])).toBe(false);
};

/** Gizmo drags and computations on CI runners, see interactionExampleScenarios. */
const EXCLUSIVE_TEST_TIMEOUT = 420_000;

export const scenarioSelectionActionExclusiveNamedActions: ScenarioNamedAction[] =
	[
		{
			name: "simple: the action selects an exclusive rectangle transform like a click",
			timeout: EXCLUSIVE_TEST_TIMEOUT,
			run: async (page) => {
				const puts = trackCustomizations(page);
				const errors = collectPageErrors(page);
				await settle(page);
				// an exclusive parameter selects nothing on load
				expect(await shownRectangles(page)).toBe(0);

				await actionButton(page, "Select original").click();
				// the rectangle is a selection: its handles transform the box
				await expect.poll(() => shownRectangles(page)).toBe(1);
				// like after a click, the new rectangle offers Confirm and Cancel
				await expect(confirmButton(page)).toBeEnabled();
				await expect(cancelButton(page)).toBeEnabled();
				await gestures.rectangle.primary(page, [ORIGINAL.box]);
				await expect(confirmButton(page)).toBeEnabled();
				expect(puts.count()).toBe(0);

				await waitForModelRecomputed(page, async () => {
					await confirmButton(page).click();
				});
				expect(puts.count()).toBe(1);
				expectBoxSent(puts, ORIGINAL);
				expect(errors.errors()).toEqual([]);
			},
		},
		{
			name: "complex: a deselect below the minimum is ignored, selecting another box hands over",
			timeout: EXCLUSIVE_TEST_TIMEOUT,
			run: async (page) => {
				const puts = trackCustomizations(page);
				const errors = collectPageErrors(page);
				const logs = collectSelectionWarnings(page);
				await settle(page);

				await actionButton(page, "Select original").click();
				await expect.poll(() => shownRectangles(page)).toBe(1);

				// minimumSelection 1: the deselect is ignored, not an error, and
				// the box stays selected
				await actionButton(page, "Deselect original").click();
				await settle(page);
				expect(await shownRectangles(page)).toBe(1);
				await gestures.rectangle.primary(page, [ORIGINAL.box]);
				await expect(confirmButton(page)).toBeEnabled();

				// selecting the other box deselects the first one although its
				// minimum is 1: one rectangle, on the new box
				await actionButton(page, "Select translated").click();
				await settle(page);
				await expect.poll(() => shownRectangles(page)).toBe(1);
				await gestures.rectangle.primary(page, [TRANSLATED.box]);
				expect(puts.count()).toBe(0);

				// the first parameter kept its pending move: one Confirm
				// commits both
				await waitForModelRecomputed(page, async () => {
					await confirmButton(page).click();
				});
				expect(puts.count()).toBe(1);
				expectBoxSent(puts, ORIGINAL);
				expectBoxSent(puts, TRANSLATED);
				expect(logs.warnings()).toEqual([]);
				expect(errors.errors()).toEqual([]);
			},
		},
	];
