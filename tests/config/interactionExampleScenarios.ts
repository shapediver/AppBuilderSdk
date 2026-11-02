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
 * anchor closed) is still sent (`parameterChangeScheduler`). A third one
 * (`multi-immediate`) adds a custom toggle which computes right away and takes
 * the pending moves along in its request. Two variants of it with a 10 s
 * countdown cover undo (`multi-undo`: a pending move is discarded) and
 * accept/reject mode (`multi-acceptReject`: the toggle waits for Accept, a
 * scheduled move does not accept it, Accept takes a pending move along). The
 * automatic examples of all three tools check that editing is paused during a
 * computation (the requests are delayed). A container
 * which renders nothing is not shown: the left container of these examples
 * appears once its text widgets show the sent values, an anchor whose
 * parameter renders in the toolbar opens with a hidden panel
 * (`containerElement`, `anchorPanel`).
 */
import {expect, Page} from "@playwright/test";
import {
	anchorPanel,
	BOXES,
	cancelButton,
	clearButton,
	clickNode,
	confirmButton,
	containerElement,
	dragDrawingPoint,
	DRAWING_PARAMETER,
	DRAWING_POINT_INDEX,
	drawingSettingsButton,
	expectDrawingDirty,
	expectNoCustomization,
	gestures,
	gumballHandle,
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
	dragMouse,
	drawingParameterPoint,
	isIdentity,
	matricesDiffer,
	nodeBounds,
	nodeScreenPoint,
	trackCustomizations,
	transformValueFromBody,
	worldScreenPoint,
} from "../helpers/sceneCoords";
import {takeSnapshot} from "../helpers/takeSnapshot";
import {waitForModelRecomputed} from "../helpers/waitForModelRecomputed";
import type {
	ScenarioActionConfig,
	ScenarioNamedAction,
} from "./scenarioActions";

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
						// the parameter renders in the toolbar: the left
						// container has no content and is not shown
						await expect(
							containerElement(page, "left"),
						).not.toBeInViewport();
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
				// the rectangle transform is covered by the immediate example
				...(kind === "gumball" ? [gumballPausedAction] : []),
			],
		},
	];
}

/**
 * The automatic update of a move is a computation as well: the gumball is
 * paused while it runs. A drag in between neither moves the box nor schedules
 * another update.
 */
const gumballPausedAction: ScenarioNamedAction = {
	name: "deep: editing is paused during a computation",
	run: async (page, slug) => {
		const g = gestures.gumball;
		const puts = trackCustomizations(page);
		const errors = collectPageErrors(page);
		await clickNode(page, BOX);
		const endDelay = await delayCustomizations(page);
		await waitForModelRecomputed(page, async () => {
			await g.translate(page, [BOX]);
			// the move is sent after the idle timeout, the request is delayed
			await expect.poll(() => puts.count(), {timeout: 10_000}).toBe(1);
			await page.waitForTimeout(500);
			const before = await nodeBounds(page, BOX);
			const handle = await gumballHandle(page, [BOX]);
			await dragMouse(page, handle, {x: handle.x + 120, y: handle.y});
			await page.waitForTimeout(300);
			expect(
				boundsChanged(before, await nodeBounds(page, BOX)),
				"the paused gumball moved the box",
			).toBe(false);
		});
		await endDelay();
		// the drag was not scheduled either
		await expectNoCustomization(page, puts, 1);
		await takeSnapshot(page, `${slug}-paused`);

		// the gumball works again once the computation ended
		await waitForModelRecomputed(page, async () => {
			await g.translate(page, [BOX]);
		});
		expect(puts.count()).toBe(2);
		expectTransformationSent(puts);
		expect(errors.errors()).toEqual([]);
	},
};

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
			{
				name: "deep: editing is paused during a computation",
				run: async (page, slug) => {
					const puts = trackCustomizations(page);
					const errors = collectPageErrors(page);
					await settle(page);
					const from = await worldScreenPoint(
						page,
						await drawingParameterPoint(
							page,
							DRAWING_PARAMETER,
							DRAWING_POINT_INDEX,
						),
					);
					const moved = {x: from.x + 60, y: from.y};
					const endDelay = await delayCustomizations(page);
					await waitForModelRecomputed(page, async () => {
						await dragMouse(page, from, moved);
						// the move is sent after the idle timeout, the request
						// is delayed
						await expect
							.poll(() => puts.count(), {timeout: 10_000})
							.toBe(1);
						await page.waitForTimeout(500);
						// the drawing is paused: a drag of the moved point
						// changes nothing
						await dragMouse(page, moved, {
							x: moved.x + 60,
							y: moved.y,
						});
					});
					await endDelay();
					// the drag was not scheduled
					await expectNoCustomization(page, puts, 1);
					await takeSnapshot(page, `${slug}-paused`);

					// the drawing works again once the computation ended
					await waitForModelRecomputed(page, async () => {
						await dragDrawingPoint(page);
					});
					expect(puts.count()).toBe(2);
					expect(errors.errors()).toEqual([]);
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
					// the parameters render in the toolbar and the text widgets
					// have no text: the left container is not shown (the example
					// overrides the App Builder data, so the text widgets keep
					// their empty text; the anchors example covers a container
					// which appears once its text widgets receive values)
					await expect(
						containerElement(page, "left"),
					).not.toBeInViewport();
					await clickNode(page, a.box);
					await expectNoCustomization(page, puts, 0);
					// the second box is moved within the idle timeout of the
					// first move: one request carries both placements
					await waitForModelRecomputed(page, async () => {
						await moveTwoBoxesQuickly(page, a.box, b.box);
					});
					expect(puts.count()).toBe(1);
					expectBoxesSent(puts, [a, b]);
					await expect(
						containerElement(page, "left"),
					).not.toBeInViewport();
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
					// both moves wait for the countdown (30 s in this example, so
					// that the gestures fit into it on slow CI runners; the restart
					// of the countdown itself is covered by the scheduler's unit
					// tests): no request right after the second move
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
				name: "simple: an anchor without content is not shown",
				run: async (page, slug) => {
					const [a] = MULTI_BOXES;
					const puts = trackCustomizations(page);
					await expect(anchorPanel(page, a.parameter)).toHaveCount(0);
					await clickNode(page, a.box);
					// the anchor of the box opens on its selection, but its
					// parameter renders in the toolbar: the panel is hidden
					await expect(anchorPanel(page, a.parameter)).toHaveCount(1);
					await expect(anchorPanel(page, a.parameter)).toBeHidden();
					await expect(multiParameterLabel(page)).toHaveCount(0);
					await expectNoCustomization(page, puts, 0);
					await settle(page);
					await takeSnapshot(page, `${slug}-anchor-hidden`);
					await waitForModelRecomputed(page, async () => {
						await gestures.rectangle.primary(page, [a.box]);
					});
					expect(puts.count()).toBe(1);
					expectBoxesSent(puts, [a]);
					await expect(anchorPanel(page, a.parameter)).toBeHidden();
					// the text widgets of the left container show the value now
					await expect(
						containerElement(page, "left"),
					).toBeInViewport();
				},
			},
			{
				name: "complex: a move pending while its anchor closes is sent",
				run: async (page, slug) => {
					const [a, b] = MULTI_BOXES;
					const puts = trackCustomizations(page);
					const errors = collectPageErrors(page);
					await clickNode(page, a.box);
					// selecting the second box right after the move opens its
					// anchor and closes the first one (anchors are exclusive):
					// the first parameter unmounts with its move pending, the
					// move is still sent
					await waitForModelRecomputed(page, async () => {
						await gestures.rectangle.primary(page, [a.box]);
						await clickNode(page, b.box, false);
					});
					expect(puts.count()).toBe(1);
					expectBoxesSent(puts, [a]);

					// the second parameter sends its move together with the
					// value of the first one
					await waitForModelRecomputed(page, async () => {
						await gestures.rectangle.primary(page, [b.box]);
					});
					expect(puts.count()).toBe(2);
					expectBoxesSent(puts, [a, b]);
					// the camera re-frames after a customization
					await settle(page);
					await takeSnapshot(page, `${slug}-updated`);
					await expectNoCustomization(page, puts, 2);
					expect(errors.errors()).toEqual([]);
				},
			},
		],
	},
	{
		// the multi example plus a custom toggle in the left container, which
		// computes right away (the moves wait for the 30 s countdown)
		slug: "example-rectangle-multi-immediate",
		params: {g: "example-rectangle-multi-immediate.json"},
		namedActions: [
			{
				name: "simple: an immediate change takes a pending move along",
				run: async (page, slug) => {
					const [a] = MULTI_BOXES;
					const puts = trackCustomizations(page);
					const errors = collectPageErrors(page);
					await clickNode(page, a.box);
					await gestures.rectangle.primary(page, [a.box]);
					// the move waits for the countdown
					await page.waitForTimeout(2000);
					expect(puts.count()).toBe(0);
					// the toggle computes right away: one request carries the
					// move and the toggle, the move is not sent again later
					await waitForModelRecomputed(page, async () => {
						await toggleSwitch(page).click();
					});
					expect(puts.count()).toBe(1);
					expectBoxesSent(puts, [a]);
					expect(customValueFromBody(puts.last(), "Toggle")).toBe(
						"true",
					);
					await settle(page);
					await takeSnapshot(page, `${slug}-updated`);
					await expectNoCustomization(page, puts, 1);
					expect(errors.errors()).toEqual([]);
				},
			},
			{
				name: "complex: moves of two boxes and a toggle in one request",
				run: async (page, slug) => {
					const [a, b] = MULTI_BOXES;
					const puts = trackCustomizations(page);
					await clickNode(page, a.box);
					await moveTwoBoxesQuickly(page, a.box, b.box);
					expect(puts.count()).toBe(0);
					await waitForModelRecomputed(page, async () => {
						await toggleSwitch(page).click();
					});
					expect(puts.count()).toBe(1);
					expectBoxesSent(puts, [a, b]);
					expect(customValueFromBody(puts.last(), "Toggle")).toBe(
						"true",
					);

					// a further immediate change without a pending move sends
					// the committed placements again
					await waitForModelRecomputed(page, async () => {
						await toggleSwitch(page).click();
					});
					expect(puts.count()).toBe(2);
					expectBoxesSent(puts, [a, b]);
					expect(customValueFromBody(puts.last(), "Toggle")).toBe(
						"false",
					);
					await settle(page);
					await takeSnapshot(page, `${slug}-updated-twice`);
					await expectNoCustomization(page, puts, 2);
				},
			},
			{
				name: "deep: editing is paused during a computation",
				run: async (page, slug) => {
					const [a] = MULTI_BOXES;
					const puts = trackCustomizations(page);
					const errors = collectPageErrors(page);
					await clickNode(page, a.box);
					await settle(page);
					/** Drag the scaling corner, whether it transformed the box. */
					const dragCornerTransforms = async () => {
						const before = await renderedMatrix(page, a.box);
						const corner = await nodeScreenPoint(
							page,
							a.box,
							[1, 1, 1],
						);
						await dragMouse(page, corner, {
							x: corner.x + 120,
							y: corner.y,
						});
						await page.waitForTimeout(300);
						return matricesDiffer(
							await renderedMatrix(page, a.box),
							before,
						);
					};
					const endDelay = await delayCustomizations(page);
					await waitForModelRecomputed(page, async () => {
						await toggleSwitch(page).click();
						await page.waitForTimeout(500);
						// the tool is paused: the corner drag does not scale the
						// box (the gizmo transforms the rendered object)
						expect(
							await dragCornerTransforms(),
							"the paused tool transformed the box",
						).toBe(false);
					});
					await endDelay();
					expect(puts.count()).toBe(1);
					const sentBefore = transformValueFromBody(
						puts.last(),
						a.parameter,
					);

					// the next computation sends the same value of the box: the
					// drag was neither applied nor scheduled
					await waitForModelRecomputed(page, async () => {
						await toggleSwitch(page).click();
					});
					expect(puts.count()).toBe(2);
					expect(
						transformValueFromBody(puts.last(), a.parameter),
					).toEqual(sentBefore);
					await settle(page);
					await takeSnapshot(page, `${slug}-paused`);

					// the tool works again once the computation ended: the same
					// drag scales the box (it hits the handle)
					expect(
						await dragCornerTransforms(),
						"the drag did not hit the handle",
					).toBe(true);
					await waitForModelRecomputed(page, async () => {
						await toggleSwitch(page).click();
					});
					expect(puts.count()).toBe(3);
					expectBoxesSent(puts, [a]);
					expect(errors.errors()).toEqual([]);
				},
			},
		],
	},
	{
		// the immediate example, the moves wait for 10 s (Undo of the viewport
		// toolbar)
		slug: "example-rectangle-multi-undo",
		params: {g: "example-rectangle-multi-undo.json"},
		namedActions: [
			{
				name: "simple: undo discards a pending move",
				run: async (page, slug) => {
					const [a] = MULTI_BOXES;
					const puts = trackCustomizations(page);
					const errors = collectPageErrors(page);
					const initial = await nodeBounds(page, a.box);
					await waitForModelRecomputed(page, async () => {
						await toggleSwitch(page).click();
					});
					expect(puts.count()).toBe(1);
					await clickNode(page, a.box);
					await gestures.rectangle.primary(page, [a.box]);
					expect(puts.count()).toBe(1);
					// undo restores the state before the toggle: the request
					// does not carry the pending move
					await waitForModelRecomputed(page, async () => {
						await clickUndo(page);
					});
					// (the state before the toggle is the default value of the
					// model's App Builder parameter, without custom values)
					expect(puts.count()).toBe(2);
					expect(puts.last()).not.toContain(`Boxes.${a.box}`);
					await expect(
						containerElement(page, "left").getByRole("switch"),
					).not.toBeChecked();
					// the move is not sent after its countdown either
					await page.waitForTimeout(MULTI_COUNTDOWN_WAIT);
					expect(puts.count()).toBe(2);
					await settle(page);
					expect(
						boundsChanged(initial, await nodeBounds(page, a.box)),
					).toBe(false);
					await takeSnapshot(page, `${slug}-undone`);
					expect(errors.errors()).toEqual([]);
				},
			},
		],
	},
	{
		// the immediate example with the toggle in accept/reject mode (inline
		// controls), the moves wait for 10 s
		slug: "example-rectangle-multi-acceptReject",
		params: {g: "example-rectangle-multi-acceptReject.json"},
		namedActions: [
			{
				name: "simple: a scheduled move does not accept a queued change",
				run: async (page, slug) => {
					const [a] = MULTI_BOXES;
					const puts = trackCustomizations(page);
					const errors = collectPageErrors(page);
					await toggleSwitch(page).click();
					await expect(acceptButton(page)).toBeVisible();
					await clickNode(page, a.box);
					await waitForModelRecomputed(page, async () => {
						await gestures.rectangle.primary(page, [a.box]);
					});
					// the move is sent, the toggle still waits for Accept
					expect(puts.count()).toBe(1);
					expectBoxesSent(puts, [a]);
					expect(customValueFromBody(puts.last(), "Toggle")).toBe(
						"false",
					);
					await expect(acceptButton(page)).toBeVisible();
					await settle(page);
					await takeSnapshot(page, `${slug}-queued`);

					await waitForModelRecomputed(page, async () => {
						await acceptButton(page).click();
					});
					expect(puts.count()).toBe(2);
					expectBoxesSent(puts, [a]);
					expect(customValueFromBody(puts.last(), "Toggle")).toBe(
						"true",
					);
					await expect(acceptButton(page)).toHaveCount(0);
					expect(errors.errors()).toEqual([]);
				},
			},
			{
				name: "complex: accept takes a pending move along, reject does not drop it",
				run: async (page, slug) => {
					const [a, b] = MULTI_BOXES;
					const puts = trackCustomizations(page);
					await clickNode(page, a.box);
					await gestures.rectangle.primary(page, [a.box]);
					await toggleSwitch(page).click();
					await expect(acceptButton(page)).toBeVisible();
					expect(puts.count()).toBe(0);
					// Accept computes right away and takes the pending move along
					await waitForModelRecomputed(page, async () => {
						await acceptButton(page).click();
					});
					expect(puts.count()).toBe(1);
					expectBoxesSent(puts, [a]);
					expect(customValueFromBody(puts.last(), "Toggle")).toBe(
						"true",
					);
					await page.waitForTimeout(MULTI_COUNTDOWN_WAIT);
					expect(puts.count()).toBe(1);

					// Reject drops the queued toggle only: the pending move of
					// the other box is still sent after its countdown
					await clickNode(page, b.box);
					await gestures.rectangle.primary(page, [b.box]);
					await toggleSwitch(page).click();
					await rejectButton(page).click();
					await expect(acceptButton(page)).toHaveCount(0);
					await waitForModelRecomputed(page, async () => {});
					expect(puts.count()).toBe(2);
					expectBoxesSent(puts, [a, b]);
					expect(customValueFromBody(puts.last(), "Toggle")).toBe(
						"true",
					);
					await settle(page);
					await takeSnapshot(page, `${slug}-rejected`);
				},
			},
		],
	},
];

/** Longer than the 10 s countdown of the undo and accept/reject examples. */
const MULTI_COUNTDOWN_WAIT = 12_000;

/**
 * Undo of the viewport toolbar, which shows while the pointer moves over the
 * viewport (the pointer moves at the top, away from the boxes).
 */
async function clickUndo(page: Page) {
	const undo = page.getByRole("button", {name: "Undo"});
	const box = await containerElement(page, "left").boundingBox();
	const x = (box ? box.x + box.width : 0) + 200;
	await page.mouse.move(x, 120);
	await page.mouse.move(x + 20, 130, {steps: 5});
	await undo.click();
}
const acceptButton = (page: Page) => page.getByRole("button", {name: "Accept"});
const rejectButton = (page: Page) => page.getByRole("button", {name: "Reject"});

/**
 * Delay the customization requests (6 s each), so that a computation takes
 * long enough for a gesture in between. Returns the function ending it.
 */
async function delayCustomizations(page: Page) {
	const customization = (url: URL) => url.pathname.endsWith("/output");
	await page.route(customization, async (route) => {
		if (route.request().method() === "PUT") await page.waitForTimeout(6000);
		await route.continue();
	});
	return () => page.unroute(customization);
}

/**
 * The world matrix of the rendered object of a scene node (the gizmos
 * transform the rendered object while a transformation is in progress).
 */
const renderedMatrix = (page: Page, nodeName: string) =>
	page.evaluate((name) => {
		const SDV = (window as any).SDV;
		const viewport = Object.values(SDV.viewports)[0] as any;
		for (const session of Object.values(SDV.sessions) as any[]) {
			const nodes = session.node?.getNodesByName(name) ?? [];
			if (nodes.length === 0) continue;
			const object = nodes[0].convertedObject[viewport.id];
			object.updateWorldMatrix(true, false);
			return Array.from(object.matrixWorld.elements) as number[];
		}
		throw new Error(`Scene node "${name}" not found`);
	}, nodeName);

/** The custom toggle of the immediate example (left container). */
const toggleSwitch = (page: Page) =>
	containerElement(page, "left").locator(".mantine-Switch-track");

/** The value of a custom parameter in the App Builder JSON of a request body. */
const customValueFromBody = (body: string, parameterId: string) => {
	const parameters = JSON.parse(body) as Record<string, unknown>;
	for (const value of Object.values(parameters)) {
		if (typeof value !== "string" || !value.includes(parameterId)) continue;
		const custom = JSON.parse(value) as Record<string, unknown>;
		if (parameterId in custom) return String(custom[parameterId]);
	}
	throw new Error(`Parameter "${parameterId}" not found in request body`);
};

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
