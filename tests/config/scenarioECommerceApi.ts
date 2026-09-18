/**
 * E-commerce connector e2e (SS-10025).
 *
 * Playwright loads App Builder in an iframe under a parent that owns
 * `ECommerceApiFactory.getConnectorApi` (same pattern as AppBuilderCrossWindowApi).
 *
 * Covers IECommerceApiConnectorActions. Does not cover IECommerceApiActions
 * (addItemToCart, getUserProfile, closeConfigurator, …) — those stay on the
 * parent plugin. triggerAction addToCart is omitted: Dummy addItemToCart
 * rejects after creating a model state.
 */
import {expect} from "@playwright/test";
import {
	eCommerceCreateModelState,
	eCommerceGetOutput,
	eCommerceImportModelStateAndRecompute,
	eCommerceTriggerAction,
	eCommerceTriggerActionAndRecompute,
	eCommerceUpdateParameterValuesAndRecompute,
	expectNoAppNotifications,
	findSdvOutput,
	findSdvParameter,
} from "../helpers/eCommerceApi";
import {takeSnapshot} from "../helpers/takeSnapshot";
import type {ScenarioApiActionConfig} from "./scenarioActions";

export const scenarioECommerceApi: ScenarioApiActionConfig = {
	slug: "example-ecommerceApi",
	params: {g: "example-executeActions.json"},
	actions: [
		{
			name: "getOutput reports missing and found outputs",
			run: async (page) => {
				const missing = await eCommerceGetOutput(page, {
					output: "__missing_output__",
				});
				expect(missing.found).toBe(false);
				expect(missing.hasContent).toBe(false);

				const output = await findSdvOutput(page);
				const found = await eCommerceGetOutput(page, {
					output: output.name || output.id,
				});
				expect(found.found).toBe(true);
				expect(found.hasContent).toBe(true);
			},
		},
		{
			name: "triggerAction camera set without target fails",
			run: async (page) => {
				await expect(
					eCommerceTriggerAction(page, {
						type: "camera",
						props: {
							type: "set",
							props: {position: [0, 0, 5]},
						},
					}),
				).rejects.toThrow(/Invalid data for triggerAction/);
			},
		},
		{
			name: "triggerAction fullscreen is rejected as invalid",
			run: async (page) => {
				await expect(
					eCommerceTriggerAction(page, {
						type: "fullscreen",
						props: {},
					}),
				).rejects.toThrow(/Invalid data for triggerAction/);
			},
		},
		{
			name: "updateParameterValues, undo, and redo Length",
			run: async (page, slug) => {
				const length = await findSdvParameter(page, "Length");
				const nextLength = String(length.value) === "4" ? "5" : "4";
				await eCommerceUpdateParameterValuesAndRecompute(page, {
					state: {
						[length.namespace]: {[length.id]: nextLength},
					},
				});
				expect(
					String((await findSdvParameter(page, "Length")).value),
				).toBe(nextLength);
				await takeSnapshot(page, `${slug}-length`);

				const undone = await eCommerceTriggerActionAndRecompute(page, {
					type: "undo",
				});
				expect(undone.success).toBe(true);
				expect(
					String((await findSdvParameter(page, "Length")).value),
				).toBe(String(length.value));

				const redone = await eCommerceTriggerActionAndRecompute(page, {
					type: "redo",
				});
				expect(redone.success).toBe(true);
				expect(
					String((await findSdvParameter(page, "Length")).value),
				).toBe(nextLength);
				await expectNoAppNotifications(page);
			},
		},
		{
			name: "triggerAction setParameterValues unknown parameter fails",
			run: async (page) => {
				const unknown = await eCommerceTriggerAction(page, {
					type: "setParameterValues",
					props: {
						parameterValues: [
							{
								parameter: {name: "__missing_parameter__"},
								value: "1",
							},
						],
					},
				});
				expect(unknown.success).toBe(false);
				expect(unknown.message).toMatch(/not found/i);
			},
		},
		{
			name: "triggerAction setParameterValues Material Color",
			run: async (page) => {
				const color = await findSdvParameter(page, "Material Color");
				const setValues = await eCommerceTriggerActionAndRecompute(
					page,
					{
						type: "setParameterValues",
						props: {
							parameterValues: [
								{
									parameter: {name: "Material Color"},
									value: "0x2288ccff",
								},
							],
						},
					},
				);
				expect(setValues.success).toBe(true);
				expect(
					String(
						(await findSdvParameter(page, "Material Color")).value,
					),
				).not.toBe(String(color.value));
				await expectNoAppNotifications(page);
			},
		},
		{
			name: "triggerAction resetParameterValues restores Length",
			run: async (page) => {
				const length = await findSdvParameter(page, "Length");
				const nextLength = String(length.value) === "4" ? "5" : "4";
				await eCommerceUpdateParameterValuesAndRecompute(page, {
					state: {
						[length.namespace]: {[length.id]: nextLength},
					},
				});

				const reset = await eCommerceTriggerActionAndRecompute(page, {
					type: "resetParameterValues",
				});
				expect(reset.success).toBe(true);
				expect(
					String((await findSdvParameter(page, "Length")).value),
				).toBe(String(length.value));
				await expectNoAppNotifications(page);
			},
		},
		{
			name: "triggerAction camera assign Front",
			run: async (page, slug) => {
				const front = await eCommerceTriggerAction(page, {
					type: "camera",
					props: {
						type: "assign",
						props: {camera: {name: "Front"}},
					},
				});
				expect(front.success).toBe(true);
				await takeSnapshot(page, `${slug}-front`);
			},
		},
		{
			name: "triggerAction executeActions sequential Hide Door and zoomTo",
			run: async (page, slug) => {
				const hideDoor = await eCommerceTriggerActionAndRecompute(
					page,
					{
						type: "executeActions",
						props: {
							mode: "sequential",
							actions: [
								{
									type: "setParameterValue",
									props: {
										parameter: {name: "Hide Door"},
										value: "true",
									},
								},
								{
									type: "camera",
									props: {type: "zoomTo", props: {}},
								},
							],
						},
					},
				);
				expect(hideDoor.success).toBe(true);
				await takeSnapshot(page, `${slug}-hide-door`);
				await expectNoAppNotifications(page);
			},
		},
		{
			name: "create and import model state via connector and triggerAction",
			run: async (page, slug) => {
				const length = await findSdvParameter(page, "Length");
				const nextLength = String(length.value) === "4" ? "5" : "4";
				await eCommerceUpdateParameterValuesAndRecompute(page, {
					state: {
						[length.namespace]: {[length.id]: nextLength},
					},
				});

				const created = await eCommerceCreateModelState(page, {
					includeImage: false,
					includeGltf: false,
				});
				expect(created.modelStateId).toBeTruthy();

				const viaTrigger = await eCommerceTriggerAction(page, {
					type: "createModelState",
					props: {includeImage: false, includeGltf: false},
				});
				expect(viaTrigger.success).toBe(true);

				const cleared = await eCommerceTriggerActionAndRecompute(page, {
					type: "resetParameterValues",
				});
				expect(cleared.success).toBe(true);
				expect(
					String((await findSdvParameter(page, "Length")).value),
				).toBe(String(length.value));

				const imported = await eCommerceImportModelStateAndRecompute(
					page,
					{modelStateId: created.modelStateId!},
				);
				expect(imported.success).toBe(true);
				expect(
					String((await findSdvParameter(page, "Length")).value),
				).toBe(nextLength);

				const clearedAgain = await eCommerceTriggerActionAndRecompute(
					page,
					{type: "resetParameterValues"},
				);
				expect(clearedAgain.success).toBe(true);

				const importedAgain = await eCommerceTriggerActionAndRecompute(
					page,
					{
						type: "importModelState",
						props: {modelStateId: created.modelStateId},
					},
				);
				expect(importedAgain.success).toBe(true);
				expect(
					String((await findSdvParameter(page, "Length")).value),
				).toBe(nextLength);
				await takeSnapshot(page, `${slug}-imported`);
				await expectNoAppNotifications(page);
			},
		},
		{
			name: "triggerAction sound with empty href succeeds",
			run: async (page) => {
				const sound = await eCommerceTriggerAction(page, {
					type: "sound",
					props: {href: ""},
				});
				expect(sound.success).toBe(true);
				await expectNoAppNotifications(page);
			},
		},
	],
};
