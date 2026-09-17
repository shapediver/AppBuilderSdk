/**
 * Drive the App Builder Tools API from Playwright through the localhost
 * CrossWindow parent (`ToolsApiFactory.getClientApi(iframe.contentWindow)`).
 */
import {expect, Page} from "@playwright/test";
import type {CrossWindowParentWindow} from "./crossWindowParent";
import {waitForModelRecomputed} from "./waitForModelRecomputed";

export type ToolsApiListedTool = {
	name: string;
	description: string;
};

export type ToolsApiExecuteResult = Record<string, unknown>;

export async function toolsListTools(
	page: Page,
): Promise<ToolsApiListedTool[]> {
	return page.evaluate(async () => {
		const api = (window as unknown as CrossWindowParentWindow).__toolsApi;
		if (!api) {
			throw new Error(
				"Tools API client is not registered on the parent.",
			);
		}
		const reply = await api.listTools();
		return reply.tools.map((tool) => ({
			name: tool.name,
			description: tool.description,
		}));
	});
}

export async function toolsGetAgentConfig(page: Page) {
	return page.evaluate(async () => {
		const api = (window as unknown as CrossWindowParentWindow).__toolsApi;
		if (!api) {
			throw new Error(
				"Tools API client is not registered on the parent.",
			);
		}
		return api.getAgentConfig();
	});
}

export async function toolsGetSessionInfo(page: Page) {
	return page.evaluate(async () => {
		const api = (window as unknown as CrossWindowParentWindow).__toolsApi;
		if (!api) {
			throw new Error(
				"Tools API client is not registered on the parent.",
			);
		}
		return api.getSessionInfo();
	});
}

export async function toolsExecute(
	page: Page,
	name: string,
	input: unknown = {},
): Promise<ToolsApiExecuteResult> {
	const result = await page.evaluate(
		async ({name, input}) => {
			const api = (window as unknown as CrossWindowParentWindow)
				.__toolsApi;
			if (!api) {
				throw new Error(
					"Tools API client is not registered on the parent.",
				);
			}
			const reply = await api.execute({name, input});
			if (name === "get_screenshot") {
				const shot = reply as {
					success?: boolean;
					image_url?: string;
					message?: string;
				};
				return {
					success: !!shot.success,
					hasImage:
						typeof shot.image_url === "string" &&
						shot.image_url.startsWith("data:"),
					mime: shot.image_url?.startsWith("data:")
						? shot.image_url.slice(5, shot.image_url.indexOf(";"))
						: undefined,
					message: shot.message,
				};
			}
			return reply;
		},
		{name, input},
	);
	expect(
		result,
		`Tools API execute("${name}") returned nothing`,
	).toBeTruthy();
	return result as ToolsApiExecuteResult;
}

export async function toolsExecuteAndRecompute(
	page: Page,
	name: string,
	input: unknown = {},
): Promise<ToolsApiExecuteResult> {
	let reply: ToolsApiExecuteResult | undefined;
	await waitForModelRecomputed(page, async () => {
		reply = await toolsExecute(page, name, input);
	});
	return reply!;
}
