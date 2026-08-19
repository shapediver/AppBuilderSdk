# SS-9974 Step 1 Agent Generic Tools (WebMCP) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Register App Builder generic agent tools from `IAppBuilder.agents[0]` (or defaults) as transport-agnostic handlers, expose them via WebMCP, and drop `create_model_state` / `import_model_state`.

**Architecture:** New `features/agent-tools` slice: `config/` is pure Zod + `resolveToolset` (importable later by AppBuilderAgent); `model/` is browser handlers. `features/webmcp` only registers. No LangChain in Shared. `ToolsApi` is out of this plan.

**Tech Stack:** TypeScript strict, Zod 4, React 19, Zustand 4, Jest 29, WebMCP `modelContext.registerTool`, `@shapediver/viewer.viewport`.

**Spec:** `docs/superpowers/specs/2026-08-19-ss-9974-step1-agent-tools-webmcp-design.md`

## Global Constraints

- Implement in AppBuilderShared (`src/shared`), branch from **`task/SS-9973`** (agent schema PR). Do not confuse that branch name with SS-9974.
- Parent App Builder: branch `task/SS-9974-agent-tools-webmcp` from `development`; bump submodule pointer after Shared commits.
- Do not change AppBuilderAgent / Next.js in this plan.
- `config/*` must not import React, viewer, WebMCP, or `window`. No barrel that re-exports `model` from `config`.
- Do not register `ask_user_question` or `specificTools`.
- Handlers never throw into WebMCP; always return JSON per spec error table.
- WebMCP is beta: breaking `list_parameter_definitions` input (`filter` / `sessionId`) is required.
- `useWebMcpTools` currently runs **above** `AppBuilderDataContext.Provider` in `AppBuilderPage`. Pass `appBuilderData` as a prop; do not `useContext` for agents in that hook.
- Commits in Shared: `SS-9974: {description}`. Do not commit unless the user asks, except when executing this plan with the user having already approved execution.
- Do not fix unrelated lint. Tests live next to code under `__tests__/`.
- Jest from parent repo root: `pnpm test -- <file-or-name>`.

---

## File Map

**Create (AppBuilderShared)**

- `features/agent-tools/config/inScopeGenericTools.ts` — names, default settings, descriptions
- `features/agent-tools/config/resolveToolset.ts` — `resolveToolset(agent?)`
- `features/agent-tools/config/listParameterDefinitions.ts` — empty strict input + output (moved/changed)
- `features/agent-tools/config/getParameterValues.ts`
- `features/agent-tools/config/setParameterValues.ts` — moved
- `features/agent-tools/config/listActionControls.ts`
- `features/agent-tools/config/triggerActionControl.ts`
- `features/agent-tools/config/setCameraPosition.ts`
- `features/agent-tools/config/getScreenshot.ts`
- `features/agent-tools/config/getMetric.ts`
- `features/agent-tools/lib/formatToolInputError.ts` — moved helper
- `features/agent-tools/lib/parameterDefinitionMapper.ts` — moved
- `features/agent-tools/lib/findParameterByName.ts` — moved
- `features/agent-tools/lib/resolveSetParameterUpdates.ts` — moved
- `features/agent-tools/lib/filterParametersForAgent.ts`
- `features/agent-tools/lib/collectUiParameterRefs.ts`
- `features/agent-tools/lib/collectActionControls.ts`
- `features/agent-tools/model/agentToolsDeps.ts`
- `features/agent-tools/model/handlers/*.ts` — one file per tool
- `features/agent-tools/model/runActionControl.ts`
- `features/agent-tools/model/useAgentToolHandlers.ts`
- `features/agent-tools/__tests__/resolveToolset.test.ts`
- `features/agent-tools/__tests__/filterParametersForAgent.test.ts`
- `features/agent-tools/__tests__/handlers/*.test.ts`

**Modify**

- `features/appbuilder/config/appbuilderagent.ts` — add `GetParameterValuesToolSettings` to `GenericToolSettings`
- `features/webmcp/model/useWebMcpTools.ts` — snapshot + register resolved tools
- `features/webmcp/model/useWebMcpTools.types.ts` — `appBuilderData` prop
- `pages/appbuilder/AppBuilderPage.tsx` — pass `appBuilderData`
- `features/webmcp/evals/evals.json` + `runWebmcpEvalScenarios.ts` — drop create/import; list `{}`

**Create**

- `features/webmcp/model/registerResolvedTools.ts`

**Delete**

- `features/webmcp/model/tools/registerCreateModelStateTool.ts`
- `features/webmcp/model/tools/registerImportModelStateTool.ts`
- `features/webmcp/model/tools/registerListParameterDefinitionsTool.ts` (logic moves)
- `features/webmcp/model/tools/registerSetParameterValuesTool.ts` (logic moves)
- `features/webmcp/config/createModelState.ts`, `importModelState.ts`
- `features/webmcp/config/listParameterDefinitions.ts`, `setParameterValues.ts` after move
- `features/webmcp/config/tools.ts` names that die with create/import (keep file only if still used, otherwise fold into agent-tools)

---

### Task 1: Branch + `GenericToolSettings` union

**Files:**
- Modify: `src/shared/features/appbuilder/config/appbuilderagent.ts` (`GenericToolSettings` union ~line 181)
- Create: `src/shared/features/agent-tools/config/inScopeGenericTools.ts`

**Interfaces:**
- Consumes: `GenericToolName`, existing `*ToolSettings` types in `appbuilderagent.ts`
- Produces: `GetParameterValuesToolSettings` in `GenericToolSettings`; `IN_SCOPE_GENERIC_TOOL_NAMES`; `InScopeGenericToolName`; `defaultSettingsFor(name)`

- [ ] **Step 1: Create Shared branch from SS-9973**

```bash
cd src/shared
git checkout task/SS-9973
git pull
git checkout -b task/SS-9974-agent-tools-webmcp
cd ../..
git checkout -b task/SS-9974-agent-tools-webmcp
```

Expected: Shared HEAD is SS-9973 (has `appbuilderagent.ts`). Parent is a new SS-9974 branch.

- [ ] **Step 2: Add `GetParameterValuesToolSettings` to the union**

In `src/shared/features/appbuilder/config/appbuilderagent.ts` replace `GenericToolSettings` with:

```ts
export type GenericToolSettings =
	| ListParameterDefinitionsToolSettings
	| GetParameterValuesToolSettings
	| SetParameterValuesToolSettings
	| ListActionControlsToolSettings
	| TriggerActionControlToolSettings
	| SetCameraPositionToolSettings
	| GetScreenshotToolSettings
	| AskUserQuestionToolSettings
	| GetMetricToolSettings;
```

- [ ] **Step 3: Add in-scope names + default settings (pure config)**

Create `src/shared/features/agent-tools/config/inScopeGenericTools.ts`:

```ts
import type {
	GenericToolName,
	GenericToolSettings,
	GetMetricToolSettings,
	GetParameterValuesToolSettings,
	GetScreenshotToolSettings,
	ListActionControlsToolSettings,
	ListParameterDefinitionsToolSettings,
	SetCameraPositionToolSettings,
	SetParameterValuesToolSettings,
	TriggerActionControlToolSettings,
} from "@AppBuilderLib/features/appbuilder/config/appbuilderagent";

export const IN_SCOPE_GENERIC_TOOL_NAMES = [
	"list_parameter_definitions",
	"get_parameter_values",
	"set_parameter_values",
	"list_action_controls",
	"trigger_action_control",
	"set_camera_position",
	"get_screenshot",
	"get_metric",
] as const;

export type InScopeGenericToolName =
	(typeof IN_SCOPE_GENERIC_TOOL_NAMES)[number];

export function isInScopeGenericToolName(
	name: string,
): name is InScopeGenericToolName {
	return (IN_SCOPE_GENERIC_TOOL_NAMES as readonly string[]).includes(name);
}

export const ASK_USER_QUESTION_TOOL_NAME: GenericToolName = "ask_user_question";

export function defaultSettingsFor(
	name: InScopeGenericToolName,
): GenericToolSettings {
	switch (name) {
		case "list_parameter_definitions":
			return {name} satisfies ListParameterDefinitionsToolSettings;
		case "get_parameter_values":
			return {name} satisfies GetParameterValuesToolSettings;
		case "set_parameter_values":
			return {name} satisfies SetParameterValuesToolSettings;
		case "list_action_controls":
			return {name} satisfies ListActionControlsToolSettings;
		case "trigger_action_control":
			return {name} satisfies TriggerActionControlToolSettings;
		case "set_camera_position":
			return {name} satisfies SetCameraPositionToolSettings;
		case "get_screenshot":
			return {name} satisfies GetScreenshotToolSettings;
		case "get_metric":
			return {name} satisfies GetMetricToolSettings;
	}
}
```

- [ ] **Step 4: Typecheck the union change**

Run: `pnpm exec tsc --noEmit --pretty false`
Expected: no error in `appbuilderagent.ts` / `inScopeGenericTools.ts`

- [ ] **Step 5: Commit (Shared)**

```bash
cd src/shared
git add features/appbuilder/config/appbuilderagent.ts features/agent-tools/config/inScopeGenericTools.ts
git commit -m "SS-9974: Include get_parameter_values in GenericToolSettings"
```

---

### Task 2: `resolveToolset`

**Files:**
- Create: `src/shared/features/agent-tools/config/resolveToolset.ts`
- Test: `src/shared/features/agent-tools/__tests__/resolveToolset.test.ts`

**Interfaces:**
- Consumes: `IAppBuilderAgent`, `GenericToolSettings`, `defaultSettingsFor`, `isInScopeGenericToolName`, `IN_SCOPE_GENERIC_TOOL_NAMES`
- Produces:

```ts
export type ResolvedGenericTool = {
	name: InScopeGenericToolName;
	settings: GenericToolSettings;
};

export function resolveToolset(
	agent: IAppBuilderAgent | undefined,
): ResolvedGenericTool[];
```

- [ ] **Step 1: Write failing tests**

Create `src/shared/features/agent-tools/__tests__/resolveToolset.test.ts`:

```ts
import type {IAppBuilderAgent} from "../../appbuilder/config/appbuilderagent";
import {IN_SCOPE_GENERIC_TOOL_NAMES} from "../config/inScopeGenericTools";
import {resolveToolset} from "../config/resolveToolset";

describe("resolveToolset", () => {
	it("returns all in-scope generic tools when agent is undefined", () => {
		const names = resolveToolset(undefined).map((t) => t.name);
		expect(names).toEqual([...IN_SCOPE_GENERIC_TOOL_NAMES]);
		expect(names).not.toContain("ask_user_question");
	});

	it("ignores specificTools", () => {
		const agent: IAppBuilderAgent = {
			id: "a",
			name: "A",
			message: "hi",
			specificTools: [
				{name: "custom_tool", inputSchema: {type: "object"}},
			],
		};
		expect(resolveToolset(agent).map((t) => t.name)).not.toContain(
			"custom_tool",
		);
	});

	it("useGenericToolDefaults false keeps only listed generic tools", () => {
		const agent: IAppBuilderAgent = {
			id: "a",
			name: "A",
			message: "hi",
			useGenericToolDefaults: false,
			genericTools: [{name: "get_screenshot"}],
		};
		expect(resolveToolset(agent).map((t) => t.name)).toEqual([
			"get_screenshot",
		]);
	});

	it("overlays genericTools settings when defaults are on", () => {
		const agent: IAppBuilderAgent = {
			id: "a",
			name: "A",
			message: "hi",
			genericTools: [
				{
					name: "list_parameter_definitions",
					filter: {hidden: "include"},
				},
			],
		};
		const list = resolveToolset(agent).find(
			(t) => t.name === "list_parameter_definitions",
		);
		expect(list?.settings).toMatchObject({
			name: "list_parameter_definitions",
			filter: {hidden: "include"},
		});
		expect(resolveToolset(agent)).toHaveLength(
			IN_SCOPE_GENERIC_TOOL_NAMES.length,
		);
	});

	it("drops ask_user_question even if listed", () => {
		const agent: IAppBuilderAgent = {
			id: "a",
			name: "A",
			message: "hi",
			useGenericToolDefaults: false,
			genericTools: [
				{name: "ask_user_question"},
				{name: "get_metric"},
			],
		};
		expect(resolveToolset(agent).map((t) => t.name)).toEqual(["get_metric"]);
	});
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm test -- resolveToolset.test.ts`
Expected: FAIL (module not found)

- [ ] **Step 3: Implement `resolveToolset`**

Create `src/shared/features/agent-tools/config/resolveToolset.ts`:

```ts
import type {
	GenericToolSettings,
	IAppBuilderAgent,
} from "@AppBuilderLib/features/appbuilder/config/appbuilderagent";
import {
	defaultSettingsFor,
	IN_SCOPE_GENERIC_TOOL_NAMES,
	isInScopeGenericToolName,
	type InScopeGenericToolName,
} from "./inScopeGenericTools";

export type ResolvedGenericTool = {
	name: InScopeGenericToolName;
	settings: GenericToolSettings;
};

function overlayByName(
	listed: GenericToolSettings[] | undefined,
): Map<string, GenericToolSettings> {
	const map = new Map<string, GenericToolSettings>();
	for (const tool of listed ?? []) {
		map.set(tool.name, tool);
	}
	return map;
}

export function resolveToolset(
	agent: IAppBuilderAgent | undefined,
): ResolvedGenericTool[] {
	const listed = overlayByName(agent?.genericTools);

	if (agent && agent.useGenericToolDefaults === false) {
		const resolved: ResolvedGenericTool[] = [];
		for (const tool of agent.genericTools ?? []) {
			if (!isInScopeGenericToolName(tool.name)) continue;
			resolved.push({name: tool.name, settings: tool});
		}
		return resolved;
	}

	return IN_SCOPE_GENERIC_TOOL_NAMES.map((name) => {
		const overlay = listed.get(name);
		return {
			name,
			settings: overlay ?? defaultSettingsFor(name),
		};
	});
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm test -- resolveToolset.test.ts`
Expected: PASS

- [ ] **Step 5: Commit (Shared)**

```bash
cd src/shared
git add features/agent-tools/config/resolveToolset.ts features/agent-tools/__tests__/resolveToolset.test.ts
git commit -m "SS-9974: Resolve generic toolset from IAppBuilderAgent"
```

---

### Task 3: Move parameter schemas; empty `list_parameter_definitions` input

**Files:**
- Create: `src/shared/features/agent-tools/config/listParameterDefinitions.ts`
- Create: `src/shared/features/agent-tools/config/setParameterValues.ts`
- Create: `src/shared/features/agent-tools/lib/formatToolInputError.ts` (copy from `features/webmcp/lib/formatToolInputError.ts`)
- Create: `src/shared/features/agent-tools/lib/findParameterByName.ts` (copy)
- Create: `src/shared/features/agent-tools/lib/parameterDefinitionMapper.ts` (copy; fix imports to new config path)
- Create: `src/shared/features/agent-tools/lib/resolveSetParameterUpdates.ts` (copy; fix imports)
- Create: `src/shared/features/agent-tools/__tests__/listParameterDefinitions.schema.test.ts`
- Move tests from `features/webmcp/__tests__/parameterDefinitionMapper.test.ts` and `setParameterValues.feedback.test.ts` (update imports)
- Delete old webmcp copies after imports retargeted (do deletes in Task 11 if anything still imports them until then). For this task: **new files + new tests**. Leave old files until WebMCP is rewired so the tree still compiles.

**Interfaces:**
- Produces:

```ts
export const listParameterDefinitionsInputSchema = z.strictObject({});
export const listParameterDefinitionsOutputSchema = z.object({
	parameters: z.array(ListParameterDefinitionItemSchema),
	errors: z.array(nameMessageSchema).optional(),
});
```

Keep `ListParameterDefinitionItemSchema`, `parameterValueSchema`, `SUPPORTED_PARAMETER_TYPES` from current `features/webmcp/config/listParameterDefinitions.ts` (copy as-is except drop `filter` and `sessionId` from input).

`setParameterValuesInputSchema` — copy unchanged from `features/webmcp/config/setParameterValues.ts`, but import `parameterValueSchema` from `../config/listParameterDefinitions`.

- [ ] **Step 1: Write schema tests for empty list input**

```ts
import {listParameterDefinitionsInputSchema} from "../config/listParameterDefinitions";

describe("listParameterDefinitionsInputSchema", () => {
	it("accepts empty object", () => {
		expect(listParameterDefinitionsInputSchema.parse({})).toEqual({});
	});

	it("rejects filter and sessionId", () => {
		expect(() =>
			listParameterDefinitionsInputSchema.parse({filter: "all"}),
		).toThrow();
		expect(() =>
			listParameterDefinitionsInputSchema.parse({sessionId: "s"}),
		).toThrow();
	});
});
```

- [ ] **Step 2: Run test — expect FAIL**

Run: `pnpm test -- listParameterDefinitions.schema.test.ts`
Expected: FAIL module not found

- [ ] **Step 3: Copy schemas and libs**

1. Copy `listParameterDefinitions.ts` to `features/agent-tools/config/listParameterDefinitions.ts`.
2. Replace `listParameterDefinitionsInputSchema` with `z.strictObject({})`. Keep output schema and `SUPPORTED_PARAMETER_TYPES`.
3. Copy `setParameterValues.ts` to `features/agent-tools/config/setParameterValues.ts`; import `parameterValueSchema` from `./listParameterDefinitions`.
4. Copy `formatToolInputError.ts`, `findParameterByName.ts`, `parameterDefinitionMapper.ts`, `resolveSetParameterUpdates.ts` into `features/agent-tools/lib/`. Point mapper/set-update imports at `@AppBuilderLib/features/agent-tools/config/...`.
5. Copy `stringListValue.ts` if mapper imports it (`features/webmcp/lib/stringListValue.ts`) into `features/agent-tools/lib/stringListValue.ts`.

- [ ] **Step 4: Port mapper + set-value tests**

Copy `features/webmcp/__tests__/parameterDefinitionMapper.test.ts` → `features/agent-tools/__tests__/parameterDefinitionMapper.test.ts` and `setParameterValues.feedback.test.ts` → `features/agent-tools/__tests__/setParameterValues.feedback.test.ts`. Change imports from `../lib/...` / `../config/...` to agent-tools paths. Keep assertions.

- [ ] **Step 5: Run tests**

Run: `pnpm test -- listParameterDefinitions.schema.test.ts parameterDefinitionMapper.test.ts setParameterValues.feedback.test.ts`
Expected: PASS (both old webmcp copies and new ones may run; that is OK until Task 11)

- [ ] **Step 6: Commit (Shared)**

```bash
cd src/shared
git add features/agent-tools
git commit -m "SS-9974: Move parameter tool schemas into agent-tools"
```

---

### Task 4: Parameter filter (`hidden` / `invisible` / `sessionIds` / explicit list)

**Files:**
- Create: `src/shared/features/agent-tools/lib/collectUiParameterRefs.ts`
- Create: `src/shared/features/agent-tools/lib/filterParametersForAgent.ts`
- Test: `src/shared/features/agent-tools/__tests__/filterParametersForAgent.test.ts`

**Interfaces:**
- Consumes: `IAppBuilder`, `IAppBuilderAgent` list-parameter settings, `IShapeDiverParameter`
- Produces:

```ts
export type UiParameterRef = {name: string; sessionId?: string};

export function collectUiParameterRefs(appBuilder: IAppBuilder): UiParameterRef[];

export function filterParametersForAgent(args: {
	parameters: IShapeDiverParameter<unknown>[];
	controllerNamespace: string;
	settings: ListParameterDefinitionsToolSettings;
	uiRefs: UiParameterRef[];
}): IShapeDiverParameter<unknown>[];
```

Walk `appBuilder.containers` (and nested tabs/widgets/toolbars): accordion `parameters`, controls `type === "parameter"`, form `parameters`. A parameter is **UI-visible** if some ref matches id/name/displayname **and** sessionId (missing sessionId on ref = controller namespace).

Filter rules (from `ListParameterDefinitionsToolSettings`):

- If `settings.parameters` is provided, resolve those refs only (ignore `filter`).
- Else:
  - `sessionIds` omitted → only `controllerNamespace`
  - `hidden` default `"exclude"` → drop `definition.hidden === true` when exclude
  - `invisible` default `"include"` → when `"exclude"`, drop params not in `uiRefs`

- [ ] **Step 1: Write failing tests** (minimal fixtures: one hidden param, one not in UI, two sessions)

```ts
import type {IShapeDiverParameter} from "@AppBuilderLib/entities/parameter/config/parameter";
import {ResParameterType} from "@shapediver/sdk.geometry-api-sdk-v2";
import {filterParametersForAgent} from "../lib/filterParametersForAgent";

function param(
	id: string,
	opts: {hidden?: boolean; namespace?: string} = {},
): IShapeDiverParameter<unknown> {
	return {
		definition: {
			id,
			name: id,
			type: ResParameterType.FLOAT,
			hidden: opts.hidden ?? false,
		},
		state: {uiValue: 1},
		actions: {},
		acceptRejectMode: false,
	} as unknown as IShapeDiverParameter<unknown>;
}

describe("filterParametersForAgent", () => {
	const settings = {name: "list_parameter_definitions" as const};

	it("excludes hidden by default", () => {
		const result = filterParametersForAgent({
			parameters: [param("a"), param("b", {hidden: true})],
			controllerNamespace: "c",
			settings,
			uiRefs: [{name: "a"}, {name: "b"}],
		});
		expect(result.map((p) => p.definition.id)).toEqual(["a"]);
	});

	it("excludes invisible when filter.invisible is exclude", () => {
		const result = filterParametersForAgent({
			parameters: [param("a"), param("b")],
			controllerNamespace: "c",
			settings: {
				name: "list_parameter_definitions",
				filter: {invisible: "exclude"},
			},
			uiRefs: [{name: "a"}],
		});
		expect(result.map((p) => p.definition.id)).toEqual(["a"]);
	});

	it("explicit parameters list wins over filter", () => {
		const result = filterParametersForAgent({
			parameters: [param("a"), param("b", {hidden: true})],
			controllerNamespace: "c",
			settings: {
				name: "list_parameter_definitions",
				parameters: [{name: "b"}],
				filter: {hidden: "exclude"},
			},
			uiRefs: [],
		});
		expect(result.map((p) => p.definition.id)).toEqual(["b"]);
	});

	it("returns empty array without error when nothing matches", () => {
		const result = filterParametersForAgent({
			parameters: [param("a")],
			controllerNamespace: "c",
			settings: {
				name: "list_parameter_definitions",
				parameters: [{name: "missing"}],
			},
			uiRefs: [],
		});
		expect(result).toEqual([]);
	});
});
```

- [ ] **Step 2: Run — expect FAIL**

Run: `pnpm test -- filterParametersForAgent.test.ts`

- [ ] **Step 3: Implement `collectUiParameterRefs` + `filterParametersForAgent`**

`collectUiParameterRefs`: recurse containers → widgets. For each accordion/form, push `parameters`. For each controls/form control with `type === "parameter"`, push `props.name` + `props.sessionId`. For toolbar items with `type === "parameter"`, same. Nested stack/tabs/widgets: recurse `widgets` / `tabs`.

`filterParametersForAgent`: implement the rules above. Matching a ref uses id, name, displayname (same order as `findParameterByName`). `sessionId` on a ref must match the parameter's namespace; when building the live list, the caller concatenates params tagged with namespace (see handler in Task 5: pass a parallel namespace or stamp it).

To avoid inventing a namespace field on `IShapeDiverParameter`, **caller** already filters by session before calling, OR pass `parameters` as `{namespace, parameter}[]`:

```ts
export type NamespacedParameter = {
	namespace: string;
	parameter: IShapeDiverParameter<unknown>;
};

export function filterParametersForAgent(args: {
	parameters: NamespacedParameter[];
	controllerNamespace: string;
	settings: ListParameterDefinitionsToolSettings;
	uiRefs: UiParameterRef[];
}): NamespacedParameter[];
```

Use this `NamespacedParameter` shape in the test (adjust Step 1 fixtures to wrap `{namespace: "c", parameter: param(...)}`).

- [ ] **Step 4: Run tests — expect PASS**

- [ ] **Step 5: Commit (Shared)**

```bash
cd src/shared
git add features/agent-tools/lib/collectUiParameterRefs.ts features/agent-tools/lib/filterParametersForAgent.ts features/agent-tools/__tests__/filterParametersForAgent.test.ts
git commit -m "SS-9974: Filter parameters from agent settings"
```

---

### Task 5: `list_parameter_definitions` + `get_parameter_values` handlers

**Files:**
- Create: `src/shared/features/agent-tools/config/getParameterValues.ts`
- Create: `src/shared/features/agent-tools/model/agentToolsDeps.ts`
- Create: `src/shared/features/agent-tools/model/handlers/listParameterDefinitions.ts`
- Create: `src/shared/features/agent-tools/model/handlers/getParameterValues.ts`
- Test: `src/shared/features/agent-tools/__tests__/handlers/listAndGetParameter.test.ts`

**Interfaces:**
- Produces:

```ts
export type AgentToolsDeps = {
	controllerNamespace: string;
	getLiveParameters: (namespace: string) => IShapeDiverParameter<unknown>[];
	listSessionNamespaces: () => string[];
	getAppBuilder: () => IAppBuilder | undefined;
	batchParameterValueUpdate: IShapeDiverStoreParameters["batchParameterValueUpdate"];
	// later tasks add viewport / actions / outputs
};

export async function handleListParameterDefinitions(
	input: unknown,
	settings: ListParameterDefinitionsToolSettings,
	deps: AgentToolsDeps,
): Promise<{parameters: ListParameterDefinitionItem[]; errors?: {name: string; message: string}[]}>;

export async function handleGetParameterValues(
	input: unknown,
	settings: ListParameterDefinitionsToolSettings,
	deps: AgentToolsDeps,
): Promise<{values: {id: string; name: string; currentValue: unknown}[]; errors?: {name: string; message: string}[]}>;
```

`get_parameter_values` **reuses list-parameter settings** from the same resolved toolset (the `list_parameter_definitions` settings entry). If that tool is not in the set, use `defaultSettingsFor("list_parameter_definitions")`.

`getParameterValues` input:

```ts
export const getParameterValuesInputSchema = z.strictObject({
	names: z.array(z.string()).optional(),
});
```

Omit `names` → same filtered set as list. Provided `names` → intersect with that set; unknown name → `errors` entry, other values still returned.

- [ ] **Step 1: Write failing handler tests** using a fake `AgentToolsDeps` (in-memory params; `getAppBuilder: () => ({version: "1.0", containers: []})`).

Cover: extra key on list input → `errors[{name:"*"}]`; list uses agent hidden filter not input; get without names returns currentValue; get with unknown name adds error.

- [ ] **Step 2: Run — expect FAIL**

- [ ] **Step 3: Implement schemas + handlers**

List handler:

```ts
export async function handleListParameterDefinitions(input, settings, deps) {
	try {
		listParameterDefinitionsInputSchema.parse(input ?? {});
		const appBuilder = deps.getAppBuilder();
		const uiRefs = appBuilder ? collectUiParameterRefs(appBuilder) : [];
		const sessionIds = settings.filter?.sessionIds ?? [deps.controllerNamespace];
		const namespaced = sessionIds.flatMap((ns) =>
			deps.getLiveParameters(ns).map((parameter) => ({namespace: ns, parameter})),
		);
		const filtered = filterParametersForAgent({
			parameters: namespaced,
			controllerNamespace: deps.controllerNamespace,
			settings,
			uiRefs,
		});
		return {parameters: filtered.map(({parameter}) => mapParameterDefinition(parameter))};
	} catch (e) {
		return {parameters: [], ...formatToolInputError(e)};
	}
}
```

Get handler: parse input; compute filtered set as list; map to `{id, name, currentValue}` via `mapParameterDefinition` fields; if `names` provided, resolve each with `findParameterByName` on the filtered list.

- [ ] **Step 4: Run tests — PASS**

- [ ] **Step 5: Commit (Shared)**

```bash
cd src/shared
git add features/agent-tools
git commit -m "SS-9974: Add list/get parameter value handlers"
```

---

### Task 6: `set_parameter_values` handler

**Files:**
- Create: `src/shared/features/agent-tools/model/handlers/setParameterValues.ts`
- Test: `src/shared/features/agent-tools/__tests__/handlers/setParameterValues.test.ts` (thin: Zod reject + delegates to `resolveAndUpdate`)

**Interfaces:**
- Consumes: `setParameterValuesInputSchema`, `resolveAndUpdate`, `AgentToolsDeps.batchParameterValueUpdate`
- Produces: `handleSetParameterValues(input, deps) => {applied, errors}`

```ts
export async function handleSetParameterValues(
	input: unknown,
	deps: AgentToolsDeps,
): Promise<{applied: string[]; errors: {name: string; message: string}[]}> {
	try {
		const parsed = setParameterValuesInputSchema.parse(input);
		return await resolveAndUpdate(
			deps.controllerNamespace,
			deps.getLiveParameters,
			parsed.updates,
			deps.batchParameterValueUpdate,
		);
	} catch (e) {
		return {applied: [], ...formatToolInputError(e)};
	}
}
```

- [ ] **Step 1: Failing test** — unknown key `parameters` → `applied: []` and `errors[0].name === "*"`
- [ ] **Step 2: Run FAIL**
- [ ] **Step 3: Implement handler**
- [ ] **Step 4: Run PASS**
- [ ] **Step 5: Commit** `SS-9974: Add set_parameter_values handler`

---

### Task 7: `list_action_controls`

**Files:**
- Create: `src/shared/features/agent-tools/config/listActionControls.ts`
- Create: `src/shared/features/agent-tools/lib/collectActionControls.ts`
- Create: `src/shared/features/agent-tools/model/handlers/listActionControls.ts`
- Test: `src/shared/features/agent-tools/__tests__/collectActionControls.test.ts`

**Interfaces:**

```ts
export const DEFAULT_LIST_ACTION_CONTROL_TYPES: AppBuilderActionType[] = [
	"createModelState",
	"addToCart",
	"setParameterValue",
	"setParameterValues",
	"undo",
	"redo",
	"resetParameterValues",
	"importModelState",
	"camera",
	"sound",
];

export type ListedActionControl = {
	id: string;
	name: string;
	type: AppBuilderActionType;
	description?: string;
};

export const listActionControlsInputSchema = z.strictObject({});

export function collectActionControls(args: {
	appBuilder: IAppBuilder | undefined;
	defaultToolbarActions: IAppBuilderControlActionRef[];
	settings: ListActionControlsToolSettings;
}): ListedActionControl[];

export async function handleListActionControls(
	input: unknown,
	settings: ListActionControlsToolSettings,
	deps: AgentToolsDeps,
): Promise<{actions: ListedActionControl[]; errors?: {name: string; message: string}[]}>;
```

Extend `AgentToolsDeps` with `getDefaultToolbarActions: () => IAppBuilderControlActionRef[]`.

Collect: recurse App Builder widgets (`controls` / `form` / toolbars) for `type === "action"` plus `defaultToolbarActions`. Identity: `id` ?? `label` ?? `definition.type`. Filter by `settings.actions` (name match id/label) **or** `settings.filter.types` defaulting to `DEFAULT_LIST_ACTION_CONTROL_TYPES`.

- [ ] **Step 1: Tests** — empty app + toolbar undo → one action when types default; `filter.types: ["sound"]` drops undo; explicit `actions: [{name: "x"}]` only that id.
- [ ] **Step 2: FAIL**
- [ ] **Step 3: Implement collect + handler** (Zod `{}` like list params)
- [ ] **Step 4: PASS**
- [ ] **Step 5: Commit** `SS-9974: List action controls from App Builder + toolbars`

---

### Task 8: `trigger_action_control` + `runActionControl`

**Files:**
- Create: `src/shared/features/agent-tools/config/triggerActionControl.ts`
- Create: `src/shared/features/agent-tools/model/runActionControl.ts`
- Create: `src/shared/features/agent-tools/model/handlers/triggerActionControl.ts`
- Test: `src/shared/features/agent-tools/__tests__/runActionControl.test.ts`

**Interfaces:**

```ts
export const triggerActionControlInputSchema = z.strictObject({
	name: z.string(),
});

export type RunActionControlResult = {success: boolean; message?: string};

export async function runActionControl(
	action: IAppBuilderControlActionRef,
	deps: AgentToolsDeps,
): Promise<RunActionControlResult>;

export async function handleTriggerActionControl(
	input: unknown,
	settings: ListActionControlsToolSettings,
	deps: AgentToolsDeps,
): Promise<RunActionControlResult>;
```

Resolve `name` against `collectActionControls` (same list as list tool, using list-action settings from the toolset — pass those settings into the trigger handler). Unknown name → `{success: false, message: 'Action "…" does not exist.'}`.

`runActionControl` switch on `action.definition.type` (use existing `isCreateModelStateAction` etc.):

| type | behavior |
|---|---|
| `createModelState` | `deps.createModelState(props)` then `{success: true}` or `{success: false, message}` |
| `importModelState` | `deps.importModelState` — if the action shows UI (no id in props), still call the same hook the component uses; on throw `{success: false, message}` |
| `setParameterValue` / `setParameterValues` | map definition props to `batchParameterValueUpdate` / existing resolve helpers; wait |
| `undo` | `deps.undo()` |
| `redo` | `deps.redo()` |
| `resetParameterValues` | `deps.resetParameters(namespace)` |
| `addToCart` | `deps.addToCart(props)` if present, else `{success: false, message: "addToCart is not available"}` |
| `camera` | if `isSetCameraAction(props)`, set position/target via `deps.setCamera`; else `{success: false, message: "Camera action subtype not supported"}` |
| `sound` | `{success: false, message: "not supported"}` unless `deps.playSound` exists |
| anything else | `{success: false, message: "not supported"}` |

Do **not** mount React. Extend `AgentToolsDeps` with the functions the switch needs (`createModelState`, `importModelState`, `undo`, `redo`, `resetParameters`, `setCamera`, optional `addToCart`). Tests mock those functions.

- [ ] **Step 1: Tests** — unknown name; undo calls `deps.undo`; custom/unsupported type returns `not supported`
- [ ] **Step 2: FAIL**
- [ ] **Step 3: Implement**
- [ ] **Step 4: PASS**
- [ ] **Step 5: Commit** `SS-9974: Trigger action controls without UI`

---

### Task 9: Camera, screenshot, metric handlers

**Files:**
- Create: `src/shared/features/agent-tools/config/setCameraPosition.ts`
- Create: `src/shared/features/agent-tools/config/getScreenshot.ts`
- Create: `src/shared/features/agent-tools/config/getMetric.ts`
- Create: `src/shared/features/agent-tools/model/handlers/setCameraPosition.ts`
- Create: `src/shared/features/agent-tools/model/handlers/getScreenshot.ts`
- Create: `src/shared/features/agent-tools/model/handlers/getMetric.ts`
- Test: `src/shared/features/agent-tools/__tests__/handlers/viewportAndMetric.test.ts`

**Interfaces:**

```ts
export const vec3Schema = z.strictObject({
	x: z.number(),
	y: z.number(),
	z: z.number(),
});

export const setCameraPositionInputSchema = z.strictObject({
	position: vec3Schema,
	target: vec3Schema,
	viewportId: z.string().optional(),
});

export const getScreenshotInputSchema = z.strictObject({
	viewportId: z.string().optional(),
});

export const getMetricInputSchema = z.strictObject({});

export const AGENT_METRIC_OUTPUT_NAME = "AgentMetric";
```

Extend `AgentToolsDeps`:

```ts
getViewportId: () => string;
setCamera: (args: {
	viewportId: string;
	position: {x: number; y: number; z: number};
	target: {x: number; y: number; z: number};
}) => Promise<{success: boolean; message?: string}>;
getScreenshot: (viewportId: string) => Promise<string | undefined>;
getOutputByName: (
	namespace: string,
	name: string,
) => {content: unknown} | undefined;
```

Handlers:

- `set_camera_position`: parse; `viewportId = parsed.viewportId ?? deps.getViewportId()`; `return deps.setCamera(...)`. Missing viewport → `{success: false, message: "Viewport not found."}`.
- `get_screenshot`: parse; call `getScreenshot`; empty/undefined → `{success: false, message: "Screenshot failed."}`; else `{success: true, image}`.
- `get_metric`: parse `{}`; `deps.getOutputByName(controllerNamespace, "AgentMetric")`; missing → `{found: false}`; found → `{found: true, value: content}`. Zod fail → `{found: false, message}`.

`setCamera` implementation (in `useAgentToolHandlers`, Task 10): `const camera = useShapeDiverStoreViewport.getState().viewports[id]?.camera`. If missing, `{success: false, message: "Viewport not found."}`. Set `camera.position = {x, y, z}` and `camera.target = {x, y, z}` from the parsed input (same `{x,y,z}` shape as `vec3Schema`). Do **not** change camera type.

- [ ] **Step 1: Tests** with mock deps — missing viewport; empty screenshot; missing AgentMetric `{found:false}`; extra key on get_metric
- [ ] **Step 2: FAIL**
- [ ] **Step 3: Implement config + handlers**
- [ ] **Step 4: PASS**
- [ ] **Step 5: Commit** `SS-9974: Add camera, screenshot, and AgentMetric handlers`

---

### Task 10: `useAgentToolHandlers` + WebMCP registrar + page wiring

**Files:**
- Create: `src/shared/features/agent-tools/model/useAgentToolHandlers.ts`
- Create: `src/shared/features/webmcp/model/registerResolvedTools.ts`
- Modify: `src/shared/features/webmcp/model/useWebMcpTools.types.ts`
- Modify: `src/shared/features/webmcp/model/useWebMcpTools.ts`
- Modify: `src/shared/pages/appbuilder/AppBuilderPage.tsx` (`useWebMcpTools` call ~line 234)
- Create: `src/shared/features/agent-tools/config/toolMeta.ts` — name → description + annotations (`readOnlyHint`)

**Interfaces:**

```ts
export type AgentToolHandlerMap = Record<
	InScopeGenericToolName,
	(input: unknown) => Promise<unknown>
>;

export function useAgentToolHandlers(args: {
	namespace: string;
	appBuilderData: IAppBuilder | undefined;
	resolved: ResolvedGenericTool[];
}): AgentToolHandlerMap;
```

Snapshot: in `useWebMcpTools`, `const agentRef = useRef<IAppBuilderAgent | undefined | "unset">("unset")`. On first render where `appBuilderData !== undefined` **or** session is ready, set `agentRef.current = appBuilderData?.agents?.[0]` and never overwrite.

```ts
export interface UseWebMcpToolsProps {
	namespace?: string;
	enabled?: boolean;
	appBuilderData?: IAppBuilder;
}
```

`registerResolvedTools(modelContext, resolved, handlers, signal)` loops resolved tools, `registerTool({ name, description, inputSchema: zodToJsonSchema(schemaFor(name)), execute: handlers[name], annotations })`.

`schemaFor(name)` switch returns the Zod input schema for that tool.

Descriptions: move strings from `features/webmcp/config/tools.ts` for list/set; write new ones for the rest (no `filter` mention on list).

`useAgentToolHandlers` binds Zustand:

- parameters: existing `getParameters` / `batchParameterValueUpdate`
- viewport: `useViewportId` + `useShapeDiverStoreViewport` + `useShapeDiverStoreViewportAccessFunctions.getScreenshot`
- history: call `useViewportHistory()` inside `useAgentToolHandlers`; `undo: goBack`, `redo: goForward`
- model state: `useCreateModelState` / `useImportModelState` (same as current `useWebMcpTools`)
- reset: `useParameterImportExport(namespace).resetParameters`
- outputs: `getOutput(namespace, "AgentMetric")` via parameter store
- default toolbar actions: `useShapeDiverStoreToolbars` → flatten `defaultToolbars` items where `type === "action"`

- [ ] **Step 1: Change `UseWebMcpToolsProps` and `AppBuilderPage`**

```ts
useWebMcpTools({
	namespace,
	enabled: isWebMcpAvailable(),
	appBuilderData,
});
```

- [ ] **Step 2: Replace `useWebMcpTools` body** — keep sessionReady / paramsPopulated / AbortController pattern. Remove direct `registerCreate*` / `registerImport*`. Call `resolveToolset(snapshotAgent)` then `registerResolvedTools`.

- [ ] **Step 3: `pnpm exec tsc --noEmit --pretty false`**
Expected: compile clean for touched files. Fix only errors caused by this task.

- [ ] **Step 4: Commit** `SS-9974: Register resolved agent tools on WebMCP`

---

### Task 11: Delete old WebMCP tools; update evals

**Files:**
- Delete register/create/import files listed in File Map
- Modify: `features/webmcp/evals/evals.json` — remove create/import and `filter`/`visibleOnly` list cases; list scenarios use `"input": {}`; add agent-settings cases only if the eval runner can pass settings (otherwise test filters in `filterParametersForAgent` tests only)
- Modify: `features/webmcp/evals/runWebmcpEvalScenarios.ts` — import schemas/handlers from agent-tools; drop create/import branch
- Modify remaining webmcp tests (`webmcpSchemas.test.ts`) — retarget list/set schemas to agent-tools; drop create/import describes
- Grep `create_model_state` / `registerCreateModelStateTool` / `webmcp/config/listParameterDefinitions` and fix leftovers

- [ ] **Step 1: Update evals.json** — every `list_parameter_definitions` input is `{}`. Delete `list_visible`, `list_reject_visible_only`, and all `create_model_state` / `import_model_state` entries. Keep set_* cases.

- [ ] **Step 2: Point `runListScenario` at `handleListParameterDefinitions` with default settings + `EVAL_NAMESPACE` fixture parameters (wrap as `AgentToolsDeps`)**

- [ ] **Step 3: Delete dead files**

- [ ] **Step 4: Run**

```bash
pnpm test -- webmcpEvals.test.ts webmcpSchemas.test.ts resolveToolset.test.ts filterParametersForAgent.test.ts
pnpm test -- src/shared/features/agent-tools
pnpm test -- src/shared/features/webmcp
```

Expected: PASS. No test still imports deleted modules.

- [ ] **Step 5: Commit** `SS-9974: Remove create/import WebMCP tools and update evals`

---

### Task 12: Parent submodule pointer + smoke notes

**Files:**
- Parent `src/shared` gitlink
- Optional local JSON under `public/` only if you already have a ticket JSON — do **not** invent tickets. Use `appBuilderOverride.agents` in an existing local settings file the implementer already uses.

- [ ] **Step 1: In parent repo, commit submodule SHA** (when user asks)

```bash
git add src/shared
git commit -m "SS-9974: Point shared submodule at agent-tools WebMCP"
```

- [ ] **Step 2: Manual smoke (not automated)**

1. `pnpm run start` if port 3000 free.
2. Chrome with WebMCP, model loaded.
3. No `agents` → tools = 8 in-scope names; no `create_model_state` / `import_model_state` / `ask_user_question`.
4. Settings `appBuilderOverride.agents[0].useGenericToolDefaults: false` + `genericTools: [{name:"get_screenshot"}]` → only screenshot.
5. `list_parameter_definitions` with `{}` returns params; sending `filter` fails schema.
6. `set_parameter_values` still applies a valid update.
7. `get_screenshot` returns a data URL.
8. `get_metric` → `{found:false}` unless the model has output `AgentMetric`.

---

## Spec coverage

| Spec item | Task |
|---|---|
| `GetParameterValuesToolSettings` in union | 1 |
| `resolveToolset` defaults / overlay / no specificTools / no ask_user | 2 |
| Empty list input; move parameter schemas | 3 |
| hidden / invisible / sessionIds / explicit parameters | 4 |
| list + get parameter handlers | 5 |
| set_parameter_values + partial apply | 3 (lib) + 6 |
| list_action_controls + default types | 7 |
| trigger without React; not supported | 8 |
| camera position+target; screenshot; AgentMetric | 9 |
| WebMCP registrar; snapshot; appBuilderData prop | 10 |
| Delete create/import; evals | 11 |
| Manual smoke; parent pointer | 12 |
| config pure for AppBuilderAgent later | 1–3, 7, 9 (config files) |
| ToolsApi / LangChain / specificTools / ask_user | out of plan |

## Type names (locked)

`ResolvedGenericTool`, `InScopeGenericToolName`, `IN_SCOPE_GENERIC_TOOL_NAMES`, `AgentToolsDeps`, `NamespacedParameter`, `ListedActionControl`, `DEFAULT_LIST_ACTION_CONTROL_TYPES`, `AGENT_METRIC_OUTPUT_NAME`, `handleListParameterDefinitions`, `handleGetParameterValues`, `handleSetParameterValues`, `handleListActionControls`, `handleTriggerActionControl`, `handleSetCameraPosition`, `handleGetScreenshot`, `handleGetMetric`, `runActionControl`, `resolveToolset`, `useAgentToolHandlers`, `registerResolvedTools`.
