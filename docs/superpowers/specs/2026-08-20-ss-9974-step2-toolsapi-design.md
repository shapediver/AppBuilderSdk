# SS-9974 Step 2: ToolsApi (CrossWindow)

## Problem

Step 1 exposed generic agent tools in the App Builder SDK via WebMCP. Third parties and AppBuilderAgent cannot rely on WebMCP (beta, browser-specific). Jira Step 2 requires a window-to-window **`ToolsApi`**, same principle as `ECommerceApi` / `ECommerceApiConnector`, using `CrossWindowApiFactory`.

Tool **handlers and Zod I/O** already exist. Step 2 is a transport, not a second implementation.

## Context

**AppBuilderShared source of truth:** `ShapeDiverCreateReactAppExample/src/shared`. AppBuilderAgent `packages/app-builder-shared` is a consumer gitlink only.

| Repo | Role in Step 2 |
|---|---|
| AppBuilderShared (`src/shared`, branch `task/SS-9974`) | **Implementation.** Contract, factory, connector, hook. |
| ShapeDiver App Builder (parent) | Wires `useToolsApiConnector` next to `useWebMcpTools`. Submodule pointer. |
| AppBuilderAgent | **No code.** Step 3: `window.open` / iframe + `ToolsApi` client + LangChain `.implement()`. |

Jira (Alexander, 18 Aug): PR for Steps 1 and 2 together. Step 3 waits on the agent repo UI.

ECommerce mapping (inverted caller):

| ECommerce | ToolsApi |
|---|---|
| Plugin provides cart actions; App Builder is client via `window.parent` | Agent is client; App Builder is **server** (runs handlers) |
| `ECommerceApi` in AB → parent | `ToolsApi` in agent window → App Builder window |
| `ECommerceApiConnector` in parent → AB iframe | `ToolsApiConnector` in AB → agent `Window` |
| Names `"app"` / `"plugin"` | Names `"app"` / `"agent"` |

Three topologies (Step 3 picks the `Window`; Step 2 does not detect them):

1. App Builder `window.open` agent → connector gets opened window; client uses `opener`.
2. Agent iframe inside App Builder → connector gets `iframe.contentWindow`.
3. App Builder iframe inside host agent → connector uses `window.parent`; client uses iframe.

## Scope

**In**

- `IToolsApi` client: `listTools()`, `execute({name, input})`.
- `IToolsApiConnector` server: CrossWindow listeners that call the **same** `resolveToolset` snapshot + `useAgentToolHandlers` map as WebMCP.
- Factory taking an explicit `Window` (`getWindowApi` / `getParentApi`). No `window.open`, no `agentUrl`.
- Lift snapshot out of `useWebMcpTools` into a shared runtime hook so both transports see one toolset.
- Move `schemaFor` and `zodToJsonSchema` out of `features/webmcp` so the connector does not import WebMCP.
- Jest with an in-process mock `ICrossWindowApi`.

**Out**

- AppBuilderAgent / LangChain / chat UI / `.implement()`
- `window.open`, `agentUrl`, auto-detect opener vs parent vs child
- `ask_user_question`, `specificTools`
- Named per-tool CrossWindow methods
- Dummy client inside App Builder (agent-side dummy is Step 3)
- Cypress / two-real-window smoke (Step 3)
- Camera type changes, ToolsApi methods beyond list/execute

## Architecture

One runtime, two transports:

```
features/agent-tools/config    Zod, resolveToolset, toolMeta, schemaFor, IToolsApi types
        │
        ├─ WebMCP registerResolvedTools
        ├─ ToolsApiConnector.listTools / execute
        └─ AppBuilderAgent later: tool({ schema }) from listTools — do not import model/

features/agent-tools/model     useAgentToolRuntime, handlers, useToolsApiConnector
        │
        ├─ useWebMcpTools(resolved, handlers)
        └─ useToolsApiConnector({ window, resolved, handlers })

features/agent-tools/api       ToolsApi, ToolsApiConnector, factory (CrossWindow, no React)
```

Rules:

- `config/*` must not import React, viewer, WebMCP, or `window`.
- `api/*` may use `CrossWindowApiFactory` and `Window`; no React; no handler implementations.
- Connector / WebMCP must not import each other.
- No barrel that re-exports `model` from `config`.
- `resolveToolset(agent)` stays the single source of which tools exist.

## Files

All paths under AppBuilderShared `src/shared/`.

**Create**

- `features/agent-tools/config/toolsApi.ts` — `IToolsApi`, `IToolsApiConnector`, message type constants, list/execute payloads
- `features/agent-tools/config/schemaFor.ts` — `schemaFor(name)` moved from `registerResolvedTools`
- `features/agent-tools/api/toolsApi.ts` — `ToolsApi`, `ToolsApiConnector`, `ToolsApiFactory`
- `features/agent-tools/model/useAgentToolRuntime.ts` — snapshot + `resolveToolset` + `useAgentToolHandlers`
- `features/agent-tools/model/useToolsApiConnector.ts`
- `features/agent-tools/__tests__/toolsApi.test.ts` — mock `ICrossWindowApi`

**Move**

- `features/webmcp/lib/zodToJsonSchema.ts` → `features/agent-tools/lib/zodToJsonSchema.ts`. Update WebMCP imports. Delete the webmcp copy.

**Modify**

- `features/webmcp/model/registerResolvedTools.ts` — import `schemaFor` from agent-tools
- `features/webmcp/model/useWebMcpTools.ts` — consume runtime; stop snapshotting internally
- `pages/appbuilder/AppBuilderPage.tsx` — `useAgentToolRuntime` once; pass into WebMCP + ToolsApi connector (`window` omitted / undefined)

## Data flow

```
appBuilderData + appBuilderParseSettled
        → takeAgentSnapshot (first load only)
        → resolveToolset(agents[0] | undefined)
        → useAgentToolHandlers
        ├─ useWebMcpTools(resolved, handlers)     // existing register when session+params ready
        └─ useToolsApiConnector({window, resolved, handlers})
                window missing → no listeners
                window set     → wait peerIsReady, on(LIST_TOOLS), on(EXECUTE_TOOL)
```

`listTools` (execute time, from the frozen snapshot’s resolved list):

For each `ResolvedGenericTool`: `{name, description: AGENT_TOOL_META[name].description, inputSchema: zodToJsonSchema(schemaFor(name))}`.

`execute`:

```
{name, input} → if name is in the resolved snapshot: handlers[name](input)
             → else {success: false, message: 'Tool "…" does not exist.'}
```

`useAgentToolHandlers` may still build a full eight-tool map. **Resolved names win.** A tool that exists on the map but was not in `resolveToolset` is unknown.

Live parameter/viewport/output state is read inside handlers (unchanged). Filter settings stay on the snapshot.

Peer names: connector `name: "app"`, `peerName: "agent"`; client the reverse. Timeout: same order as ECommerce (`20000` ms) unless a test injects a shorter one.

Unmount or `window` change: cancel `on()` tokens (same idea as WebMCP `AbortController`). Do not retake the agent snapshot.

## Error handling

Handlers still never throw into a transport. Connector wraps anyway.

| Case | Result |
|---|---|
| Known tool | Handler JSON unchanged (including Zod `{errors}` / `{success:false}` / `{found:false, message}`) |
| Unknown `name` | `{success: false, message: 'Tool "…" does not exist.'}` — handler not called |
| Handler throws | `{success: false, message}` (`Error.message` or `String(e)`) |
| Snapshot not complete / no `Window` | No listeners (client sees CrossWindow timeout / never connected — not a fake toolset) |
| `peerIsReady` timeout | Factory promise rejects (transport failure, not a tool JSON) |
| `listTools` with empty resolved | `{tools: []}` — success, not an error |

Do not throw across postRobot for tool-level failures. Transport timeout is the only client `execute`/`listTools` rejection besides a missing peer.

## Testing

Jest, in-process mock `ICrossWindowApi`: a map of `on` handlers; `send(type, data)` calls the matching handler.

1. `listTools` with `undefined` agent → eight default in-scope names; each row has `description` (string) and `inputSchema` (object).
2. `useGenericToolDefaults: false` + `genericTools: [{name: "get_screenshot"}]` → one tool, `get_screenshot`.
3. `execute` of a known name calls that handler with `input` and returns its JSON.
4. Unknown name, or a name that has a handler but is **not** in `resolved` → `{success: false, message: 'Tool "x" does not exist.'}`; no handler call.
5. Handler throw → `{success: false, message}`.
6. `useToolsApiConnector` with no `window` → does not register `on`; does not throw.
7. After moving `schemaFor` / `zodToJsonSchema`, existing `webmcp` + `agent-tools` suites still pass.

No real `Window`, no postRobot, no AppBuilderAgent.

## Success criteria

- App Builder SDK exposes `ToolsApi` / `ToolsApiConnector` via `CrossWindowApiFactory`.
- `listTools` and WebMCP registration describe the **same** resolved set for `agents[0]` (or defaults).
- `execute` reuses Step 1 handlers and result shapes; unknown tool is JSON, not throw.
- Connector and `config/toolsApi.ts` are importable without `features/webmcp`.
- `config/` remains importable without React, viewer, or handlers.
- Jest above is green; `tsc --noEmit` clean.
- AppBuilderAgent unchanged.

## Decisions (locked)

| Topic | Choice |
|---|---|
| Repos | SDK / Shared only |
| RPC shape | `listTools` + `execute({name, input})`, not per-tool methods |
| Peer `Window` | Caller passes it; no `window.open` / auto-detect in Step 2 |
| Runtime | One snapshot + handler map; WebMCP and ToolsApi are transports |
| Unknown tool | `{success: false, message: 'Tool "…" does not exist.'}` (not in `resolved`, even if a handler exists) |
| CrossWindow names | `"app"` / `"agent"` |
| Dummy API in App Builder | No |
| LangChain / agent UI | Step 3 |
