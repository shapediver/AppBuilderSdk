import {expect, Page} from "@playwright/test";
import {AGENT_WINDOW_NAME} from "../../src/shared/features/agent-tools/lib/openAgentWindow";
import type {ScenarioOpenConfig} from "../config/scenarioActions";
import {
	openCrossWindowParent,
	sdvTarget,
	type CrossWindowParentWindow,
} from "./crossWindowParent";
import {waitForAppReady} from "./waitForAppReady";

/** Injected via settings `agentOverride` so Open agent appears. Not SDK source. */
export const TOOLS_E2E_AGENT = {
	id: "e2e-tools",
	name: "E2E Tools",
	message: "Playwright Tools API",
	specificTools: [
		{
			name: "set_length",
			description: "Set the Length parameter",
			inputSchema: {
				type: "object",
				properties: {length: {type: "number"}},
				required: ["length"],
				additionalProperties: false,
			},
			actionSequence: [
				{
					type: "setParameterValue",
					props: {
						parameter: {name: "Length"},
						source: {
							type: "agentTool",
							props: {path: "length"},
						},
					},
				},
			],
		},
	],
} as const;

/**
 * Open App Builder in the localhost CrossWindow iframe (same host:3000 parent
 * as e-commerce). Stub `window.open` so Open agent uses `window.parent` as the
 * Tools peer — deployed App Builder sends COOP `same-origin`, so a popup to
 * localhost would have `window.opener === null`.
 */
export async function openToolsApiScenario(
	page: Page,
	config: ScenarioOpenConfig,
): Promise<void> {
	const settingsFile = config.params?.g;
	if (!settingsFile) {
		throw new Error("openToolsApiScenario requires config.params.g");
	}

	await page.addInitScript(
		({windowName}) => {
			const originalOpen = window.open.bind(window);
			window.open = (url, target, features) => {
				if (target === windowName && window.parent !== window) {
					return window.parent;
				}
				return originalOpen(url, target, features);
			};
		},
		{windowName: AGENT_WINDOW_NAME},
	);

	const frame = await openCrossWindowParent(page, config, {
		searchParams: {api: "tools"},
		beforeGoto: async (page) => {
			await page.route(`**/${settingsFile}`, async (route) => {
				const response = await route.fetch();
				const json = (await response.json()) as Record<string, unknown>;
				await route.fulfill({
					response,
					json: {
						...json,
						agentOverride: [TOOLS_E2E_AGENT],
					},
				});
			});
		},
	});
	await waitForAppReady(frame);

	const openAgent = sdvTarget(page).getByRole("button", {name: "Open agent"});
	await expect(openAgent).toBeEnabled({timeout: 90_000});
	await openAgent.click();

	await page.evaluate(async () => {
		const parent = window as unknown as CrossWindowParentWindow;
		try {
			if (!parent.__startToolsApi) {
				throw new Error("Tools parent did not expose __startToolsApi.");
			}
			await parent.__startToolsApi();
		} catch (error: unknown) {
			parent.__agentError = String(
				error instanceof Error ? error.message : error,
			);
		}
	});
	await page.waitForFunction(
		() => {
			const parent = window as unknown as CrossWindowParentWindow;
			return parent.__agentReady === true || !!parent.__agentError;
		},
		undefined,
		{timeout: 90_000},
	);
	const agentError = await page.evaluate(
		() => (window as unknown as CrossWindowParentWindow).__agentError,
	);
	expect(agentError, `Tools agent parent failed: ${agentError}`).toBeNull();
}
