/**
 * Interaction parameter examples (SS-10024): rectangle transform, gumball, and
 * drawing, each in three modes:
 *   - basic: widget with Start / Confirm / Cancel (the file sets
 *     automaticSceneUpdate too, which is ignored without alwaysActive)
 *   - alwaysActive: toolbar presentation, tool on from the start
 *   - alwaysActive-automaticSceneUpdate: no Confirm and no Cancel, a moved
 *     handle sends the customization after the idle timeout (3000 ms in the
 *     examples, so that the pending state is observable on slow runners)
 *
 * Rectangle transform and gumball offer Clear (toolbar and widget) while a
 * transformation is committed or pending: it resets the parameter to its
 * default value. The automaticSceneUpdate files turn Clear off
 * (`buttons.clear: false`), so those tools offer no control at all.
 *
 * Every example has a simple and a complex (multi-step) test here, and a deep
 * test in `interactionExampleDeepScenarios.ts`. Handle positions are computed
 * from the scene at runtime (`sceneCoords`), every gesture verifies that it
 * moved the object (`interactionExamples`).
 *
 * Settings files: public/example-<rectangle|gumball|drawing>-<mode>.json.
 */
import {expect, Page} from "@playwright/test";
import {
	BOXES,
	cancelButton,
	clearButton,
	clickNode,
	confirmButton,
	dragDrawingPoint,
	drawingSettingsButton,
	expectDrawingDirty,
	expectNoCustomization,
	gestures,
	type Kind,
	PARAMETER,
	settle,
	startDrawingButton,
	startTransformButton,
} from "../helpers/interactionExamples";
import {
	boundsChanged,
	type CustomizationTracker,
	isIdentity,
	nodeBounds,
	trackCustomizations,
	transformValueFromBody,
} from "../helpers/sceneCoords";
import {takeSnapshot} from "../helpers/takeSnapshot";
import {waitForModelRecomputed} from "../helpers/waitForModelRecomputed";
import {
	interactionExampleExtraScenarios,
	withDeepActions,
} from "./interactionExampleDeepScenarios";
import type {ScenarioActionConfig} from "./scenarioActions";

const BOX = BOXES[0];

/** The last request carries a real (non-identity) transformation of the box. */
const expectTransformationSent = (puts: CustomizationTracker) => {
	const value = transformValueFromBody(puts.last(), PARAMETER);
	const index = value.names.indexOf(`Boxes.${BOX}`);
	expect(index, JSON.stringify(value)).toBeGreaterThanOrEqual(0);
	expect(isIdentity(value.transformations[index])).toBe(false);
};

/**
 * Clear resets the parameter to its default: the request carries no
 * transformation and the box is back at its original placement.
 */
async function clearAndExpectReset(
	page: Page,
	puts: CustomizationTracker,
	initial: {min: [number, number, number]; max: [number, number, number]},
	expectedCount: number,
) {
	await waitForModelRecomputed(page, async () => {
		await clearButton(page).click();
	});
	expect(puts.count()).toBe(expectedCount);
	expect(transformValueFromBody(puts.last(), PARAMETER).names).toEqual([]);
	await settle(page);
	expect(boundsChanged(initial, await nodeBounds(page, BOX))).toBe(false);
}

/** Rectangle transform and gumball share the same flows. */
function transformScenarios(kind: Kind): ScenarioActionConfig[] {
	const drag = (page: Page) => gestures[kind].primary(page, [BOX]);
	return [
		{
			slug: `example-${kind}-basic`,
			params: {g: `example-${kind}-basic.json`},
			namedActions: [
				{
					name: "simple: start, select, move, confirm",
					run: async (page, slug) => {
						const puts = trackCustomizations(page);
						await expect(confirmButton(page)).toHaveCount(0);
						await startTransformButton(page).click();
						await expect(cancelButton(page)).toBeVisible();
						await clickNode(page, BOX);
						await takeSnapshot(page, `${slug}-selected`);
						await drag(page);
						await takeSnapshot(page, `${slug}-moved`);
						// automaticSceneUpdate is set in the file but ignored
						// without alwaysActive: nothing is sent before Confirm
						await expectNoCustomization(page, puts, 0);
						await waitForModelRecomputed(page, async () => {
							await confirmButton(page).click();
						});
						expect(puts.count()).toBe(1);
						expectTransformationSent(puts);
						// the tool ends with the confirmation
						await expect(startTransformButton(page)).toBeVisible();
						await takeSnapshot(page, `${slug}-confirmed`);
					},
				},
				{
					name: "complex: cancel, confirm twice, clear",
					run: async (page, slug) => {
						const puts = trackCustomizations(page);
						const initial = await nodeBounds(page, BOX);
						await startTransformButton(page).click();
						// nothing committed or moved: no Clear
						await expect(clearButton(page)).toHaveCount(0);
						await clickNode(page, BOX);
						await drag(page);
						await cancelButton(page).click();
						await expect(startTransformButton(page)).toBeVisible();
						await expectNoCustomization(page, puts, 0);
						await takeSnapshot(page, `${slug}-cancelled`);

						for (let i = 1; i <= 2; i++) {
							await startTransformButton(page).click();
							await clickNode(page, BOX);
							await drag(page);
							await waitForModelRecomputed(page, async () => {
								await confirmButton(page).click();
							});
							expect(puts.count()).toBe(i);
							expectTransformationSent(puts);
						}
						await takeSnapshot(page, `${slug}-confirmed-twice`);

						// Clear is offered while a transformation is committed; it
						// resets the parameter and ends the tool
						await startTransformButton(page).click();
						await clearAndExpectReset(page, puts, initial, 3);
						await expect(startTransformButton(page)).toBeVisible();
						await takeSnapshot(page, `${slug}-cleared`);
					},
				},
			],
		},
		{
			slug: `example-${kind}-alwaysActive`,
			params: {g: `example-${kind}-alwaysActive.json`},
			namedActions: [
				{
					name: "simple: select, move, confirm",
					run: async (page, slug) => {
						const puts = trackCustomizations(page);
						// toolbar presentation, no widget
						await expect(startTransformButton(page)).toHaveCount(0);
						await expect(confirmButton(page)).toHaveCount(0);
						await clickNode(page, BOX);
						await takeSnapshot(page, `${slug}-selected`);
						await drag(page);
						await expect(confirmButton(page)).toBeEnabled();
						await waitForModelRecomputed(page, async () => {
							await confirmButton(page).click();
						});
						expect(puts.count()).toBe(1);
						expectTransformationSent(puts);
						// the tool stays on, the gizmo is recreated on the updated box
						await takeSnapshot(page, `${slug}-confirmed`);
					},
				},
				{
					name: "complex: cancel, confirm twice, select without move, clear",
					run: async (page, slug) => {
						const puts = trackCustomizations(page);
						const initial = await nodeBounds(page, BOX);
						await expect(clearButton(page)).toHaveCount(0);
						await clickNode(page, BOX);
						await drag(page);
						await cancelButton(page).click();
						await expectNoCustomization(page, puts, 0);
						await takeSnapshot(page, `${slug}-cancelled`);

						for (let i = 1; i <= 2; i++) {
							await drag(page);
							await waitForModelRecomputed(page, async () => {
								await confirmButton(page).click();
							});
							expect(puts.count()).toBe(i);
							expectTransformationSent(puts);
						}
						await takeSnapshot(page, `${slug}-confirmed-twice`);

						// a click on the box without a move sends nothing
						await clickNode(page, BOX);
						await expectNoCustomization(page, puts, 2);

						// Clear resets the parameter, the tool stays on with the box
						// still selected (Confirm may be offered like after any
						// selection), nothing is sent without a move
						await clearAndExpectReset(page, puts, initial, 3);
						await expectNoCustomization(page, puts, 3);
						await takeSnapshot(page, `${slug}-cleared`);
					},
				},
			],
		},
		{
			slug: `example-${kind}-alwaysActive-automaticSceneUpdate`,
			params: {
				g: `example-${kind}-alwaysActive-automaticSceneUpdate.json`,
			},
			namedActions: [
				{
					name: "simple: select does not update, move does",
					run: async (page, slug) => {
						const puts = trackCustomizations(page);
						await expect(confirmButton(page)).toHaveCount(0);
						await clickNode(page, BOX);
						// identity gizmo after a click is not a scene change
						await expectNoCustomization(page, puts, 0);
						await expect(confirmButton(page)).toHaveCount(0);
						await takeSnapshot(page, `${slug}-selected`);
						await waitForModelRecomputed(page, async () => {
							await drag(page);
						});
						expect(puts.count()).toBe(1);
						expectTransformationSent(puts);
						await expect(confirmButton(page)).toHaveCount(0);
						// the tool stays on, the gizmo is recreated on the updated box
						await takeSnapshot(page, `${slug}-updated`);
					},
				},
				{
					name: "complex: update twice, no controls, click without move",
					run: async (page, slug) => {
						const puts = trackCustomizations(page);
						await clickNode(page, BOX);
						for (let i = 1; i <= 2; i++) {
							await waitForModelRecomputed(page, async () => {
								await drag(page);
							});
							expect(puts.count()).toBe(i);
							expectTransformationSent(puts);
						}
						await takeSnapshot(page, `${slug}-updated-twice`);

						// a pending update offers no control at all (the file turns
						// Clear off as well): it is sent after the idle timeout
						await waitForModelRecomputed(page, async () => {
							await drag(page);
							await expect(confirmButton(page)).toHaveCount(0);
							await expect(cancelButton(page)).toHaveCount(0);
							await expect(clearButton(page)).toHaveCount(0);
						});
						expect(puts.count()).toBe(3);

						// a click without movement re-emits the current matrices
						await clickNode(page, BOX);
						await expectNoCustomization(page, puts, 3);
						await takeSnapshot(page, `${slug}-updated-thrice`);
					},
				},
			],
		},
	];
}

const drawingScenarios: ScenarioActionConfig[] = [
	{
		slug: "example-drawing-basic",
		params: {g: "example-drawing-basic.json"},
		namedActions: [
			{
				name: "simple: start, move point, confirm",
				run: async (page, slug) => {
					const puts = trackCustomizations(page);
					await expect(confirmButton(page)).toHaveCount(0);
					await startDrawingButton(page).click();
					await expect(cancelButton(page)).toBeVisible();
					await takeSnapshot(page, `${slug}-active`);
					await dragDrawingPoint(page);
					await expectDrawingDirty(page, "widget");
					await takeSnapshot(page, `${slug}-moved`);
					// automaticSceneUpdate is set in the file but ignored
					// without alwaysActive: nothing is sent before Confirm
					await expectNoCustomization(page, puts, 0);
					await waitForModelRecomputed(page, async () => {
						await confirmButton(page).click();
					});
					expect(puts.count()).toBe(1);
					await expect(confirmButton(page)).toHaveCount(0);
					await takeSnapshot(page, `${slug}-confirmed`);
				},
			},
			{
				name: "complex: cancel, confirm twice",
				run: async (page, slug) => {
					const puts = trackCustomizations(page);
					await startDrawingButton(page).click();
					await dragDrawingPoint(page);
					await expectDrawingDirty(page, "widget");
					await cancelButton(page).click();
					await expectNoCustomization(page, puts, 0);
					await takeSnapshot(page, `${slug}-cancelled`);

					for (let i = 1; i <= 2; i++) {
						await startDrawingButton(page).click();
						await dragDrawingPoint(page);
						await expectDrawingDirty(page, "widget");
						await waitForModelRecomputed(page, async () => {
							await confirmButton(page).click();
						});
						expect(puts.count()).toBe(i);
					}
					await takeSnapshot(page, `${slug}-confirmed-twice`);
				},
			},
		],
	},
	{
		slug: "example-drawing-alwaysActive",
		params: {g: "example-drawing-alwaysActive.json"},
		namedActions: [
			{
				name: "simple: move point, confirm",
				run: async (page, slug) => {
					const puts = trackCustomizations(page);
					await expect(drawingSettingsButton(page)).toBeVisible();
					await expect(confirmButton(page)).toHaveCount(0);
					await dragDrawingPoint(page);
					await expectDrawingDirty(page, "toolbar");
					await takeSnapshot(page, `${slug}-moved`);
					await waitForModelRecomputed(page, async () => {
						await confirmButton(page).click();
					});
					expect(puts.count()).toBe(1);
					// the drawing stays on
					await expect(drawingSettingsButton(page)).toBeVisible();
					await takeSnapshot(page, `${slug}-confirmed`);
				},
			},
			{
				name: "complex: cancel, confirm twice",
				run: async (page, slug) => {
					const puts = trackCustomizations(page);
					await dragDrawingPoint(page);
					await expectDrawingDirty(page, "toolbar");
					await cancelButton(page).click();
					await expectNoCustomization(page, puts, 0);
					await takeSnapshot(page, `${slug}-cancelled`);

					for (let i = 1; i <= 2; i++) {
						await dragDrawingPoint(page);
						await expectDrawingDirty(page, "toolbar");
						await waitForModelRecomputed(page, async () => {
							await confirmButton(page).click();
						});
						expect(puts.count()).toBe(i);
					}
					await takeSnapshot(page, `${slug}-confirmed-twice`);
				},
			},
		],
	},
	{
		slug: "example-drawing-alwaysActive-automaticSceneUpdate",
		params: {g: "example-drawing-alwaysActive-automaticSceneUpdate.json"},
		namedActions: [
			{
				name: "simple: move point updates",
				run: async (page, slug) => {
					const puts = trackCustomizations(page);
					await expect(drawingSettingsButton(page)).toBeVisible();
					await expect(confirmButton(page)).toHaveCount(0);
					await waitForModelRecomputed(page, async () => {
						await dragDrawingPoint(page);
						await expectDrawingDirty(page, "automatic");
					});
					expect(puts.count()).toBe(1);
					await expect(confirmButton(page)).toHaveCount(0);
					await expect(drawingSettingsButton(page)).toBeVisible();
					await takeSnapshot(page, `${slug}-updated`);
				},
			},
			{
				name: "complex: update twice, no cancel",
				run: async (page, slug) => {
					const puts = trackCustomizations(page);
					for (let i = 1; i <= 2; i++) {
						await waitForModelRecomputed(page, async () => {
							await dragDrawingPoint(page);
							await expectDrawingDirty(page, "automatic");
						});
						expect(puts.count()).toBe(i);
					}
					await takeSnapshot(page, `${slug}-updated-twice`);

					// a pending update offers neither Confirm nor Cancel: it is
					// sent after the idle timeout
					await waitForModelRecomputed(page, async () => {
						await dragDrawingPoint(page);
						await expectDrawingDirty(page, "automatic");
						await expect(confirmButton(page)).toHaveCount(0);
						await expect(cancelButton(page)).toHaveCount(0);
					});
					expect(puts.count()).toBe(3);
					await takeSnapshot(page, `${slug}-updated-thrice`);
				},
			},
		],
	},
];

/**
 * Every flow waits for several model computations and drags gizmos with
 * continuous rendering; on CI runners (software rendering) a simple flow takes
 * about 1.5 minutes, so the complex and deep flows need more than the global
 * 2 minute test timeout.
 */
const INTERACTION_TEST_TIMEOUT = 420_000;

export const interactionExampleScenarios: ScenarioActionConfig[] = [
	...withDeepActions([
		...transformScenarios("rectangle"),
		...transformScenarios("gumball"),
		...drawingScenarios,
	]),
	...interactionExampleExtraScenarios,
].map((scenario) => ({
	...scenario,
	namedActions: scenario.namedActions?.map((action) => ({
		...action,
		timeout: action.timeout ?? INTERACTION_TEST_TIMEOUT,
	})),
}));
