/**
 * In-depth flows for the interaction examples (SS-10024), appended to the
 * scenarios of `interactionExampleScenarios.ts` as a third named action.
 *
 * They assert on the values sent with the customization requests (names,
 * matrices, drawing points), on uncaught page errors, and cover: several
 * gestures in one session (scale / translate / rotate), multi selection,
 * switching the selected object, camera orbit, debounced moves, a move while
 * a request is in flight (does not register), clearing a drawing below its
 * minimum.
 *
 * Values are absolute placements: a request carries the current placement of
 * every transformed box (including the model's own transform of the tilted
 * box), the model does not accumulate.
 */
import {expect, Page} from "@playwright/test";
import {
	BOXES,
	cancelButton,
	clearButton,
	clickNode,
	confirmButton,
	dragDrawingPoint,
	DRAWING_PARAMETER,
	expectDrawingDirty,
	expectNoCustomization,
	gestures,
	IDLE_WAIT,
	type Kind,
	orbitCamera,
	PARAMETER,
	planeTranslate,
	settle,
	startDrawingButton,
	startTransformButton,
	zoomInOnNode,
} from "../helpers/interactionExamples";
import {
	boundsChanged,
	collectPageErrors,
	type CustomizationTracker,
	delayCustomizations,
	drawingParameterPoint,
	drawingPointsFromBody,
	isIdentity,
	isRotated,
	matricesDiffer,
	nodeBounds,
	trackCustomizations,
	transformValueFromBody,
	translationOf,
} from "../helpers/sceneCoords";
import {takeSnapshot} from "../helpers/takeSnapshot";
import {waitForModelRecomputed} from "../helpers/waitForModelRecomputed";
import type {
	ScenarioActionConfig,
	ScenarioNamedAction,
} from "./scenarioActions";

/** The request stays in flight this long so a move during it is reproducible. */
const REQUEST_DELAY = 10_000;

const length = (v: number[]) => Math.hypot(...v);
const scaleX = (m: number[]) => Math.hypot(m[0], m[1], m[2]);
const sentValues = (puts: CustomizationTracker) =>
	JSON.stringify(
		puts.bodies().map((body) => transformValueFromBody(body, PARAMETER)),
	);
/** The matrix of a box in a request body (the box must be part of it). */
const matrixOf = (body: string, box: string) => {
	const value = transformValueFromBody(body, PARAMETER);
	const index = value.names.indexOf(`Boxes.${box}`);
	expect(index, JSON.stringify(value)).toBeGreaterThanOrEqual(0);
	return value.transformations[index];
};

function transformBasicDeep(kind: Kind): ScenarioNamedAction {
	const g = gestures[kind];
	return {
		name: "deep: several gestures, cancel on another box, sent values",
		run: async (page, slug) => {
			const puts = trackCustomizations(page);
			const errors = collectPageErrors(page);
			await startTransformButton(page).click();
			await clickNode(page, BOXES[0]);
			await g.primary(page, [BOXES[0]]);
			await takeSnapshot(page, `${slug}-deep-primary`);
			await g.translate(page, [BOXES[0]]);
			await takeSnapshot(page, `${slug}-deep-translated`);
			await g.rotate(page, [BOXES[0]]);
			await takeSnapshot(page, `${slug}-deep-rotated`);
			await waitForModelRecomputed(page, async () => {
				await confirmButton(page).click();
			});
			expect(puts.count()).toBe(1);
			const value = transformValueFromBody(puts.last(), PARAMETER);
			expect(value.names).toEqual([`Boxes.${BOXES[0]}`]);
			const matrix = value.transformations[0];
			expect(isIdentity(matrix)).toBe(false);
			expect(length(translationOf(matrix))).toBeGreaterThan(0.1);
			expect(isRotated(matrix)).toBe(true);
			if (kind === "rectangle") {
				expect(Math.abs(scaleX(matrix) - 1)).toBeGreaterThan(0.05);
			}
			await takeSnapshot(page, `${slug}-deep-confirmed`);

			// the tilted box: move and cancel, nothing is sent
			await startTransformButton(page).click();
			await clickNode(page, BOXES[1]);
			await g.translate(page, [BOXES[1]]);
			await takeSnapshot(page, `${slug}-deep-other-moved`);
			await cancelButton(page).click();
			await expectNoCustomization(page, puts, 1);
			await expect(startTransformButton(page)).toBeVisible();
			await takeSnapshot(page, `${slug}-deep-cancelled-other`);

			// the first box again without a move: Confirm sends nothing new
			// and ends the tool
			await startTransformButton(page).click();
			await clickNode(page, BOXES[0]);
			await settle(page);
			await confirmButton(page).click();
			await page.waitForTimeout(IDLE_WAIT);
			// the fresh gizmo reports the current absolute placement; Confirm
			// either sends nothing or (with floating point noise) the same
			// matrix again, which does not move the box
			expect(puts.count(), sentValues(puts)).toBeLessThanOrEqual(2);
			if (puts.count() === 2) {
				const again = transformValueFromBody(puts.last(), PARAMETER);
				expect(again.names).toEqual([`Boxes.${BOXES[0]}`]);
				expect(matricesDiffer(again.transformations[0], matrix)).toBe(
					false,
				);
			}
			await expect(startTransformButton(page)).toBeVisible();

			if (kind === "rectangle") {
				// the drag plane: a press on the box itself translates it and
				// keeps the selection (a second plane drag still moves it)
				await startTransformButton(page).click();
				await clickNode(page, BOXES[0]);
				await zoomInOnNode(page, BOXES[0]);
				await planeTranslate(page, BOXES[0]);
				await planeTranslate(page, BOXES[0]);
				const sent = puts.count();
				await cancelButton(page).click();
				await expectNoCustomization(page, puts, sent);
			}
			expect(errors.errors()).toEqual([]);
		},
	};
}

function transformAlwaysActiveDeep(kind: Kind): ScenarioNamedAction {
	const g = gestures[kind];
	return {
		name: "deep: switch or extend selection, rotate, orbit, sent values",
		run: async (page, slug) => {
			const puts = trackCustomizations(page);
			const errors = collectPageErrors(page);
			await clickNode(page, BOXES[0]);
			await g.primary(page, [BOXES[0]]);
			await waitForModelRecomputed(page, async () => {
				await confirmButton(page).click();
			});
			expect(puts.count()).toBe(1);
			expect(
				transformValueFromBody(puts.last(), PARAMETER).names,
			).toEqual([`Boxes.${BOXES[0]}`]);

			if (kind === "rectangle") {
				// maximumSelection 1: clicking another box replaces the selection;
				// the value keeps the first box and adds the new one
				await clickNode(page, BOXES[2]);
				await takeSnapshot(page, `${slug}-deep-switched`);
				await g.translate(page, [BOXES[2]]);
				await waitForModelRecomputed(page, async () => {
					await confirmButton(page).click();
				});
				expect(puts.count()).toBe(2);
				const moved = matrixOf(puts.last(), BOXES[2]);
				expect(isIdentity(moved)).toBe(false);
				await g.rotate(page, [BOXES[2]]);
				await waitForModelRecomputed(page, async () => {
					await confirmButton(page).click();
				});
				expect(puts.count()).toBe(3);
				const rotated = matrixOf(puts.last(), BOXES[2]);
				expect(matricesDiffer(rotated, moved)).toBe(true);
				expect(isRotated(rotated)).toBe(true);
			} else {
				// maximumSelection 3: clicking more boxes extends the selection,
				// the gumball moves all of them
				await clickNode(page, BOXES[1]);
				await clickNode(page, BOXES[2]);
				await takeSnapshot(page, `${slug}-deep-multi-selected`);
				await g.translate(page, BOXES);
				await waitForModelRecomputed(page, async () => {
					await confirmButton(page).click();
				});
				expect(puts.count()).toBe(2);
				const translated = puts.last();
				const value = transformValueFromBody(translated, PARAMETER);
				expect([...value.names].sort()).toEqual(
					BOXES.map((b) => `Boxes.${b}`).sort(),
				);
				for (const m of value.transformations) {
					expect(length(translationOf(m))).toBeGreaterThan(0.1);
				}
				await g.rotate(page, BOXES);
				await waitForModelRecomputed(page, async () => {
					await confirmButton(page).click();
				});
				expect(puts.count()).toBe(3);
				// every box changed again (the tilted box is rotated already,
				// so only a change against the previous request is meaningful)
				for (const box of BOXES) {
					expect(
						matricesDiffer(
							matrixOf(puts.last(), box),
							matrixOf(translated, box),
						),
					).toBe(true);
				}
			}
			await takeSnapshot(page, `${slug}-deep-confirmed`);

			// orbiting the camera is not an interaction
			await settle(page);
			await orbitCamera(page);
			await expectNoCustomization(page, puts, 3);
			await takeSnapshot(page, `${slug}-deep-orbit`);
			expect(errors.errors()).toEqual([]);
		},
	};
}

function transformAutoDeep(kind: Kind): ScenarioNamedAction {
	const g = gestures[kind];
	return {
		name: "deep: debounced moves, move during request, other selection",
		run: async (page, slug) => {
			const puts = trackCustomizations(page);
			const errors = collectPageErrors(page);
			await clickNode(page, BOXES[0]);

			// two moves within the idle timeout: one request with both
			await waitForModelRecomputed(page, async () => {
				await g.translateTwice(page, [BOXES[0]]);
			});
			expect(puts.count()).toBe(1);
			const combined = matrixOf(puts.last(), BOXES[0]);
			await takeSnapshot(page, `${slug}-deep-debounced`);

			// a move while the request is in flight does not register: the viewer
			// blocks interactions while a request runs, and the gizmo is recreated
			// on the new node when the request lands
			const restoreRouting = await delayCustomizations(
				page,
				REQUEST_DELAY,
			);
			await g.translate(page, [BOXES[0]]);
			// the request is sent after the idle timeout and is now in flight
			await page.waitForTimeout(IDLE_WAIT);
			expect(puts.count()).toBe(2);
			const before = await nodeBounds(page, BOXES[0]);
			await g.translateUnverified(page, [BOXES[0]]);
			await page.waitForTimeout(500);
			expect(
				boundsChanged(before, await nodeBounds(page, BOXES[0])),
			).toBe(false);
			// the request lands, nothing else is sent, nothing is pending
			await page.waitForTimeout(REQUEST_DELAY);
			await restoreRouting();
			await expectNoCustomization(page, puts, 2);
			await expect(cancelButton(page)).toHaveCount(0);
			const single = matrixOf(puts.last(), BOXES[0]);
			// placements are absolute: the second request includes the first
			expect(matricesDiffer(single, combined)).toBe(true);
			expect(
				length(translationOf(single)) - length(translationOf(combined)),
			).toBeGreaterThan(0.1);
			await takeSnapshot(page, `${slug}-deep-dropped`);

			// another box (the rectangle replaces the selection, the gumball
			// extends it); the value keeps every transformed box
			await clickNode(page, BOXES[2]);
			await expectNoCustomization(page, puts, 2);
			const selected =
				kind === "rectangle" ? [BOXES[2]] : [BOXES[0], BOXES[2]];
			await waitForModelRecomputed(page, async () => {
				await g.translate(page, selected);
			});
			expect(puts.count()).toBe(3);
			expect(isIdentity(matrixOf(puts.last(), BOXES[2]))).toBe(false);
			await takeSnapshot(page, `${slug}-deep-other`);
			expect(errors.errors()).toEqual([]);
		},
	};
}

function expectPointsMoved(body: string, before: number[][]) {
	const after = drawingPointsFromBody(body);
	expect(after.length).toBe(before.length);
	expect(after[1][0]).toBeGreaterThan(before[1][0] + 0.5);
	expect(after[2][0]).toBeGreaterThan(before[2][0] + 0.5);
	expect(after[3]).toEqual(before[3]);
}

async function committedPoints(page: Page): Promise<number[][]> {
	return Promise.all(
		[0, 1, 2, 3, 4].map((i) =>
			drawingParameterPoint(page, DRAWING_PARAMETER, i).then((p) => [
				...p,
			]),
		),
	);
}

const drawingBasicDeep: ScenarioNamedAction = {
	name: "deep: move two points, sent values, reopen and cancel",
	run: async (page, slug) => {
		const puts = trackCustomizations(page);
		const errors = collectPageErrors(page);
		const before = await committedPoints(page);
		await startDrawingButton(page).click();
		await dragDrawingPoint(page, 1);
		await dragDrawingPoint(page, 2);
		await expectDrawingDirty(page, "widget");
		await takeSnapshot(page, `${slug}-deep-moved`);
		await waitForModelRecomputed(page, async () => {
			await confirmButton(page).click();
		});
		expect(puts.count()).toBe(1);
		expectPointsMoved(puts.last(), before);

		await startDrawingButton(page).click();
		await dragDrawingPoint(page, 3);
		await expectDrawingDirty(page, "widget");
		await cancelButton(page).click();
		await expectNoCustomization(page, puts, 1);
		await expect(confirmButton(page)).toHaveCount(0);
		await takeSnapshot(page, `${slug}-deep-cancelled`);
		expect(errors.errors()).toEqual([]);
	},
};

const drawingAlwaysActiveDeep: ScenarioNamedAction = {
	name: "deep: move two points, clear below minimum, cancel restores",
	run: async (page, slug) => {
		const puts = trackCustomizations(page);
		const errors = collectPageErrors(page);
		const before = await committedPoints(page);
		await dragDrawingPoint(page, 1);
		await dragDrawingPoint(page, 2);
		await expectDrawingDirty(page, "toolbar");
		await waitForModelRecomputed(page, async () => {
			await confirmButton(page).click();
		});
		expect(puts.count()).toBe(1);
		expectPointsMoved(puts.last(), before);

		// Clear is offered once the drawing changed; below the minimum of 3
		// points nothing can be confirmed
		await dragDrawingPoint(page, 3);
		await expectDrawingDirty(page, "toolbar");
		await clearButton(page).click();
		await expect(confirmButton(page)).toBeDisabled();
		await takeSnapshot(page, `${slug}-deep-cleared`);
		await cancelButton(page).click();
		await expectNoCustomization(page, puts, 1);
		await expect(confirmButton(page)).toHaveCount(0);
		await takeSnapshot(page, `${slug}-deep-restored`);
		expect(errors.errors()).toEqual([]);
	},
};

const drawingAutoDeep: ScenarioNamedAction = {
	name: "deep: debounced moves, no controls at all, orbit",
	run: async (page, slug) => {
		const puts = trackCustomizations(page);
		const errors = collectPageErrors(page);
		const before = await committedPoints(page);
		// two moves within the idle timeout: one request with both
		await waitForModelRecomputed(page, async () => {
			await dragDrawingPoint(page, 1);
			await dragDrawingPoint(page, 2, {pause: false, quick: true});
			await expectDrawingDirty(page, "automatic");
		});
		expect(puts.count()).toBe(1);
		expectPointsMoved(puts.last(), before);
		await takeSnapshot(page, `${slug}-deep-debounced`);

		// the example turns Clear off as well: a third move offers no control
		// at all and is sent after the idle timeout
		await waitForModelRecomputed(page, async () => {
			await dragDrawingPoint(page, 3);
			await expectDrawingDirty(page, "automatic");
		});
		expect(puts.count()).toBe(2);

		// orbiting the camera is not an interaction
		await settle(page);
		await orbitCamera(page);
		await expectNoCustomization(page, puts, 2);
		expect(errors.errors()).toEqual([]);
	},
};

const deepActionsBySlug: Record<string, ScenarioNamedAction> = {
	"example-rectangle-basic": transformBasicDeep("rectangle"),
	"example-rectangle-alwaysActive": transformAlwaysActiveDeep("rectangle"),
	"example-rectangle-alwaysActive-automaticSceneUpdate":
		transformAutoDeep("rectangle"),
	"example-gumball-basic": transformBasicDeep("gumball"),
	"example-gumball-alwaysActive": transformAlwaysActiveDeep("gumball"),
	"example-gumball-alwaysActive-automaticSceneUpdate":
		transformAutoDeep("gumball"),
	"example-drawing-basic": drawingBasicDeep,
	"example-drawing-alwaysActive": drawingAlwaysActiveDeep,
	"example-drawing-alwaysActive-automaticSceneUpdate": drawingAutoDeep,
};

/**
 * A reset value (`settings.resetValue: ""`) commits the default after every
 * execution, so `commitValue !== execValue` and the persistent gizmo restarts
 * on the updated box. The requests look the same as without a reset value
 * (absolute placements); the test exercises the restart path: the restarted
 * gizmo keeps working and nothing is sent without a move.
 */
export const interactionExampleExtraScenarios: ScenarioActionConfig[] = [
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

/** Append the deep named action to each interaction example scenario. */
export function withDeepActions(
	scenarios: ScenarioActionConfig[],
): ScenarioActionConfig[] {
	return scenarios.map((scenario) => {
		const deep = deepActionsBySlug[scenario.slug];
		if (!deep) return scenario;
		return {
			...scenario,
			namedActions: [...(scenario.namedActions ?? []), deep],
		};
	});
}
