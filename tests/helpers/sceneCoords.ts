import {Page} from "@playwright/test";

/**
 * Screen coordinates of scene geometry, computed at runtime through the viewer
 * API. Interaction gizmos follow the geometry, so tests that drag handles must
 * not rely on fixed canvas coordinates: the camera may zoom after a
 * customization and the geometry itself moves with every transformation.
 */

export type Vec3 = [number, number, number];

/** Page coordinates of a world space point (first viewport). */
export async function worldScreenPoint(
	page: Page,
	point: Vec3,
): Promise<{x: number; y: number}> {
	const ndc = await page.evaluate((p) => {
		const SDV = (window as any).SDV;
		const viewport = Object.values(SDV.viewports)[0] as any;
		// project() writes into its argument, pass a copy
		const projected = viewport.camera.project([...p]);
		return [projected[0], projected[1]];
	}, point);
	const box = await page.locator("canvas").first().boundingBox();
	if (!box) throw new Error("Canvas not found or has no bounding box");
	return {
		x: box.x + ((ndc[0] + 1) / 2) * box.width,
		y: box.y + ((1 - ndc[1]) / 2) * box.height,
	};
}

/**
 * World space bounding box of the first scene node with this name. The node
 * is briefly absent while an output update swaps the session's node tree, so
 * the lookup is retried for a short while.
 */
export async function nodeBounds(
	page: Page,
	nodeName: string,
): Promise<{min: Vec3; max: Vec3}> {
	const lookup = () =>
		page.evaluate((name) => {
			const SDV = (window as any).SDV;
			for (const session of Object.values(SDV.sessions) as any[]) {
				const nodes = session.node?.getNodesByName(name) ?? [];
				if (nodes.length === 0) continue;
				const bb = nodes[0].boundingBox;
				return {
					min: [bb.min[0], bb.min[1], bb.min[2]],
					max: [bb.max[0], bb.max[1], bb.max[2]],
				};
			}
			return undefined;
		}, nodeName);
	let bounds = await lookup();
	for (let attempt = 0; !bounds && attempt < 20; attempt++) {
		await page.waitForTimeout(100);
		bounds = await lookup();
	}
	if (!bounds) throw new Error(`Scene node "${nodeName}" not found`);
	return bounds as {min: Vec3; max: Vec3};
}

/**
 * Page coordinates of a point inside the bounding box of a scene node.
 * `fraction` is [0..1] per axis: [0.5, 0.5, 1] is the center of the top face.
 */
export async function nodeScreenPoint(
	page: Page,
	nodeName: string,
	fraction: Vec3 = [0.5, 0.5, 1],
): Promise<{x: number; y: number}> {
	const {min, max} = await nodeBounds(page, nodeName);
	const point = [0, 1, 2].map(
		(i) => min[i] + (max[i] - min[i]) * fraction[i],
	) as Vec3;
	return worldScreenPoint(page, point);
}

/**
 * Press, move in steps, release. The pointer approaches the start from an
 * offset: a press where the pointer already rests emits no hover update and
 * the gizmos then ignore it. `quick` shortens the waits so that the drag ends
 * within an idle timeout.
 */
export async function dragMouse(
	page: Page,
	from: {x: number; y: number},
	to: {x: number; y: number},
	quick = false,
): Promise<void> {
	await page.mouse.move(from.x - 40, from.y - 40);
	await page.waitForTimeout(quick ? 80 : 150);
	await page.mouse.move(from.x, from.y);
	// the gizmos and drawing tools need a hover update before the press (the
	// gumball otherwise grabs its pivot instead of the hovered handle)
	await page.waitForTimeout(quick ? 250 : 300);
	await page.mouse.down();
	await page.waitForTimeout(quick ? 50 : 100);
	await page.mouse.move(to.x, to.y, {steps: quick ? 10 : 20});
	await page.waitForTimeout(quick ? 50 : 100);
	await page.mouse.up();
}

export type CustomizationTracker = {
	count: () => number;
	/** Request bodies in order of sending. */
	bodies: () => string[];
	/** Body of the last customization request. */
	last: () => string;
};

/** Records customization requests (PUT) sent after this call. */
export function trackCustomizations(page: Page): CustomizationTracker {
	const bodies: string[] = [];
	page.on("request", (request) => {
		// customizations only (model states, exports and others are PUT too)
		if (
			request.method() === "PUT" &&
			new URL(request.url()).pathname.endsWith("/output")
		) {
			bodies.push(request.postData() ?? "");
		}
	});
	return {
		count: () => bodies.length,
		bodies: () => [...bodies],
		last: () => {
			if (bodies.length === 0) throw new Error("No customization sent");
			return bodies[bodies.length - 1];
		},
	};
}

/**
 * Delay the responses of customization requests by `ms` so that a test can
 * interact while a request is in flight. Returns a function that restores
 * normal routing.
 */
export async function delayCustomizations(
	page: Page,
	ms: number,
): Promise<() => Promise<void>> {
	const matcher = (url: URL) => url.pathname.endsWith("/output");
	await page.route(matcher, async (route) => {
		if (route.request().method() === "PUT") {
			await new Promise((resolve) => setTimeout(resolve, ms));
		}
		// the route may have been removed while the request was delayed
		await route.continue().catch(() => undefined);
	});
	return () => page.unroute(matcher);
}

/** Collects uncaught page errors from this call on. */
export function collectPageErrors(page: Page): {errors: () => string[]} {
	const errors: string[] = [];
	page.on("pageerror", (error) => errors.push(error.message));
	return {errors: () => [...errors]};
}

/**
 * The value of an interaction parameter (gumball / rectangle transform) sent
 * with a customization. The custom App Builder parameter travels inside the
 * `AppBuilder` string parameter: `{"<name>": "<serialized value>"}`.
 */
export function transformValueFromBody(
	body: string,
	parameterName: string,
): {names: string[]; transformations: number[][]} {
	const parameters = JSON.parse(body) as Record<string, unknown>;
	for (const value of Object.values(parameters)) {
		if (typeof value !== "string" || !value.includes(parameterName)) {
			continue;
		}
		const custom = JSON.parse(value) as Record<string, string>;
		if (typeof custom[parameterName] !== "string") continue;
		// the default value of the examples (a cleared transformation)
		if (custom[parameterName] === "")
			return {names: [], transformations: []};
		return JSON.parse(custom[parameterName]) as {
			names: string[];
			transformations: number[][];
		};
	}
	throw new Error(`Parameter "${parameterName}" not found in request body`);
}

/** The points of a drawing parameter value sent with a customization. */
export function drawingPointsFromBody(body: string): number[][] {
	const parameters = JSON.parse(body) as Record<string, unknown>;
	for (const value of Object.values(parameters)) {
		if (typeof value !== "string" || !value.startsWith('{"points"')) {
			continue;
		}
		return (JSON.parse(value) as {points: number[][]}).points;
	}
	throw new Error("Drawing parameter not found in request body");
}

/** Whether two bounding boxes differ in any coordinate. */
export const boundsChanged = (
	a: {min: Vec3; max: Vec3},
	b: {min: Vec3; max: Vec3},
	epsilon = 1e-3,
): boolean =>
	[0, 1, 2].some(
		(i) =>
			Math.abs(a.min[i] - b.min[i]) > epsilon ||
			Math.abs(a.max[i] - b.max[i]) > epsilon,
	);

/** Whether two column-major 4x4 matrices differ in any entry. */
export const matricesDiffer = (
	a: number[],
	b: number[],
	epsilon = 1e-3,
): boolean =>
	a.length !== b.length || a.some((v, i) => Math.abs(v - b[i]) > epsilon);

/** Translation part of a column-major 4x4 matrix. */
export const translationOf = (matrix: number[]): Vec3 => [
	matrix[12],
	matrix[13],
	matrix[14],
];

/** Whether a column-major 4x4 matrix rotates (non-zero off-diagonal in xy). */
export const isRotated = (matrix: number[]): boolean =>
	Math.abs(matrix[1]) > 1e-3 || Math.abs(matrix[4]) > 1e-3;

export const isIdentity = (matrix: number[]): boolean =>
	matrix.every((value, i) => Math.abs(value - (i % 5 === 0 ? 1 : 0)) < 1e-6);

/** Page coordinates of the center of the union bounding box of scene nodes. */
export async function nodesScreenCenter(
	page: Page,
	nodeNames: string[],
): Promise<{x: number; y: number}> {
	const bounds = await Promise.all(nodeNames.map((n) => nodeBounds(page, n)));
	const min = [0, 1, 2].map((i) => Math.min(...bounds.map((b) => b.min[i])));
	const max = [0, 1, 2].map((i) => Math.max(...bounds.map((b) => b.max[i])));
	return worldScreenPoint(
		page,
		[0, 1, 2].map((i) => (min[i] + max[i]) / 2) as Vec3,
	);
}

/**
 * A point of the current value of a drawing parameter (`{"points": [...]}`),
 * as executed by the session. Drawing points move with every confirmation,
 * so drags must start from the current value, not from the default.
 */
export async function drawingParameterPoint(
	page: Page,
	parameterName: string,
	index: number,
): Promise<Vec3> {
	const point = await page.evaluate(
		([name, i]) => {
			const SDV = (window as any).SDV;
			for (const session of Object.values(SDV.sessions) as any[]) {
				const parameter = (
					Object.values(session.parameters ?? {}) as any[]
				).find((p) => p.name === name);
				if (!parameter) continue;
				const points = JSON.parse(parameter.value).points as number[][];
				return points[i as number];
			}
			return undefined;
		},
		[parameterName, index] as const,
	);
	if (!point) {
		throw new Error(
			`Point ${index} of parameter "${parameterName}" not found`,
		);
	}
	return point as Vec3;
}
