import {Page} from "@playwright/test";
import * as path from "path";

export interface TestConfig {
	slug: string;
	/**
	 * Human-readable label used in test names.
	 */
	label: string;
	/**
	 * Optional pre-load setup steps executed after navigation but BEFORE
	 * waitForModelLoaded. Use this for anything the model needs to start
	 * loading at all — e.g. uploading a required input file.
	 * Runs in every test (smoke, visual, and interaction).
	 */
	setup?: (page: Page) => Promise<void>;
	/**
	 * Per-example interaction steps executed after the model has fully loaded.
	 * When defined, an interaction test is generated in addition to the smoke test.
	 * Call waitForModelLoaded again after any action that triggers a new computation.
	 * When undefined, only the smoke test (page loads, canvas visible, no JS errors) runs.
	 */
	actions?: (page: Page) => Promise<void>;
}

/**
 * Per-slug interaction definitions.
 *
 * Slugs not listed here automatically get a smoke-only test.
 * Add entries here when you want to assert specific behaviour beyond "it loads".
 *
 * Guidelines:
 *  - Use page.getByRole / page.getByLabel for UI controls (resilient to DOM changes).
 *  - After any action that triggers a compute, call waitForModelLoaded(page) again.
 *  - Keep interactions minimal — one meaningful user action per example is enough.
 */
export const testConfigs: TestConfig[] = [
	// ── 11-AppBuilder ────────────────────────────────────────────────────────

	{slug: "appbuilder-tutorial1-simpleexample", label: "11A – Simple example"},
	{
		slug: "appbuilder-tutorial2-contextualui",
		label: "11B – Contextual UI",
		setup: async (page) => {
			// The "Floor Plan" parameter requires a file before the model can load.
			// Mantine FileInput renders a hidden <input type="file"> inside the
			// styled button — setInputFiles targets it directly without opening a
			// native file dialog, which is simpler and avoids filechooser timing issues.
			await page
				.locator('input[type="file"]')
				.setInputFiles(
					path.join(
						__dirname,
						"../fixtures/files/11B-AppBuilder_Tutorial2_ExampleInpute.3dm",
					),
				);
		},
	},
	{slug: "appbuilder-tutorial3-imagewidget", label: "11C – Image widget"},
	{slug: "appbuilder-tutorial4-charts", label: "11D – Charts"},
	{
		slug: "11e-parameterandexportcontrols",
		label: "11E – Parameter & Export Controls",
	},
	{slug: "11f-actioncontrol", label: "11F – Action Control"},
	{
		slug: "11g-accordionandstackwidgets",
		label: "11G – Accordion & Stack Widgets",
	},

	// ── Interaction inputs ────────────────────────────────────────────────────

	{slug: "2d-selectioninput-tutorial1", label: "2D – Selection Input basic"},
	{
		slug: "2e-selectioninput-tutorial2",
		label: "2E – Selection Input advanced",
	},
	{slug: "2f-minimalgumballexample", label: "2F – Gumball Input basic"},
	{slug: "2g-gumballinput-tutorial1", label: "2G – Gumball Input tutorial"},
	{slug: "2h-gumballinput-tutorial2-3", label: "2H – Gumball Input advanced"},
	{slug: "2i-pointsinputsimpleexample", label: "2I – Points Input basic"},
	{
		slug: "2j-pointsinputgeometryconstraints",
		label: "2J – Points Input constraints",
	},

	// ── BETA ─────────────────────────────────────────────────────────────────

	{slug: "beta-dynamicsliderstutorial", label: "BETA – Dynamic Sliders"},
	{
		slug: "beta-dynamicvalueliststutorial",
		label: "BETA – Dynamic Value Lists",
	},
	{slug: "250829-stepexample", label: "BETA – Slider with custom step"},
	{slug: "beta-searchablevaluelist-1", label: "BETA – Searchable value list"},
	{slug: "beta-multilinetextinput", label: "BETA – Multiline text input"},
	{
		slug: "beta-instancestutorial1-controller",
		label: "BETA – Instance controller",
	},
	{slug: "beta-anchor3d", label: "BETA – Anchor 3D"},
	{slug: "beta-anchor2d", label: "BETA – Anchor 2D"},
	{slug: "beta-soundaction", label: "BETA – Sound action"},
	{slug: "beta-exportwithstate", label: "BETA – Export with state"},
	{slug: "beta-exportwithscreenshot", label: "BETA – Export with screenshot"},
	{slug: "beta-formwidget", label: "BETA – Form widget"},
	{
		slug: "beta-sliderswithmarksandlabels",
		label: "BETA – Sliders with marks",
	},
	{slug: "beta-cameraaction", label: "BETA – Camera action"},
	{slug: "beta-savedstateswidget", label: "BETA – Saved States Widget"},
];

/** Fast lookup by slug */
export const testConfigBySlug = new Map<string, TestConfig>(
	testConfigs.map((c) => [c.slug, c]),
);
