/**
 * Tools API e2e (SS-10025).
 *
 * Playwright loads App Builder in the localhost CrossWindow iframe (port 3000,
 * same parent as e-commerce), stubs Open agent to return `window.parent`, and
 * owns `ToolsApiFactory.getClientApi(iframe.contentWindow)`. ask_user_question
 * is out of scope.
 */
import {expect} from "@playwright/test";
import {TOOLS_E2E_AGENT} from "../helpers/openToolsApiScenario";
import {takeSnapshot} from "../helpers/takeSnapshot";
import {
	toolsExecute,
	toolsExecuteAndRecompute,
	toolsGetAgentConfig,
	toolsGetSessionInfo,
	toolsListTools,
} from "../helpers/toolsApi";
import type {ScenarioApiActionConfig} from "./scenarioActions";

export const scenarioToolsApi: ScenarioApiActionConfig = {
	slug: "example-toolsApi",
	params: {g: "example-executeActions.json"},
	actions: [
		{
			name: "listTools includes in-scope tools and excludes ask_user_question",
			run: async (page) => {
				const listed = await toolsListTools(page);
				const names = listed.map((tool) => tool.name);
				expect(names).toEqual(
					expect.arrayContaining([
						"list_parameter_definitions",
						"get_parameter_values",
						"set_parameter_values",
						"list_action_controls",
						"trigger_action_control",
						"set_camera_position",
						"get_screenshot",
						"get_metric",
					]),
				);
				expect(names).not.toContain("ask_user_question");
				const screenshot = listed.find(
					(tool) => tool.name === "get_screenshot",
				);
				expect(screenshot?.description).toMatch(/image_url/);
				expect(screenshot?.description).not.toMatch(
					/success:\s*true,\s*image\s*[},]/i,
				);
			},
		},
		{
			name: "getAgentConfig matches the injected agent and getSessionInfo returns an object",
			run: async (page) => {
				expect(await toolsGetAgentConfig(page)).toEqual({
					id: TOOLS_E2E_AGENT.id,
					name: TOOLS_E2E_AGENT.name,
					message: TOOLS_E2E_AGENT.message,
				});
				expect(await toolsGetSessionInfo(page)).toEqual(
					expect.any(Object),
				);
			},
		},
		{
			name: "execute unknown tool fails",
			run: async (page) => {
				const missingTool = await toolsExecute(page, "not_a_tool", {});
				expect(missingTool).toEqual({
					success: false,
					message: 'Tool "not_a_tool" does not exist.',
				});
			},
		},
		{
			name: "list_parameter_definitions includes Length",
			run: async (page) => {
				const definitions = await toolsExecute(
					page,
					"list_parameter_definitions",
					{},
				);
				const parameters = definitions.parameters as {
					name?: string;
					displayname?: string;
				}[];
				expect(
					parameters.some(
						(parameter) =>
							parameter.name === "Length" ||
							parameter.displayname === "Length",
					),
				).toBe(true);
			},
		},
		{
			name: "get_parameter_values returns all values and Length by name",
			run: async (page) => {
				const allValues = await toolsExecute(
					page,
					"get_parameter_values",
					{},
				);
				expect((allValues.values as unknown[]).length).toBeGreaterThan(
					0,
				);

				const before = await toolsExecute(
					page,
					"get_parameter_values",
					{names: ["Length"]},
				);
				expect(
					(before.values as {currentValue?: unknown}[]).length,
				).toBe(1);
			},
		},
		{
			name: "set_parameter_values Length",
			run: async (page, slug) => {
				const before = await toolsExecute(
					page,
					"get_parameter_values",
					{names: ["Length"]},
				);
				const currentLength = (
					before.values as {currentValue?: unknown}[]
				)[0]?.currentValue;
				const nextLength = Number(currentLength) === 4 ? 5 : 4;
				const setValues = await toolsExecuteAndRecompute(
					page,
					"set_parameter_values",
					{updates: [{name: "Length", value: nextLength}]},
				);
				expect(setValues.errors).toEqual([]);
				expect((setValues.applied as string[]).length).toBe(1);
				await takeSnapshot(page, `${slug}-length`);
			},
		},
		{
			name: "list_action_controls includes Sequential and Parallel",
			run: async (page) => {
				const actions = await toolsExecute(
					page,
					"list_action_controls",
					{},
				);
				const actionNames = (
					actions.actions as {id?: string; name?: string}[]
				).map((action) => action.name ?? action.id);
				expect(actionNames).toEqual(
					expect.arrayContaining(["Sequential", "Parallel"]),
				);
			},
		},
		{
			name: "trigger_action_control missing fails and Sequential succeeds",
			run: async (page, slug) => {
				const missingAction = await toolsExecute(
					page,
					"trigger_action_control",
					{name: "__missing_action__"},
				);
				expect(missingAction.success).toBe(false);

				const triggered = await toolsExecuteAndRecompute(
					page,
					"trigger_action_control",
					{name: "Sequential"},
				);
				expect(triggered.success).toBe(true);
				await takeSnapshot(page, `${slug}-sequential`);
			},
		},
		{
			name: "set_camera_position requires target then applies",
			run: async (page, slug) => {
				const incompleteCamera = await toolsExecute(
					page,
					"set_camera_position",
					{
						position: {x: 0, y: 0, z: 5},
					},
				);
				expect(incompleteCamera.success).toBe(false);

				const camera = await toolsExecute(page, "set_camera_position", {
					position: {x: 0, y: -8, z: 4},
					target: {x: 0, y: 0, z: 1},
				});
				expect(camera.success).toBe(true);
				await takeSnapshot(page, `${slug}-camera`);
			},
		},
		{
			name: "get_screenshot default, jpeg options, and rejects unknown input",
			run: async (page) => {
				const screenshot = await toolsExecute(
					page,
					"get_screenshot",
					{},
				);
				expect(screenshot.success).toBe(true);
				expect(screenshot.hasImage).toBe(true);
				expect(screenshot.mime).toBe("image/png");

				const jpeg = await toolsExecute(page, "get_screenshot", {
					contentType: "image/jpeg",
					quality: 0.8,
					resolution: {width: 320, height: 180},
				});
				expect(jpeg.success).toBe(true);
				expect(jpeg.hasImage).toBe(true);
				expect(jpeg.mime).toBe("image/jpeg");

				const webp = await toolsExecute(page, "get_screenshot", {
					contentType: "image/webp",
				});
				expect(webp.success).toBe(false);

				const withCamera = await toolsExecute(page, "get_screenshot", {
					camera: {name: "Front"},
				});
				expect(withCamera.success).toBe(false);
			},
		},
		{
			name: "get_metric is not found without AgentMetric",
			run: async (page) => {
				const metric = await toolsExecute(page, "get_metric", {});
				expect(metric.found).toBe(false);
			},
		},
	],
};
