/**
 * Drive the App Builder e-commerce connector from Playwright through the
 * real CrossWindow parent (same pattern as AppBuilderCrossWindowApi).
 *
 * The parent page owns `ECommerceApiFactory.getConnectorApi`; App Builder
 * runs in an iframe named `app`.
 */
import {expect, Page} from "@playwright/test";
import {sdvTarget, type CrossWindowParentWindow} from "./crossWindowParent";
import {waitForModelRecomputed} from "./waitForModelRecomputed";

export type ECommerceTriggerActionData = {
	type: string;
	props?: unknown;
};

export type ECommerceTriggerActionReply = {
	success: boolean;
	message?: string;
};

export type ECommerceGetOutputReply = {
	found: boolean;
	message?: string;
	hasContent: boolean;
};

export type ECommerceCreateModelStateResult = {
	modelStateId?: string;
	modelViewUrl?: string;
};

export type ECommerceImportModelStateResult =
	| {success: true}
	| {success: false; message: string};

export type SdvParameterRef = {
	namespace: string;
	id: string;
	name: string;
	displayname?: string;
	value: unknown;
};

export type SdvOutputRef = {
	namespace: string;
	id: string;
	name: string;
	displayname?: string;
};

type ConnectorMethod =
	| "updateParameterValues"
	| "createModelState"
	| "importModelState"
	| "triggerAction"
	| "getOutput";

async function callECommerceConnector<T>(
	page: Page,
	method: ConnectorMethod,
	data?: unknown,
): Promise<T> {
	return page.evaluate(
		async ({method, data}) => {
			const connector = (window as unknown as CrossWindowParentWindow)
				.__connector;
			if (!connector || typeof connector[method] !== "function") {
				throw new Error(
					`E-commerce connector method "${method}" is not registered.`,
				);
			}
			const result = await connector[method](data);
			if (method === "getOutput") {
				const reply = result as {
					found?: boolean;
					message?: string;
					content?: unknown;
				};
				return {
					found: !!reply.found,
					message: reply.message,
					hasContent: reply.content != null,
				} as T;
			}
			if (method === "createModelState") {
				const reply = result as {
					modelStateId?: string;
					modelViewUrl?: string;
				};
				return {
					modelStateId: reply.modelStateId,
					modelViewUrl: reply.modelViewUrl,
				} as T;
			}
			if (method === "importModelState") {
				const reply = result as {
					success?: boolean;
					message?: string;
				};
				return (
					reply.success
						? {success: true}
						: {
								success: false,
								message: reply.message ?? "Import failed.",
							}
				) as T;
			}
			return result as T;
		},
		{method, data},
	);
}

export async function eCommerceTriggerAction(
	page: Page,
	data: ECommerceTriggerActionData,
): Promise<ECommerceTriggerActionReply> {
	return callECommerceConnector<ECommerceTriggerActionReply>(
		page,
		"triggerAction",
		data,
	);
}

export async function eCommerceTriggerActionAndRecompute(
	page: Page,
	data: ECommerceTriggerActionData,
): Promise<ECommerceTriggerActionReply> {
	let reply: ECommerceTriggerActionReply | undefined;
	await waitForModelRecomputed(page, async () => {
		reply = await eCommerceTriggerAction(page, data);
	});
	return reply!;
}

export async function eCommerceUpdateParameterValues(
	page: Page,
	data: {
		state: Record<string, Record<string, string | number | boolean>>;
		skipHistory?: boolean;
		skipUrlUpdate?: boolean;
	},
): Promise<void> {
	await callECommerceConnector(page, "updateParameterValues", data);
}

export async function eCommerceUpdateParameterValuesAndRecompute(
	page: Page,
	data: {
		state: Record<string, Record<string, string | number | boolean>>;
		skipHistory?: boolean;
		skipUrlUpdate?: boolean;
	},
): Promise<void> {
	await waitForModelRecomputed(page, async () => {
		await eCommerceUpdateParameterValues(page, data);
	});
}

export async function eCommerceCreateModelState(
	page: Page,
	data: Record<string, unknown> = {},
): Promise<ECommerceCreateModelStateResult> {
	return callECommerceConnector<ECommerceCreateModelStateResult>(
		page,
		"createModelState",
		data,
	);
}

export async function eCommerceImportModelState(
	page: Page,
	data: {modelStateId: string},
): Promise<ECommerceImportModelStateResult> {
	return callECommerceConnector<ECommerceImportModelStateResult>(
		page,
		"importModelState",
		data,
	);
}

export async function eCommerceImportModelStateAndRecompute(
	page: Page,
	data: {modelStateId: string},
): Promise<ECommerceImportModelStateResult> {
	let reply: ECommerceImportModelStateResult | undefined;
	await waitForModelRecomputed(page, async () => {
		reply = await eCommerceImportModelState(page, data);
	});
	return reply!;
}

export async function eCommerceGetOutput(
	page: Page,
	data: {output: string; namespace?: string},
): Promise<ECommerceGetOutputReply> {
	return callECommerceConnector<ECommerceGetOutputReply>(
		page,
		"getOutput",
		data,
	);
}

type SdvSessionLike = {
	parameters?: Record<
		string,
		{id?: string; name?: string; displayname?: string; value?: unknown}
	>;
	outputs?: Record<
		string,
		{id?: string; name?: string; displayname?: string}
	>;
};

export async function findSdvParameter(
	page: Page,
	name: string,
): Promise<SdvParameterRef> {
	const found = await sdvTarget(page).evaluate((parameterName) => {
		const sessions = ((
			window as {SDV?: {sessions?: Record<string, SdvSessionLike>}}
		).SDV?.sessions ?? {}) as Record<string, SdvSessionLike>;
		for (const [namespace, session] of Object.entries(sessions)) {
			for (const parameter of Object.values(session.parameters ?? {})) {
				if (
					parameter.name === parameterName ||
					parameter.displayname === parameterName
				) {
					return {
						namespace,
						id: parameter.id ?? "",
						name: parameter.name ?? parameterName,
						displayname: parameter.displayname,
						value: parameter.value,
					};
				}
			}
		}
		return null;
	}, name);
	expect(found, `SDV parameter "${name}" not found`).not.toBeNull();
	return found!;
}

export async function findSdvOutput(
	page: Page,
	name?: string,
): Promise<SdvOutputRef> {
	const found = await sdvTarget(page).evaluate((outputName) => {
		const sessions = ((
			window as {SDV?: {sessions?: Record<string, SdvSessionLike>}}
		).SDV?.sessions ?? {}) as Record<string, SdvSessionLike>;
		for (const [namespace, session] of Object.entries(sessions)) {
			for (const output of Object.values(session.outputs ?? {})) {
				if (
					!outputName ||
					output.name === outputName ||
					output.displayname === outputName ||
					output.id === outputName
				) {
					return {
						namespace,
						id: output.id ?? "",
						name: output.name ?? output.id ?? "",
						displayname: output.displayname,
					};
				}
			}
		}
		return null;
	}, name);
	expect(
		found,
		name
			? `SDV output "${name}" not found`
			: "No SDV outputs on the session",
	).not.toBeNull();
	return found!;
}

/** API paths must not toast (create/reset/addToCart). */
export async function expectNoAppNotifications(page: Page): Promise<void> {
	await expect(
		sdvTarget(page).locator(".mantine-Notification-root"),
	).toHaveCount(0);
}
