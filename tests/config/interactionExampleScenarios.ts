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
 * Every example has a simple and a complex (multi-step) test here (the
 * reset-value example has one test). Handle positions are computed
 * from the scene at runtime (`sceneCoords`), every gesture verifies that it
 * moved the object (`interactionExamples`).
 *
 * Settings files: public/example-<rectangle|gumball|drawing>-<mode>.json.
 *
 * Two more rectangle examples load testing-account models with one always
 * active, automatically updating parameter per box (`multi`: all three in the
 * left container; `anchors`: each in a 2D anchor which opens on selection of
 * its box and closes when another anchor opens). Automatic updates of several
 * parameters are sent together after the longest idle timeout, a new move
 * restarts the countdown, and a move whose parameter unmounts meanwhile (its
 * anchor closed) is still sent (`automaticSceneUpdateScheduler`).
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
	moveTwoBoxesQuickly,
	PARAMETER,
	settle,
	startDrawingButton,
	startTransformButton,
} from "../helpers/interactionExamples";
import {
	boundsChanged,
	collectPageErrors,
	type CustomizationTracker,
	isIdentity,
	matricesDiffer,
	nodeBounds,
	trackCustomizations,
	transformValueFromBody,
} from "../helpers/sceneCoords";
import {takeSnapshot} from "../helpers/takeSnapshot";
import {waitForModelRecomputed} from "../helpers/waitForModelRecomputed";
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

/** The matrix of a box in a request body (the box must be part of it). */
const matrixOf = (body: string, box: string) => {
	const value = transformValueFromBody(body, PARAMETER);
	const index = value.names.indexOf(`Boxes.${box}`);
	expect(index, JSON.stringify(value)).toBeGreaterThanOrEqual(0);
	return value.transformations[index];
};

/**
 * A reset value (`settings.resetValue: ""`) commits the default after every
 * execution, so `commitValue !== execValue` and the persistent gizmo restarts
 * on the updated box. The requests look the same as without a reset value
 * (absolute placements); the test exercises the restart path: the restarted
 * gizmo keeps working and nothing is sent without a move.
 */
const interactionExampleExtraScenarios: ScenarioActionConfig[] = [
	{
		slug: "example-gumball-alwaysActive-automaticSceneUpdate-resetValue",
		params: {
			g: "example-gumball-alwaysActive-automaticSceneUpdate-resetValue.json",
		},
		namedActions: [
			{
				name: "reset value: the gizmo restarts after each update",
				run: async (page, slug) => {
					const g = gestures.gumball;
					const puts = trackCustomizations(page);
					const errors = collectPageErrors(page);
					await expect(confirmButton(page)).toHaveCount(0);
					await clickNode(page, BOXES[0]);
					await expectNoCustomization(page, puts, 0);
					await waitForModelRecomputed(page, async () => {
						await g.translate(page, [BOXES[0]]);
					});
					expect(puts.count()).toBe(1);
					const first = matrixOf(puts.last(), BOXES[0]);
					await takeSnapshot(page, `${slug}-updated`);

					// the parameter is back at its default, the gizmo restarted
					// on the updated box: the next move sends this box again
					await waitForModelRecomputed(page, async () => {
						await g.translate(page, [BOXES[0]]);
					});
					expect(puts.count()).toBe(2);
					const second = matrixOf(puts.last(), BOXES[0]);
					expect(matricesDiffer(second, first)).toBe(true);
					await takeSnapshot(page, `${slug}-updated-twice`);

					await clickNode(page, BOXES[0]);
					await expectNoCustomization(page, puts, 2);
					expect(errors.errors()).toEqual([]);
				},
			},
		],
	},
];

/** The boxes of the multi-parameter examples and the parameter of each. */
const MULTI_BOXES = [
	{box: "box_original", parameter: "RectangleTransform2"},
	{box: "box_translated", parameter: "RectangleTransform1"},
];
/** Label of each parameter of the multi-parameter examples (widget header). */
const MULTI_PARAMETER_LABEL = "RectangleTransform";
const multiParameterLabel = (page: Page) =>
	page.getByText(MULTI_PARAMETER_LABEL, {exact: true});

/** The last request carries a real transformation of each of the boxes. */
const expectBoxesSent = (
	puts: CustomizationTracker,
	boxes: {box: string; parameter: string}[],
) => {
	for (const {box, parameter} of boxes) {
		const value = transformValueFromBody(puts.last(), parameter);
		const index = value.names.indexOf(`Boxes.${box}`);
		expect(index, JSON.stringify(value)).toBeGreaterThanOrEqual(0);
		expect(isIdentity(value.transformations[index])).toBe(false);
	}
};

const multiParameterScenarios: ScenarioActionConfig[] = [
	{
		slug: "example-rectangle-multi-automaticSceneUpdate",
		params: {g: "example-rectangle-multi-automaticSceneUpdate.json"},
		namedActions: [
			{
				name: "simple: moves of two boxes are sent together",
				run: async (page, slug) => {
					const [a, b] = MULTI_BOXES;
					const puts = trackCustomizations(page);
					const errors = collectPageErrors(page);
					await clickNode(page, a.box);
					await expectNoCustomization(page, puts, 0);
					// the second box is moved within the idle timeout of the
					// first move: one request carries both placements
					await waitForModelRecomputed(page, async () => {
						await moveTwoBoxesQuickly(page, a.box, b.box);
					});
					expect(puts.count()).toBe(1);
					expectBoxesSent(puts, [a, b]);
					// the camera re-frames after a customization
					await settle(page);
					await takeSnapshot(page, `${slug}-updated`);
					await expectNoCustomization(page, puts, 1);
					expect(errors.errors()).toEqual([]);
				},
			},
			{
				name: "complex: a move restarts the countdown, a later move resends both",
				run: async (page, slug) => {
					const [a, b] = MULTI_BOXES;
					const g = gestures.rectangle;
					const puts = trackCustomizations(page);
					await clickNode(page, a.box);
					await moveTwoBoxesQuickly(page, a.box, b.box);
					// the move of the second box restarted the countdown: the
					// timeout since the first move passed without a request
					await page.waitForTimeout(2000);
					expect(puts.count()).toBe(0);
					await waitForModelRecomputed(page, async () => {});
					expect(puts.count()).toBe(1);
					expectBoxesSent(puts, [a, b]);

					// the value of every parameter is part of each request: a
					// further move of the first box resends the second one too
					await waitForModelRecomputed(page, async () => {
						await g.primary(page, [a.box]);
					});
					expect(puts.count()).toBe(2);
					expectBoxesSent(puts, [a, b]);
					// the camera re-frames after a customization
					await settle(page);
					await takeSnapshot(page, `${slug}-updated-twice`);
				},
			},
		],
	},
	{
		slug: "example-rectangle-anchors-automaticSceneUpdate",
		params: {g: "example-rectangle-anchors-automaticSceneUpdate.json"},
		namedActions: [
			{
				name: "simple: the anchor shows the parameter widget",
				run: async (page, slug) => {
					const [a] = MULTI_BOXES;
					const puts = trackCustomizations(page);
					await expect(multiParameterLabel(page)).toHaveCount(0);
					await clickNode(page, a.box);
					// the anchor of the box opened with the parameter's widget:
					// inside an anchor the parameter does not render in the toolbar
					await expect(multiParameterLabel(page)).toHaveCount(1);
					await expectNoCustomization(page, puts, 0);
					// the camera re-frames after a customization
					await settle(page);
					await takeSnapshot(page, `${slug}-anchor-open`);
					await waitForModelRecomputed(page, async () => {
						await gestures.rectangle.primary(page, [a.box]);
					});
					expect(puts.count()).toBe(1);
					expectBoxesSent(puts, [a]);
					await expect(multiParameterLabel(page)).toHaveCount(1);
				},
			},
			{
				name: "complex: a move pending while its anchor closes is sent",
				run: async (page, slug) => {
					const [a, b] = MULTI_BOXES;
					const puts = trackCustomizations(page);
					const errors = collectPageErrors(page);
					await clickNode(page, a.box);
					// selecting the second box opens its anchor and closes the
					// first one (anchors are exclusive): the first parameter
					// unmounts with its move pending, the move is still sent
					await waitForModelRecomputed(page, async () => {
						await moveTwoBoxesQuickly(page, a.box, b.box, 800);
						await expect(multiParameterLabel(page)).toHaveCount(1);
					});
					expect(puts.count()).toBe(1);
					expectBoxesSent(puts, [a, b]);
					// the camera re-frames after a customization
					await settle(page);
					await takeSnapshot(page, `${slug}-updated`);
					await expectNoCustomization(page, puts, 1);
					expect(errors.errors()).toEqual([]);
				},
			},
		],
	},
];

/**
 * Every flow waits for several model computations and drags gizmos with
 * continuous rendering; on CI runners (software rendering) a simple flow takes
 * about 1.5 minutes, so the complex flows need more than the global
 * 2 minute test timeout.
 */
const INTERACTION_TEST_TIMEOUT = 420_000;

export const interactionExampleScenarios: ScenarioActionConfig[] = [
	...transformScenarios("rectangle"),
	...transformScenarios("gumball"),
	...drawingScenarios,
	...interactionExampleExtraScenarios,
	...multiParameterScenarios,
].map((scenario) => ({
	...scenario,
	namedActions: scenario.namedActions?.map((action) => ({
		...action,
		timeout: action.timeout ?? INTERACTION_TEST_TIMEOUT,
	})),
}));
