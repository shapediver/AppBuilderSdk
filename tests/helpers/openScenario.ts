import {Page} from "@playwright/test";
import {TEST_BRANCH} from "../../playwright.config";
import type {ScenarioOpenConfig} from "../config/scenarioActions";
import {applyUrlParams, rewriteToTestBranch} from "./resolveTargetUrl";
import {waitForAppReady} from "./waitForAppReady";

const DEFAULT_APP_URL = "https://appbuilder.shapediver.com/v1/main/latest/";

/** Rewritten test URL for a scenario (settings `g` or `slug`). */
export function scenarioTestUrl(config: ScenarioOpenConfig): string {
	const settingsFile = config.params?.g;
	const base = settingsFile
		? `${DEFAULT_APP_URL}?g=${encodeURIComponent(settingsFile)}`
		: `${DEFAULT_APP_URL}?slug=${encodeURIComponent(config.slug)}`;
	return applyUrlParams(
		rewriteToTestBranch(base, TEST_BRANCH),
		config.params,
	);
}

/** Navigate to the scenario URL and wait until the App Builder canvas is idle. */
export async function openScenario(
	page: Page,
	config: ScenarioOpenConfig,
): Promise<void> {
	await page.goto(scenarioTestUrl(config), {waitUntil: "domcontentloaded"});
	await waitForAppReady(page, {interstitial: config.setup});
}
