import {expect, Page} from "@playwright/test";
import type {ScenarioNamedAction} from "./scenarioActions";

/**
 * E2E coverage for the "assign" camera action (SS-10342,
 * `public/example-cameraAssign.json`, model of `example-executeActions`).
 *
 * The viewer fits a camera to the scene only when the scene is loaded for the
 * first time. Switching to a camera with `initialAutoAdjust` must fit it to
 * the current scene, switching to a camera without it must leave its pose
 * alone.
 */

type Vec3 = [number, number, number];

type CameraPose = {position: Vec3; target: Vec3};

/**
 * Prepares the camera `name`: sets its `initialAutoAdjust`, makes the other
 * camera the active one and moves the camera away from its fitted pose.
 * Returns the fitted pose and the pose the camera was moved to.
 */
async function prepareCamera(
	page: Page,
	name: string,
	otherName: string,
	initialAutoAdjust: boolean,
): Promise<{fitted: CameraPose; moved: CameraPose}> {
	return page.evaluate(
		async ([cameraName, otherCameraName, autoAdjust]) => {
			const SDV = (window as any).SDV;
			const viewport = Object.values(SDV.viewports)[0] as any;
			const cameras = Object.values(viewport.cameras) as any[];
			// default cameras have no name, the action matches the id then
			const label = (c: any) => (c.name ?? c.id).toLowerCase();
			const camera = cameras.find((c) => label(c) === cameraName);
			const other = cameras.find((c) => label(c) === otherCameraName);
			if (!camera || !other) throw new Error("Camera not found");

			const toArray = (v: ArrayLike<number>) =>
				[v[0], v[1], v[2]] as [number, number, number];

			camera.initialAutoAdjust = autoAdjust;
			other.initialAutoAdjust = false;
			viewport.assignCamera(other.id);

			const fit = camera.calculateZoomTo();
			const fitted = {
				position: toArray(fit.position),
				target: toArray(fit.target),
			};
			// same viewing direction, twice the distance
			const moved = {
				position: [0, 1, 2].map(
					(i) =>
						fitted.target[i] +
						(fitted.position[i] - fitted.target[i]) * 2,
				) as [number, number, number],
				target: fitted.target,
			};
			await camera.set(moved.position, moved.target, {duration: 0});

			return {fitted, moved};
		},
		[name, otherName, initialAutoAdjust] as const,
	);
}

/** Pose of the active camera of the first viewport. */
const activeCameraPose = (page: Page) =>
	page.evaluate(() => {
		const SDV = (window as any).SDV;
		const viewport = Object.values(SDV.viewports)[0] as any;
		const camera = viewport.camera;
		const toArray = (v: ArrayLike<number>) => [v[0], v[1], v[2]];

		return {
			name: (camera.name ?? camera.id).toLowerCase() as string,
			position: toArray(camera.position),
			target: toArray(camera.target),
		};
	});

const distance = (a: ArrayLike<number>, b: ArrayLike<number>) =>
	Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);

const assignButton = (page: Page, name: string) =>
	page.getByLabel("camera-assign-toolbar").getByRole("button", {name});

export const scenarioCameraAssignNamedActions: ScenarioNamedAction[] = [
	{
		name: "assigning a camera with initialAutoAdjust fits it to the scene",
		run: async (page) => {
			const {fitted, moved} = await prepareCamera(
				page,
				"front",
				"perspective",
				true,
			);
			expect(distance(moved.position, fitted.position)).toBeGreaterThan(
				1e-3,
			);

			await assignButton(page, "Assign Front").click();

			await expect
				.poll(async () => {
					const pose = await activeCameraPose(page);

					return pose.name === "front"
						? distance(pose.position, fitted.position)
						: Infinity;
				})
				.toBeLessThan(1e-3);
		},
	},
	{
		name: "assigning a camera without initialAutoAdjust keeps its pose",
		run: async (page) => {
			const {fitted, moved} = await prepareCamera(
				page,
				"front",
				"perspective",
				false,
			);
			expect(distance(moved.position, fitted.position)).toBeGreaterThan(
				1e-3,
			);

			await assignButton(page, "Assign Front").click();

			await expect
				.poll(async () => (await activeCameraPose(page)).name)
				.toBe("front");
			// give a (wrongly) triggered fit the time to finish
			await page.waitForTimeout(1000);
			const pose = await activeCameraPose(page);
			expect(distance(pose.position, moved.position)).toBeLessThan(1e-3);
		},
	},
];
