/**
 * Per-slug interaction definitions for the AppBuilder E2E test suite.
 * See tests/README.md for the overall setup and workflow.
 *
 * ─── HOW TO ADD A TEST ───────────────────────────────────────────────────────
 * Add an entry to `scenarioActions` below. Every slug in this array gets:
 *   • smoke + visual — one test: page loads, canvas is visible, no JS
 *                      errors, full-page screenshot matches the baseline
 *   • interaction  — `actions` (one test) or each `namedActions` entry
 *
 * Slugs NOT listed here still receive smoke + visual tests automatically.
 *
 * ─── QUICK VS FULL SUITE ─────────────────────────────────────────────────────
 * Deploys to development, staging and task branches run the quick suite
 * (`pnpm test-e2e-quick`, tag `@quick`): smoke + visual for every slug and
 * the interactions of the entries with `quickSuite: true`. All other
 * interactions, including those from dedicated scenario files and the
 * e-commerce / tools API specs, run only in the full suite (nightly and on
 * release). Keep the quick suite to short, core interactions.
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
 *   Mantine Select renders the input as a combobox (role="combobox").
 *   Click it to open the dropdown portal, then click the option.
 *   Options render outside the parameter container, so use page.getByRole.
 *
 *     await waitForModelRecomputed(page, async () => {
 *       await getParameterElement(page, "Material").getByRole("combobox").click();
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
 * E-COMMERCE / TOOLS API
 *   Dedicated specs, not this file. Each API method is a named `actions[]`
 *   entry (one Playwright test per action):
 *     tests/specs/ecommerceApi.spec.ts  + tests/config/scenarioECommerceApi.ts
 *     tests/specs/toolsApi.spec.ts      + tests/config/scenarioToolsApi.ts
 *   Helpers: tests/helpers/eCommerceApi.ts, tests/helpers/toolsApi.ts.
 *
 * NAMED ACTIONS (several Playwright tests for one slug)
 *   Use `namedActions` instead of `actions` when the example needs isolated
 *   cases (viewport sizes, independent assertions). Each entry becomes
 *   `interaction: <name>` in appbuilder.spec.ts. Smoke + visual still run.
 *
 *     namedActions: [
 *       {
 *         name: "desktop keeps original slots",
 *         run: async (page, slug) => { ... },
 *       },
 *     ],
 *
 * ─────────────────────────────────────────────────────────────────────────────
 */

import {expect, Page} from "@playwright/test";
import * as path from "path";
import {getParameterElement} from "../helpers/getParameterElement";
import {routeSettingsHrefsToAppBase} from "../helpers/routeSettingsHrefsToAppBase";
import {takeSnapshot} from "../helpers/takeSnapshot";
import {viewportCoords} from "../helpers/viewportCoords";
import {waitForModelRecomputed} from "../helpers/waitForModelRecomputed";
import {interactionExampleScenarios} from "./interactionExampleScenarios";
import {
	actionSlotsActions,
	actionSlotsSelectionActions,
} from "./scenarioActionSlots";
import {scenarioFilterableDatabaseNamedActions} from "./scenarioFilterableDatabase";
import {scenarioFilterableDatabaseAllTypesNamedActions} from "./scenarioFilterableDatabaseAllTypes";
import {
	exampleMobileFallbackAnchorsNamedActions,
	exampleMobileFallbackGridNamedActions,
	exampleMobileFallbackKeepBottomNamedActions,
	exampleMobileFallbackNamedActions,
	exampleMobileFallbackTabsNamedActions,
} from "./scenarioMobileFallback";
import {
	selectionInputResetValueActions,
	textInputResetValueActions,
} from "./scenarioResetValue";
import {scenarioSelectWidgetsNamedActions} from "./scenarioSelectWidgets";
import {scenarioStringSelectNamedActions} from "./scenarioStringSelect";

export interface ScenarioNamedAction {
	name: string;
	run: (page: Page, slug: string) => Promise<void>;
	/**
	 * Optional test timeout in ms for this action (default: the global test
	 * timeout). Multi-step flows with several model computations and gizmo
	 * drags need more on CI runners with software rendering.
	 */
	timeout?: number;
}

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
	 * Optional steps executed BEFORE navigation, e.g. `page.route` handlers
	 * that must be in place when the app fetches its settings.
	 * Runs in every test (smoke, visual, and interaction).
	 */
	beforeGoto?: (page: Page) => Promise<void>;
	/**
	 * Additional URL query parameters such as modelStateId or g (theme).
	 * These are appended to the test URL after the branch rewrite.
	 */
	params?: Record<string, string>;
	/**
	 * Per-example interaction steps executed after the model has fully loaded.
	 * When defined, an interaction test is generated in addition to the smoke
	 * and visual tests. When undefined, only smoke + visual tests run.
	 * Ignored when `namedActions` is set.
	 * @param page - Playwright Page
	 * @param slug - Use it to name snapshots: `${slug}-state-name`
	 */
	actions?: (page: Page, slug: string) => Promise<void>;
	/**
	 * Isolated interaction cases for this slug. Each entry is its own
	 * Playwright test (`interaction: <name>`). Prefer this over `actions`
	 * when cases need a fresh page (viewport sizes, independent asserts).
	 */
	namedActions?: ScenarioNamedAction[];
	/**
	 * Also run the interaction tests in the quick suite on deploys. Without
	 * it they run only in the full suite (nightly and on release). Smoke +
	 * visual of every slug run in the quick suite regardless.
	 */
	quickSuite?: boolean;
}

/** Fields needed to open a scenario URL (smoke/visual or a dedicated API spec). */
export type ScenarioOpenConfig = Pick<
	ScenarioActionConfig,
	"slug" | "params" | "setup"
>;

export interface ScenarioApiActionConfig extends ScenarioOpenConfig {
	actions: ScenarioNamedAction[];
}

export const scenarioActions: ScenarioActionConfig[] = [
	...interactionExampleScenarios,
	{
		// The "Floor Plan" file parameter must be set before the model can load,
		// so it belongs in `setup` rather than `actions`.
		slug: "appbuilder-tutorial2-contextualui",
		quickSuite: true,
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
		quickSuite: true,
		actions: async (page, slug) => {
			await waitForModelRecomputed(page, async () => {
				await getParameterElement(page, "Upload Your Image")
					.locator('input[type="file"]')
					.setInputFiles(path.resolve("tests/config/files/logo.png"));
			});
			await takeSnapshot(page, `${slug}-after-upload`);
		},
	},

	{
		// Slider parameter: the slider has no accessible label, so we target
		// the companion number textbox (TEXT INPUT PARAMETER pattern).
		slug: "appbuilder-tutorial4-charts",
		quickSuite: true,
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
		quickSuite: true,
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
		quickSuite: true,
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
		quickSuite: true,
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
		quickSuite: true,
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
		quickSuite: true,
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
		quickSuite: true,
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
		quickSuite: true,
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
		quickSuite: true,
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
		quickSuite: true,
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
		quickSuite: true,
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
		// The select trigger is exposed as a combobox, and the dropdown portal
		// renders outside the parameter container, so options must be queried
		// on `page`, not on the container.
		slug: "beta-dynamicvalueliststutorial",
		quickSuite: true,
		actions: async (page, slug) => {
			const input = getParameterElement(page, "FoodType").getByRole(
				"combobox",
			);
			await waitForModelRecomputed(page, async () => {
				await input.click();
				await page.getByRole("option", {name: "Vegetables"}).click();
			});
			await takeSnapshot(page, `${slug}-vegetables`);
		},
	},

	{
		// MULTILINE TEXT INPUT PARAMETER pattern.
		// Tab-blur triggers the Mantine onChange and the Grasshopper recompute.
		slug: "beta-multilinetextinput",
		quickSuite: true,
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
		quickSuite: true,
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
		quickSuite: true,
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
		quickSuite: true,
		actions: async (page, slug) => {
			const button = page.getByRole("button", {name: "Set Camera"});
			await button.click();

			await expect(button).toBeDisabled();
			await takeSnapshot(page, `${slug}-animating`);

			await expect(button).toBeEnabled();
			await takeSnapshot(page, `${slug}-done`);
		},
	},

	{
		// The app has three unlabeled tabs; Playwright indices are zero-based.
		slug: "7a-attributevisualization-3-2",
		quickSuite: true,
		actions: async (page, slug) => {
			// open the attributes tab (fourth tab in this model)
			const fourthTab = page.getByRole("tab").nth(3);
			await fourthTab.click();
			await expect(fourthTab).toHaveAttribute("aria-selected", "true");
			// the default attribute of the model is applied shortly after the
			// tab opens: wait for it, the snapshot shows the visualized attribute
			await expect(
				page.getByPlaceholder("Select an attribute"),
			).not.toHaveValue("");

			await takeSnapshot(page, `${slug}-attributes-visible`);

			// click on one of the attributes
			const pos = await viewportCoords(page, 0.872, 0.545);
			await page.mouse.click(pos.x, pos.y);
			await takeSnapshot(page, `${slug}-attribute-clicked`);
		},
	},
	{
		slug: "textinput-resetvalue-3",
		actions: textInputResetValueActions,
	},
	{
		slug: "selectioninput-resetvalue-6",
		// Plain selection colors: the pulsing default effect never gives two
		// equal screenshots in a row.
		params: {g: "example-simple-interaction-colors.json"},
		actions: selectionInputResetValueActions,
	},
	{
		slug: "selectioninput-resetvalue-dynamic-3",
		params: {g: "example-simple-interaction-colors.json"},
		actions: selectionInputResetValueActions,
	},

	{
		// Modular cabinets (testing account). The "Edit Cabinets" selection is
		// driven by reset values: adding a cabinet via the "+" of the "Add
		// Cabinets" selection selects the new cabinet (reset value defined by the
		// overrides of the reference), changing a dimension keeps the selection
		// (the model stops sending the reset value), and adding another cabinet
		// selects the new one again.
		slug: "modularcabinets-test",
		quickSuite: true,
		// Settings file (served from public/) replacing the pulsing interaction
		// effects by plain colors, so that the snapshots are deterministic.
		params: {g: "example-simple-interaction-colors.json"},
		actions: async (page, slug) => {
			// Coordinates refer to the 1280x720 viewport of the "Desktop Chrome"
			// device used by the test project.
			// right "+" of the initial cabinet: the new cabinet gets selected
			let pos = await viewportCoords(page, 0.591, 0.464);
			await waitForModelRecomputed(page, async () => {
				await page.mouse.click(pos.x, pos.y);
			});
			await takeSnapshot(page, `${slug}-added`);

			// change the height of the selected cabinet: it stays selected
			await waitForModelRecomputed(page, async () => {
				const height = getParameterElement(page, "Height").getByRole(
					"textbox",
				);
				await height.fill("600");
				await height.press("Enter");
			});
			await takeSnapshot(page, `${slug}-height`);

			// right "+" of the selected cabinet: the third cabinet gets selected
			pos = await viewportCoords(page, 0.613, 0.169);
			await waitForModelRecomputed(page, async () => {
				await page.mouse.click(pos.x, pos.y);
			});
			await takeSnapshot(page, `${slug}-added-second`);
		},
	},
	{
		// Self-contained settings JSON (`g`); session is in the file, so the
		// spec must not also pass `?slug=` (that would create a second session).
		slug: "example-executeActions",
		quickSuite: true,
		params: {g: "example-executeActions.json"},
		actions: async (page, slug) => {
			const toolbar = page.getByLabel("execute-actions-toolbar");
			const buttons = toolbar.getByRole("button");
			const clickToolbar = async (oneBasedIndex: number) => {
				const button = buttons.nth(oneBasedIndex - 1);
				await waitForModelRecomputed(page, async () => {
					await button.click();
					await expect(button).toBeEnabled();
				});
				await takeSnapshot(page, `${slug}-toolbar-${oneBasedIndex}`);
			};

			await clickToolbar(2);
			await clickToolbar(1);
			await clickToolbar(3);
			await clickToolbar(4);
		},
	},
	{
		// Self-contained settings JSON (`g`); session is in the file, so the
		// spec must not also pass `?slug=` (that would create a second session).
		slug: "example-actionSlots-selection",
		params: {g: "example-actionSlots-selection.json"},
		actions: actionSlotsSelectionActions,
	},
	{
		// Self-contained settings JSON (`g`); session is in the file, so the
		// spec must not also pass `?slug=` (that would create a second session).
		slug: "example-actionSlots",
		params: {g: "example-actionSlots.json"},
		actions: actionSlotsActions,
	},
	{
		slug: "selection-parameter-variations",
		quickSuite: true,
		// Settings file (served from public/) replacing the pulsing interaction
		// effects by plain colors, so that the snapshots are deterministic.
		params: {g: "example-simple-interaction-colors.json"},
		actions: async (page, slug) => {
			// Coordinates refer to the 1280x720 viewport of the "Desktop Chrome"
			// device used by the test project. Window rows from top to bottom:
			// Floor_3 (y 0.181), Floor_1 (y 0.560), Floor_0 (y 0.751).
			const toolbar = page.getByLabel("Interaction toolbar");
			const menuButton = toolbar.getByRole("button", {
				name: "Selection",
				exact: true,
			});
			const confirmButton = toolbar.getByRole("button", {
				name: "Confirm",
			});
			const menu = page.locator(".mantine-Popover-dropdown", {
				hasText: /Selection \(/,
			});
			// Activates a selection parameter via the "Selection" menu of the
			// interaction toolbar. While a selection is active, the menu can only
			// be closed by clicking the canvas.
			const activateSelection = async (name: string) => {
				await menuButton.click();
				await menu.getByText(new RegExp(`^${name}`)).click();
				const canvas = await viewportCoords(page, 0.521, 0.417);
				await page.mouse.click(canvas.x, canvas.y);
				await menu.waitFor({state: "hidden"});
			};

			// Confirm/Cancel are not offered while no selection is being edited
			await expect(confirmButton).toHaveCount(0);

			// always-active "Window Selection" (max 1): the click is committed
			// immediately
			let pos = await viewportCoords(page, 0.395, 0.181);
			await waitForModelRecomputed(page, async () => {
				await page.mouse.click(pos.x, pos.y);
			});
			await takeSnapshot(page, `${slug}-window`);

			// "Ground Floor Selection" (min 2, max 4) via the toolbar menu: two
			// windows, confirmed explicitly
			await activateSelection("Ground Floor Selection");
			await expect(confirmButton).toBeDisabled();
			pos = await viewportCoords(page, 0.395, 0.751);
			await page.mouse.click(pos.x, pos.y);
			pos = await viewportCoords(page, 0.603, 0.751);
			await page.mouse.click(pos.x, pos.y);
			await expect(confirmButton).toBeEnabled();
			await waitForModelRecomputed(page, async () => {
				await confirmButton.click();
			});
			// the selection is deactivated after the confirmation
			await expect(confirmButton).toHaveCount(0);
			await takeSnapshot(page, `${slug}-ground-floor`);

			// "First Floor Selection" (min 1, max 1) via the toolbar menu: the
			// click is committed immediately
			await activateSelection("First Floor Selection");
			pos = await viewportCoords(page, 0.395, 0.56);
			await waitForModelRecomputed(page, async () => {
				await page.mouse.click(pos.x, pos.y);
			});
			await takeSnapshot(page, `${slug}-first-floor`);
		},
	},
	{
		// Self-contained settings JSON (`g`); session is in the file, so the
		// spec must not also pass `?slug=` (that would create a second session).
		slug: "example-mobileFallback",
		params: {g: "example-mobileFallback.json"},
		namedActions: exampleMobileFallbackNamedActions,
	},
	{
		// Same remapping as example-mobileFallback; Grid has no burger.
		slug: "example-mobileFallback-grid",
		params: {g: "example-mobileFallback-grid.json"},
		namedActions: exampleMobileFallbackGridNamedActions,
	},
	{
		slug: "example-mobileFallback-tabs",
		params: {g: "example-mobileFallback-tabs.json"},
		namedActions: exampleMobileFallbackTabsNamedActions,
	},
	{
		slug: "example-mobileFallback-anchors",
		params: {g: "example-mobileFallback-anchors.json"},
		namedActions: exampleMobileFallbackAnchorsNamedActions,
	},
	{
		slug: "example-mobileFallback-keepBottom",
		params: {g: "example-mobileFallback-keepBottom.json"},
		namedActions: exampleMobileFallbackKeepBottomNamedActions,
	},
	{
		// Self-contained settings JSON (`g`); session is in the file, so the
		// spec must not also pass `?slug=` (that would create a second session).
		// Database-backed selects over fake CSV/JSON databases from public/,
		// plus one `source` parameter on the built-in dummy scrolling API.
		// Root-relative database hrefs are resolved against the branch deploy.
		slug: "example-filterableDatabase-selects",
		params: {g: "example-filterableDatabase-selects.json"},
		beforeGoto: (page) =>
			routeSettingsHrefsToAppBase(
				page,
				"example-filterableDatabase-selects.json",
			),
		namedActions: scenarioFilterableDatabaseNamedActions,
	},
	{
		// Same model, plain-items select widgets (no database, no scrolling
		// API): display names, colors, tooltips, hidden items, commits.
		slug: "example-select-widgets",
		params: {g: "example-select-widgets.json"},
		namedActions: scenarioSelectWidgetsNamedActions,
	},
	{
		// Same model, SS-10264: a database behind every select type, no
		// filters, itemData patches over database rows.
		slug: "example-filterableDatabase-all-types",
		params: {g: "example-filterableDatabase-all-types.json"},
		beforeGoto: (page) =>
			routeSettingsHrefsToAppBase(
				page,
				"example-filterableDatabase-all-types.json",
			),
		namedActions: scenarioFilterableDatabaseAllTypesNamedActions,
	},
	{
		// String parameters as selects; Grasshopper sends the select
		// settings (echoes the "Settings" parameter into TextInput overrides).
		slug: "stringselect-10",
		namedActions: scenarioStringSelectNamedActions,
	},
];

/** Fast lookup by slug */
export const scenarioActionById = new Map<string, ScenarioActionConfig>(
	scenarioActions.map((c) => [c.slug, c]),
);
