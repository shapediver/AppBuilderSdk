import {expect, Frame, Page} from "@playwright/test";
import type {ScenarioOpenConfig} from "../config/scenarioActions";
import {scenarioTestUrl} from "./openScenario";
import {waitForAppReady} from "./waitForAppReady";

export const CROSS_WINDOW_PARENT_ORIGIN = "http://127.0.0.1:3000";
export const CROSS_WINDOW_IFRAME_NAME = "app";

export type CrossWindowParentWindow = {
	__parentReady?: boolean;
	__parentError?: string | null;
	__agentReady?: boolean;
	__agentError?: string | null;
	__startToolsApi?: () => Promise<void>;
	__connector?: {
		triggerAction: (data: unknown) => Promise<unknown>;
		updateParameterValues: (data: unknown) => Promise<unknown>;
		createModelState: (data: unknown) => Promise<unknown>;
		importModelState: (data: unknown) => Promise<unknown>;
		getOutput: (data: unknown) => Promise<unknown>;
	};
	__toolsApi?: {
		listTools: () => Promise<{
			tools: {
				name: string;
				description: string;
				inputSchema?: unknown;
			}[];
		}>;
		execute: (data: {name: string; input: unknown}) => Promise<unknown>;
		getAgentConfig: () => Promise<unknown>;
		getSessionInfo: () => Promise<unknown>;
	};
};

/** App Builder frame inside the CrossWindow parent, or `page` when not iframed. */
export function sdvTarget(page: Page): Page | Frame {
	return page.frame({name: CROSS_WINDOW_IFRAME_NAME}) ?? page;
}

/** Let App Builder load in a localhost iframe (strip XFO / CSP frame-ancestors). */
export async function installCrossWindowDocumentHeaders(
	page: Page,
): Promise<void> {
	await page.route("**/*", async (route) => {
		if (route.request().resourceType() !== "document") {
			// fallback, not continue: continue() skips earlier page.route handlers
			// (settings agentOverride, etc.) and goes straight to the network.
			await route.fallback();
			return;
		}
		const response = await route.fetch();
		const headers = {...response.headers()};
		delete headers["x-frame-options"];
		for (const key of [
			"content-security-policy",
			"content-security-policy-report-only",
		] as const) {
			if (headers[key]) {
				headers[key] = headers[key].replace(
					/frame-ancestors[^;]*;?/gi,
					"",
				);
			}
		}
		await route.fulfill({response, headers});
	});
}

/**
 * Open the localhost CrossWindow parent with App Builder in iframe `name="app"`.
 * Waits until the parent finished iframe load (and e-commerce handshake when
 * `api` is not `tools`). Does not wait for the canvas.
 */
export async function openCrossWindowParent(
	page: Page,
	config: ScenarioOpenConfig,
	options: {
		searchParams?: Record<string, string>;
		/** Runs after the document-header route so more specific routes win. */
		beforeGoto?: (page: Page) => Promise<void>;
	} = {},
): Promise<Frame> {
	const appUrl = new URL(scenarioTestUrl(config));

	const parentUrl = new URL(CROSS_WINDOW_PARENT_ORIGIN + "/");
	parentUrl.searchParams.set("app", appUrl.toString());
	for (const [name, value] of Object.entries(options.searchParams ?? {})) {
		parentUrl.searchParams.set(name, value);
	}

	await installCrossWindowDocumentHeaders(page);
	await options.beforeGoto?.(page);

	await page.goto(parentUrl.toString(), {waitUntil: "domcontentloaded"});
	await page.waitForFunction(
		() => {
			const parent = window as unknown as CrossWindowParentWindow;
			return parent.__parentReady === true || !!parent.__parentError;
		},
		undefined,
		{timeout: 90_000},
	);
	const parentError = await page.evaluate(
		() => (window as unknown as CrossWindowParentWindow).__parentError,
	);
	expect(parentError, `CrossWindow parent failed: ${parentError}`).toBeNull();

	const frame = page.frame({name: CROSS_WINDOW_IFRAME_NAME});
	expect(frame, "App Builder iframe is missing").toBeTruthy();
	return frame!;
}

/**
 * Open App Builder in an iframe under a parent that speaks the real
 * e-commerce CrossWindow API.
 */
export async function openCrossWindowScenario(
	page: Page,
	config: ScenarioOpenConfig,
): Promise<void> {
	const frame = await openCrossWindowParent(page, config);
	await waitForAppReady(frame);
}
