# SS-9974 Step 1: Agent generic tools in App Builder SDK (WebMCP)

## Problem

App Builder already exposes a beta WebMCP surface (`list_parameter_definitions`, `set_parameter_values`, `create_model_state`, `import_model_state`). SS-9974 Step 1 must:

- Drive tool **availability and filters** from `IAppBuilder.agents` (SS-9973 schema).
- Replace create/import model-state tools with `list_action_controls` + `trigger_action_control`.
- Add the remaining **generic** tools from `GenericToolName`, minus `ask_user_question`.
- Keep execution in the App Builder SDK. LangChain stays in `AppBuilderAgent`.

WebMCP is beta: breaking the old list-filter input contract is acceptable.

## Context

**AppBuilderShared source of truth:** `ShapeDiverCreateReactAppExample/src/shared` (not AppBuilderAgent `packages/app-builder-shared`). Author Shared on that checkout; Agents only bumps a gitlink.

| Repo | Role in Step 1 |
|---|---|
| AppBuilderShared (`src/shared`, branch `task/SS-9973`) | **Implementation.** Schema `IAppBuilderAgent` already lives here. Do not confuse this branch name with SS-9974. |
| ShapeDiver App Builder (parent) | Wires `useWebMcpTools`. Points submodule at the Shared work. |
| AppBuilderAgent (Next.js, `task/SS-9974`) | **No code in Step 1.** Later includes AppBuilderShared as a git submodule (Jira: *“you will need to include AppBuilderShared as a git submodule”*) and wraps shared Zod schemas as LangChain [headless tools](https://docs.langchain.com/oss/javascript/langchain/frontend/headless-tools). |

Jira also requires a later `ToolsApi` (Step 2, same pattern as `ECommerceApi` / `CrossWindowApiFactory`). Step 1 does not implement `ToolsApi`, but tool **handlers and I/O schemas** must be reusable by it.

`appBuilderOverride` (when present) **replaces** the whole `IAppBuilder` from the model (`useSessionWithAppBuilder`). Local agent config goes there.

Parametric updates to `agents` are ignored. Snapshot the first loaded `IAppBuilder.agents`.

## Scope

**In**

- Generic tools: `list_parameter_definitions`, `get_parameter_values`, `set_parameter_values`, `list_action_controls`, `trigger_action_control`, `set_camera_position`, `get_screenshot`, `get_metric`.
- Resolve toolset from first agent (`agents[0]`) or defaults if `agents` is missing/empty.
- Code shaped so a later caller can pass a different `IAppBuilderAgent` (by `id`). WebMCP always uses the first.
- Transport-agnostic handlers + WebMCP registrar only.
- Add `GetParameterValuesToolSettings` to the `GenericToolSettings` union (SS-9973 gap).
- Remove WebMCP registration of `create_model_state` and `import_model_state`.
- Jest tests + update mocked WebMCP evals. Manual WebMCP smoke.

**Out**

- `ask_user_question`
- `specificTools` (including `actionSequence` / `remoteExecution`)
- `ToolsApi` / `CrossWindowApiFactory`
- LangChain `tool()` / `.implement()` / chat UI (AppBuilderAgent)
- Camera **type** changes (perspective / orthographic)
- Changing Next.js AppBuilderAgent in this step
- Custom `ComponentContext.actions` overrides (report not supported)

## Architecture

Two segments in a new slice `features/agent-tools`. No LangChain dependency in Shared.

```
features/agent-tools/config   pure: Zod I/O, names, descriptions, resolveToolset
        │
        ├─ App Builder WebMCP inputSchema
        └─ AppBuilderAgent later: tool({ schema }) — do not import model/

features/agent-tools/model    browser handlers (stores, viewport, session)
        │
        ├─ features/webmcp register (this step)
        └─ ToolsApi server (Step 2)

AppBuilderAgent .implement() must NOT import model/.
It will call ToolsApi; ToolsApi runs handlers in the App Builder window.
```

Rules:

- `config/*` must not import React, viewer, WebMCP, or `window`.
- No barrel that re-exports `model` from `config`.
- `resolveToolset(agent)` takes **one** agent (or `undefined`).

### Resolve rules

`ask_user_question` and `specificTools` never appear in the resolved set.

1. No agent → all in-scope generic tools with default settings.
2. `useGenericToolDefaults !== false` (default true) → all in-scope generic tools; entries in `genericTools` overlay settings by `name`.
3. `useGenericToolDefaults === false` → only tools listed in `genericTools` (still ignoring `ask_user_question` if listed).

WebMCP registers exactly that set for `agents[0]`.

## Files

All paths under AppBuilderShared `src/shared/`.

```
features/agent-tools/
  config/
    resolveToolset.ts
    listParameterDefinitions.ts    # empty input object (strict); filter from agent settings
    getParameterValues.ts
    setParameterValues.ts          # move from webmcp/config
    listActionControls.ts
    triggerActionControl.ts
    setCameraPosition.ts
    getScreenshot.ts
    getMetric.ts
  lib/                             # mapper, find-by-name, set-value resolve, visibility filter
  model/
    agentToolsDeps.ts
    handlers/*.ts
    useAgentToolHandlers.ts        # bind stores → handler map
  __tests__/

features/webmcp/model/
  useWebMcpTools.ts                # snapshot agents[0], resolve, register
  registerResolvedTools.ts         # registerTool(schema from config, execute from handler)
```

Move from `features/webmcp`:

- `config/listParameterDefinitions.ts`, `config/setParameterValues.ts`
- `lib/parameterDefinitionMapper.ts`, `findParameterByName.ts`, `resolveSetParameterUpdates.ts`

Delete: `registerCreateModelStateTool`, `registerImportModelStateTool`, and their config/evals.

One-line schema fix: `features/appbuilder/config/appbuilderagent.ts` — include `GetParameterValuesToolSettings` in `GenericToolSettings`.

**Trigger actions:** add `runActionControl` in `agent-tools/model`. Dispatch by `AppBuilderActionType` using the same session/parameter/model-state functions the UI action components already call. Do not mount React or click buttons. Built-in types in the schema default filter are in scope. Custom `ComponentContext.actions` → structured error `not supported`.

## Data flow

```
model data output  OR  settings.appBuilderOverride (full replace)
        → useSessionWithAppBuilder
        → AppBuilderDataContext.data  (IAppBuilder)
        → snapshot agents[0] on first ready load (ignore later agents updates)
        → resolveToolset(snapshot)
        → WebMCP registerTool for each resolved name
```

Live state (parameters, viewport, outputs) is read at **execute** time. Filter **settings** come from the snapshot, not from tool input.

Default viewport: current viewport, same convention as screenshot parameter value sources. Optional `viewportId` overrides.

| Tool | Input | Reads | Output |
|---|---|---|---|
| `list_parameter_definitions` | `{}` strict | agent `parameters` **or** `filter` (`hidden`, `invisible`, `sessionIds`) + live params + `IAppBuilder` UI refs | `{ parameters, errors? }` |
| `get_parameter_values` | `{ names?: string[] }`; omit `names` → same set as list | live `currentValue` | `{ values: [{ id, name, currentValue }], errors? }` |
| `set_parameter_values` | `{ updates: [{ name, value }] }` | `batchParameterValueUpdate`, wait session | `{ applied, errors }` |
| `list_action_controls` | `{}` strict | snapshot `actions` **or** `filter.types` + controls widgets + default toolbars | `{ actions: [{ id, name, type, description? }] }` |
| `trigger_action_control` | `{ name }` (id or label, same order as `IAgentActionControlRef`) | `runActionControl`, wait | `{ success, message? }` |
| `set_camera_position` | `{ position, target, viewportId? }` | viewport camera | `{ success, message? }` |
| `get_screenshot` | `{ viewportId? }` | `viewportAccessFunctions.getScreenshot` | `{ success, image? }` (`image` = data URL) |
| `get_metric` | `{}` strict | data output whose **name** is `AgentMetric` | `{ found: true, value }` or `{ found: false }` |

`invisible`: parameters not referenced by a parameter control or accordion widget (definition already in `ListParameterDefinitionsToolSettings`). `hidden` defaults to `exclude`; `invisible` defaults to `include`; `sessionIds` omitted → controller session.

Default `list_action_controls` types (when `filter.types` omitted) are those documented on `ListActionControlsToolSettings` (includes create/import model state, undo/redo, camera, sound, addToCart, setParameterValue(s), reset). Export actions are not in that default list.

`get_metric` looks up output **name** `AgentMetric` (Confluence). Missing output is not an exception.

## Error handling

Handlers never throw into WebMCP. Always return JSON.

- Zod failure:
  - tools with `errors` in the output (`list_*`, `get_parameter_values`, `set_parameter_values`) → `{ …empty payload, errors: [{ name: "*", message }] }`
  - tools with `success` (`trigger_action_control`, `set_camera_position`, `get_screenshot`) → `{ success: false, message }`
  - `get_metric` → `{ found: false, message }` (invalid input, not a missing output)
- Unknown parameter/action → error carrying the caller’s `name`.
- Unsettable parameter → skip that update, error on that name.
- `set_parameter_values`: apply valid updates, collect errors for invalid ones (existing behavior).
- Unknown / missing viewport or screenshot function → `{ success: false, message }`.
- Empty screenshot data URL → `{ success: false, message }`.
- Action run failure → `{ success: false, message }`.
- Custom `ComponentContext` action → `{ success: false, message: "not supported" }`.
- Session not ready at execute → `{ success: false, message }` (no hang).
- WebMCP unavailable / session empty → `registered: false`, retry when session+params exist (existing hook behavior).
- `list_*` filters to nothing → empty array, not an error.
- Missing `AgentMetric` → `{ found: false }`.

Step 2 `ToolsApi` must reuse these result shapes.

## Testing

Jest in AppBuilderShared only.

1. `resolveToolset`: no agent; overlay; `useGenericToolDefaults: false`; never includes `ask_user_question` / `specificTools`.
2. Parameter filters: `hidden` / `invisible` / `sessionIds` / explicit `parameters`; empty list is success.
3. Moved mapper + `set_parameter_values` partial-apply tests.
4. Handler mocks: missing `AgentMetric`; missing viewport; unknown action name; extra keys on empty-input tools rejected.

WebMCP eval JSON: call handlers; drop create/import scenarios; list tools take `{}`; visibility via fixture agent settings, not `filter: all|visible`.

Manual smoke: Chrome WebMCP + local JSON `appBuilderOverride.agents`. Confirm first-agent tool set, default set when no `agents`, list/set, screenshot, metric if the model has `AgentMetric`.

Not in Step 1: LangChain e2e, ToolsApi, chat UI.

## Success criteria

- WebMCP (when available) exposes exactly the resolved generic tool set for `agents[0]`, or the default set if no agent.
- `appBuilderOverride.agents` changes that set without a code change.
- `create_model_state` / `import_model_state` are gone from WebMCP.
- `list_parameter_definitions` has no `filter`/`sessionId` input; filters come from agent settings.
- Shared `config/` can be imported later by AppBuilderAgent without pulling handlers, React, or viewer.
- Jest for resolve/filter/set/evals is green.

## Decisions (locked)

| Topic | Choice |
|---|---|
| Generic tools in Step 1 | All except `ask_user_question` |
| `specificTools` | Not registered |
| Camera | `position` + `target` + optional `viewportId`; no type change |
| Layout | `agent-tools` config (pure) + model (handlers); WebMCP is registrar |
| LangChain | Only in AppBuilderAgent; Shared supplies Zod/names/`resolveToolset` |
| Old WebMCP list input | Allowed to break (beta) |
| `GetParameterValuesToolSettings` | Add to `GenericToolSettings` union |
