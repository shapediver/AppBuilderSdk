/**
 * Per-slug interaction definitions for the AppBuilder E2E test suite.
 * See tests/README.md for the overall setup and workflow.
 *
 * ─── HOW TO ADD A TEST ───────────────────────────────────────────────────────
 * Add an entry to `scenarioActions` below. Every slug in this array gets:
 *   • smoke test    — page loads, canvas is visible, no JS errors
 *   • visual test   — full-page screenshot matches the stored baseline
 *   • interaction   — runs the `actions` callback (only when `actions` is set)
 *
 * Slugs NOT listed here still receive smoke + visual tests automatically.
 *
 * ─── COMMON PATTERNS ─────────────────────────────────────────────────────────
 *
 * SLIDER PARAMETER
 *   Sliders have no aria-label of their own; scope to the parameter container
 *   first. The companion number textbox also works (fill + Enter).
 *
 *     await waitForModelRecomputed(page, async () => {
 *       await getParameterElement(page, "Count").getByRole("slider").fill("4");
 *     });
 *
 * TEXT INPUT PARAMETER
 *   Single-line Mantine TextInput — fill the textbox and press Enter to commit.
 *
 *     await waitForModelRecomputed(page, async () => {
 *       const input = getParameterElement(page, "Label").getByRole("textbox");
 *       await input.fill("hello");
 *       await input.press("Enter");
 *     });
 *
 * MULTILINE TEXT INPUT PARAMETER
 *   Mantine Textarea — use \n for newlines; press Tab to blur and trigger
 *   the Grasshopper recompute.
 *
 *     await waitForModelRecomputed(page, async () => {
 *       const ta = getParameterElement(page, "Notes").getByRole("textbox");
 *       await ta.fill("line1\nline2\nline3");
 *       await ta.press("Tab");
 *     });
 *
 * SELECT / DROPDOWN PARAMETER
 *   Mantine Select renders the input as a textbox (role="textbox").
 *   Click it to open the dropdown portal, then click the option.
 *   Options render outside the parameter container, so use page.getByRole.
 *
 *     await waitForModelRecomputed(page, async () => {
 *       await getParameterElement(page, "Material").getByRole("textbox").click();
 *       await page.getByRole("option", { name: "Wood" }).click();
 *     });
 *
 * FILE INPUT PARAMETER
 *   Mantine FileInput hides the native <input type="file"> inside a button.
 *   setInputFiles() targets the DOM element directly — no file dialog opens.
 *   Use as a `setup` callback when the model requires the file before loading.
 *
 *     await getParameterElement(page, "Floor Plan")
 *       .locator('input[type="file"]')
 *       .setInputFiles(path.resolve("tests/config/files/plan.3dm"));
 *
 * ACTIVATION BUTTON (selection / gumball / points input)
 *   These controls expose a plain "activate" button with no specific label.
 *
 *     await getParameterElement(page, "SelectBox").getByRole("button").click();
 *
 * ACTION BUTTON (fires a Grasshopper script immediately)
 *
 *     await waitForModelRecomputed(page, async () => {
 *       await page.getByRole("button", { name: "Run Script" }).click();
 *     });
 *
 * EXPORT / DOWNLOAD
 *   Register the download listener BEFORE clicking so the event is never missed.
 *
 *     const dl = page.waitForEvent("download");
 *     await page.getByRole("button", { name: "Download File" }).click();
 *     const download = await dl;
 *     expect(download.suggestedFilename()).toMatch(/\.(3dm|obj|stl)$/i);
 *
 * CANVAS MOUSE INTERACTION
 *   viewportCoords() converts normalised (0–1) positions to absolute pixels.
 *
 *     const pos = await viewportCoords(page, 0.5, 0.5); // centre
 *     await page.mouse.click(pos.x, pos.y);
 *
 * ACCORDION / STACK NAVIGATION
 *
 *     await page.getByRole("button", { name: "Section" }).click();
 *     await page.getByRole("region", { name: "Section" }).waitFor({ state: "visible" });
 *
 * ─────────────────────────────────────────────────────────────────────────────
 */

import {expect, Page} from "@playwright/test";
import * as path from "path";
import {getParameterElement} from "../helpers/getParameterElement";
import {takeSnapshot} from "../helpers/takeSnapshot";
import {viewportCoords} from "../helpers/viewportCoords";
import {waitForModelRecomputed} from "../helpers/waitForModelRecomputed";

export interface ScenarioActionConfig {
	slug: string;
	/**
	 * Optional pre-load setup steps executed after navigation but BEFORE
	 * waitForAppReady. Use this for anything the model needs to start
	 * loading at all — e.g. uploading a required input file.
	 * Runs in every test (smoke, visual, and interaction).
	 */
	setup?: (page: Page) => Promise<void>;
	/**
	 * Additional URL query parameters such as modelStateId or g (theme).
	 * These are appended to the test URL after the branch rewrite.
	 */
	params?: Record<string, string>;
	/**
	 * Per-example interaction steps executed after the model has fully loaded.
	 * When defined, an interaction test is generated in addition to the smoke
	 * and visual tests. When undefined, only smoke + visual tests run.
	 * @param page - Playwright Page
	 * @param slug - Use it to name snapshots: `${slug}-state-name`
	 */
	actions?: (page: Page, slug: string) => Promise<void>;
}

export const scenarioActions: ScenarioActionConfig[] = [
	{
		// The "Floor Plan" file parameter must be set before the model can load,
		// so it belongs in `setup` rather than `actions`.
		slug: "appbuilder-tutorial2-contextualui",
		setup: async (page) => {
			await getParameterElement(page, "Floor Plan")
				.locator('input[type="file"]')
				.setInputFiles(
					path.resolve(
						"tests/config/files/11B-AppBuilder_Tutorial2_ExampleInput.3dm",
					),
				);
		},
	},

	{
		// Image upload: FILE INPUT PARAMETER pattern.
		slug: "appbuilder-tutorial3-imagewidget",
		actions: async (page, slug) => {
			await waitForModelRecomputed(page, async () => {
				await getParameterElement(page, "Upload Your Image")
					.locator('input[type="file"]')
					.setInputFiles(
						path.resolve("tests/config/files/logo.png"),
					);
			});
			await takeSnapshot(page, `${slug}-after-upload`);
		},
	},

	{
		// Slider parameter: the slider has no accessible label, so we target
		// the companion number textbox (TEXT INPUT PARAMETER pattern).
		slug: "appbuilder-tutorial4-charts",
		actions: async (page, slug) => {
			const input = getParameterElement(page, "Block to Edit").getByRole(
				"textbox",
			);
			await waitForModelRecomputed(page, async () => {
				await input.fill("2");
				await input.press("Enter");
			});
			await takeSnapshot(page, `${slug}-block2`);
		},
	},

	{
		// EXPORT / DOWNLOAD pattern: assert that a file download is offered.
		slug: "11e-parameterandexportcontrols",
		actions: async (page, _slug) => {
			const downloadPromise = page.waitForEvent("download");
			await page.getByRole("button", {name: "Download File"}).click();
			const download = await downloadPromise;
			expect(download.suggestedFilename()).toMatch(
				/\.(3dm|obj|stl|step|iges)$/i,
			);
		},
	},

	{
		// ACTION BUTTON pattern: two buttons, each triggering a recompute.
		slug: "11f-actioncontrol",
		actions: async (page, slug) => {
			await waitForModelRecomputed(page, async () => {
				await page
					.getByRole("button", {name: "Small and blue"})
					.click();
			});
			await takeSnapshot(page, `${slug}-small-blue`);

			await waitForModelRecomputed(page, async () => {
				await page
					.getByRole("button", {name: "Tall and green"})
					.click();
			});
			await takeSnapshot(page, `${slug}-tall-green`);
		},
	},

	{
		// ACCORDION / STACK NAVIGATION pattern.
		slug: "11g-accordionandstackwidgets",
		actions: async (page, slug) => {
			await page.getByRole("button", {name: "Accordion"}).click();
			await page
				.getByRole("region", {name: "Accordion"})
				.waitFor({state: "visible"});
			await takeSnapshot(page, `${slug}-accordion`);

			await page.getByRole("button", {name: "Stack"}).click();
			await page
				.getByRole("button", {name: "Back"})
				.waitFor({state: "visible"});
			await takeSnapshot(page, `${slug}-stack`);
		},
	},

	{
		// ACTIVATION BUTTON + canvas click: activate the selection input,
		// then click a point in the viewport to make a selection.
		slug: "2d-selectioninput-tutorial1",
		actions: async (page, slug) => {
			await getParameterElement(page, "SelectBox")
				.getByRole("button")
				.click();

			const pos = await viewportCoords(page, 0.35, 0.5);
			await waitForModelRecomputed(page, async () => {
				await page.mouse.click(pos.x, pos.y);
			});
			await takeSnapshot(page, `${slug}-selection`);
		},
	},

	{
		// Same as 2D but selects a different object at a different canvas position.
		slug: "2e-selectioninput-tutorial2",
		actions: async (page, slug) => {
			await getParameterElement(page, "SelectBox")
				.getByRole("button")
				.click();

			const pos = await viewportCoords(page, 0.6, 0.7);
			await waitForModelRecomputed(page, async () => {
				await page.mouse.click(pos.x, pos.y);
			});
			await takeSnapshot(page, `${slug}-selection`);
		},
	},

	{
		// Minimal gumball example — just activate and snapshot.
		slug: "2f-minimalgumballexample",
		actions: async (page, slug) => {
			await getParameterElement(page, "GumballInput")
				.getByRole("button")
				.click();
			await takeSnapshot(page, `${slug}-activation`);
		},
	},

	{
		// Full gumball workflow: activate → drag geometry → confirm.
		slug: "2g-gumballinput-tutorial1",
		actions: async (page, slug) => {
			await getParameterElement(page, "GumballInput")
				.getByRole("button")
				.click();
			await takeSnapshot(page, `${slug}-activation`);

			// Drag from canvas centre slightly left
			const from = await viewportCoords(page, 0.5, 0.5);
			const to = await viewportCoords(page, 0.3, 0.5);
			await page.mouse.move(from.x, from.y);
			await page.mouse.down();
			await page.mouse.move(to.x, to.y, {steps: 10});
			await page.mouse.up();

			await waitForModelRecomputed(page, async () => {
				await getParameterElement(page, "GumballInput")
					.getByRole("button", {name: "Confirm"})
					.click();
			});
			await takeSnapshot(page, `${slug}-move`);
		},
	},

	{
		// Points input — activate only; no geometry interaction needed.
		slug: "2i-pointsinputsimpleexample",
		actions: async (page, slug) => {
			await getParameterElement(page, "Boundary")
				.getByRole("button")
				.click();
			await takeSnapshot(page, `${slug}-activation`);
		},
	},

	{
		// Points input with geometry constraints — navigate to the group first.
		slug: "2j-pointsinputgeometryconstraints",
		actions: async (page, slug) => {
			await page.getByRole("button", {name: "Group"}).click();
			await getParameterElement(page, "PointsInput")
				.getByRole("button")
				.click();
			await takeSnapshot(page, `${slug}-activation`);
		},
	},

	{
		// SLIDER PARAMETER pattern.
		slug: "beta-dynamicsliderstutorial",
		actions: async (page, slug) => {
			const input = getParameterElement(page, "SphereCount").getByRole(
				"textbox",
			);
			await waitForModelRecomputed(page, async () => {
				await input.fill("6");
				await input.press("Enter");
			});
			await takeSnapshot(page, `${slug}-count6`);
		},
	},

	{
		// SELECT / DROPDOWN PARAMETER pattern (Mantine Select).
		// The dropdown portal renders outside the parameter container,
		// so options must be queried on `page`, not on the container.
		slug: "beta-dynamicvalueliststutorial",
		actions: async (page, slug) => {
			await waitForModelRecomputed(page, async () => {
				await getParameterElement(page, "FoodType")
					.getByRole("textbox")
					.click();
				await page.getByRole("option", {name: "Vegetables"}).click();
			});
			await takeSnapshot(page, `${slug}-vegetables`);
		},
	},

	{
		// MULTILINE TEXT INPUT PARAMETER pattern.
		// Tab-blur triggers the Mantine onChange and the Grasshopper recompute.
		slug: "beta-multilinetextinput",
		actions: async (page, slug) => {
			const textarea = getParameterElement(
				page,
				"MultilineText",
			).getByRole("textbox");
			await waitForModelRecomputed(page, async () => {
				await textarea.fill("Default\nExample\nTest");
				await textarea.press("Tab");
			});
			await takeSnapshot(page, `${slug}-multiline`);
		},
	},

	{
		// SLIDER PARAMETER pattern — dynamic instances controller.
		slug: "beta-instancestutorial1-controller",
		actions: async (page, slug) => {
			const input = getParameterElement(page, "Count").getByRole(
				"textbox",
			);
			await waitForModelRecomputed(page, async () => {
				await input.fill("4");
				await input.press("Enter");
			});
			await takeSnapshot(page, `${slug}-count4`);
		},
	},

	{
		// 3D anchor: click the canvas centre to open the anchor overlay.
		slug: "beta-anchor3d",
		actions: async (page, slug) => {
			const pos = await viewportCoords(page, 0.5, 0.5);
			await page.mouse.click(pos.x, pos.y);
			await takeSnapshot(page, `${slug}-open`);
		},
	},

	{
		// Camera action button: the button is disabled for the animation duration
		// (default 2500 ms) and re-enables when the movement completes.
		slug: "beta-cameraaction",
		actions: async (page, slug) => {
			const button = page.getByRole("button", {name: "Set Camera"});
			await button.click();

			await expect(button).toBeDisabled();
			await takeSnapshot(page, `${slug}-animating`);

			await expect(button).toBeEnabled();
			await takeSnapshot(page, `${slug}-done`);
		},
	},
];

/** Fast lookup by slug */
export const scenarioActionById = new Map<string, ScenarioActionConfig>(
	scenarioActions.map((c) => [c.slug, c]),
);
