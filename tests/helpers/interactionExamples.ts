/**
 * Shared helpers of the interaction example scenarios (SS-10024): locators,
 * waits, verified gizmo gestures and drawing point drags.
 *
 * Every gesture asserts that it moved something: a drag that misses a handle
 * orbits the camera instead, and most flows would still pass (Confirm is
 * enabled as soon as an object is selected and a request is sent for any
 * changed value).
 */
import {expect, Page} from "@playwright/test";
import {getParameterElement} from "./getParameterElement";
import {
	boundsChanged,
	type CustomizationTracker,
	dragMouse,
	drawingParameterPoint,
	nodeBounds,
	nodeScreenPoint,
	nodesScreenCenter,
	worldScreenPoint,
} from "./sceneCoords";

/** box_transformed is tilted in the model, box_translated is axis aligned. */
export const BOXES = ["box_original", "box_transformed", "box_translated"];
export const PARAMETER = "RectangleTransform";
export const DRAWING_PARAMETER = "Boundary";
/** The drawing point which is dragged (index into the Boundary value of 2i). */
export const DRAWING_POINT_INDEX = 1;
/** Longer than automaticSceneUpdateTimeout (3000 ms in the examples); requests are counted when sent. */
export const IDLE_WAIT = 5_000;
/**
 * Wait before a gesture: the camera animates to a new framing after the first
 * customization, and a cancelled or confirmed drawing recreates its tools.
 */
export const SETTLE = 1_500;
const DRAG_PX = 60;

export type Kind = "rectangle" | "gumball";
export type DrawingMode = "widget" | "toolbar" | "automatic";

export const confirmButton = (page: Page) =>
	page.getByRole("button", {name: "Confirm"});
export const cancelButton = (page: Page) =>
	page.getByRole("button", {name: "Cancel"});
export const clearButton = (page: Page) =>
	page.getByRole("button", {name: "Clear"});
export const startTransformButton = (page: Page) =>
	getParameterElement(page, PARAMETER).getByRole("button", {
		name: "Start transform",
	});
export const startDrawingButton = (page: Page) =>
	getParameterElement(page, DRAWING_PARAMETER).getByRole("button").first();
export const drawingSettingsButton = (page: Page) =>
	page
		.getByLabel("Interaction toolbar")
		.getByRole("button", {name: "Drawing settings"});

export const settle = (page: Page) => page.waitForTimeout(SETTLE);

/**
 * Click a box. The projected center of its bounding box always lies on the
 * box (the top face center of the tilted box does not).
 */
export async function clickNode(page: Page, node: string) {
	await settle(page);
	const center = await nodeScreenPoint(page, node, [0.5, 0.5, 0.5]);
	await page.mouse.click(center.x, center.y);
	await page.waitForTimeout(500);
}

/** Wait past the idle timeout and assert that no further request was sent. */
export async function expectNoCustomization(
	page: Page,
	puts: CustomizationTracker,
	expected: number,
) {
	await page.waitForTimeout(IDLE_WAIT);
	expect(puts.count()).toBe(expected);
}

/** Run a gesture and assert that it changed the bounds of the first node. */
async function verified(
	page: Page,
	nodes: string[],
	gesture: () => Promise<void>,
) {
	await settle(page);
	const before = await nodeBounds(page, nodes[0]);
	await gesture();
	await page.waitForTimeout(300);
	const after = await nodeBounds(page, nodes[0]);
	expect(
		boundsChanged(before, after),
		`the gesture did not move ${nodes[0]}`,
	).toBe(true);
}

/**
 * Gestures of a transformation tool. `nodes` are the selected scene nodes;
 * the gizmo sits on their common center.
 */
export type Gestures = {
	/** The gesture of the simple tests: corner scale / axis translation. */
	primary: (page: Page, nodes: string[]) => Promise<void>;
	translate: (page: Page, nodes: string[]) => Promise<void>;
};

const rectangleGestures: Gestures = {
	primary: (page, nodes) =>
		verified(page, nodes, async () => {
			const corner = await nodeScreenPoint(page, nodes[0], [1, 1, 1]);
			await dragMouse(page, corner, {x: corner.x + DRAG_PX, y: corner.y});
		}),
	// Dragging the translation plane (at the base of the object) is a Viewer
	// issue (see the ticket notes); scaling from the opposite corner moves the
	// origin of the transformation instead.
	translate: (page, nodes) =>
		verified(page, nodes, async () => {
			const corner = await nodeScreenPoint(page, nodes[0], [0, 0, 1]);
			await dragMouse(page, corner, {x: corner.x - DRAG_PX, y: corner.y});
		}),
};

/** The gumball's first axis handle sits 48 px right of its center. */
const gumballHandle = async (page: Page, nodes: string[]) => {
	const center = await nodesScreenCenter(page, nodes);
	return {x: center.x + 48, y: center.y};
};

const gumballTranslate: Gestures["translate"] = (page, nodes) =>
	verified(page, nodes, async () => {
		const from = await gumballHandle(page, nodes);
		await dragMouse(page, from, {x: from.x + DRAG_PX, y: from.y});
	});

const gumballGestures: Gestures = {
	// the gumball's primary gesture is its axis translation
	primary: gumballTranslate,
	translate: gumballTranslate,
};

export const gestures: Record<Kind, Gestures> = {
	rectangle: rectangleGestures,
	gumball: gumballGestures,
};

/**
 * Drag a point of the Boundary drawing, starting from its current value
 * (points move with every confirmation). `expectDrawingDirty` verifies it.
 */
export async function dragDrawingPoint(
	page: Page,
	index = DRAWING_POINT_INDEX,
	options: {pause?: boolean; quick?: boolean} = {},
) {
	if (options.pause !== false) await settle(page);
	const point = await drawingParameterPoint(page, DRAWING_PARAMETER, index);
	const from = await worldScreenPoint(page, point);
	await dragMouse(
		page,
		from,
		{x: from.x + DRAG_PX, y: from.y},
		options.quick === true,
	);
}

/**
 * Assert that a drawing drag registered: the drawing offers Confirm. In
 * automatic mode (the example turns Clear off as well) no control is offered;
 * the request sent after the idle timeout is the only evidence of the move.
 */
export async function expectDrawingDirty(page: Page, mode: DrawingMode) {
	if (mode === "automatic") {
		await expect(confirmButton(page)).toHaveCount(0);
		await expect(cancelButton(page)).toHaveCount(0);
		await expect(clearButton(page)).toHaveCount(0);
	} else {
		await expect(confirmButton(page)).toBeEnabled();
	}
}
