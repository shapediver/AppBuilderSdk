# SS-9974 Step 3: Agent window + headless ToolsApi client

## Problem

Steps 1–2 shipped generic tools (WebMCP) and a window-to-window **ToolsApi** in AppBuilderShared. `AppBuilderPage` still **omits** `useToolsApiConnector({ window })`, so the connector is a no-op. AppBuilderAgent is still the LangChain Next.js template: no Shared submodule, no product page, no headless `.implement()`.

Without App Builder `window.open` plus an agent client on `window.opener`, there is no way to verify list/execute end-to-end.

## Context

**AppBuilderShared source of truth:** `ShapeDiverCreateReactAppExample/src/shared`. AppBuilderAgent `packages/app-builder-shared` only consumes a gitlink.

| Repo | Role in Step 3 |
|---|---|
| AppBuilderShared (`src/shared`) | Small hook-up only: pass peer `Window`. Do not add LangChain. Do not move handlers. |
| ShapeDiver App Builder (parent) | Query/settings `agentUrl`, Open agent button, `window.open`, wire connector. Vite stays **:3000**. |
| AppBuilderAgent | **Main work.** Git submodule Shared; product page; schema-only chat route; client `.implement()` via `ToolsApi`. `pnpm dev` → **:3001**. |

Jira: include AppBuilderShared as a git submodule; one window with ToolsApi connection + chat; App Builder tools as LangChain [headless tools](https://docs.langchain.com/oss/javascript/langchain/frontend/headless-tools); Mantine chat later.

Topology for this slice is **only** (1): App Builder `window.open` agent → connector gets the opened window; client uses `opener`. Iframe and host-embeds-AB are later.

## Scope

**In**

- Shared/parent: `QUERYPARAM_AGENTURL`, optional `settings.agentUrl`, Open agent control, `window.open`, pass opened `Window` into `useToolsApiConnector`.
- AppBuilderAgent: git submodule; import **config** (and client factory) only; product page `/app`; schema-only tools from Shared Zod; `listTools()` ∩ known names → `.implement()`; `useStream({ tools })`; `createChatModel`; `next dev -p 3001`.
- Handshake names stay `"app"` / `"agent"`. Timeout **20000** ms (already in ToolsApi).

**Out**

- Iframe / `window.parent` topologies
- `IAppBuilder.agents[].url`
- `ask_user_question`, `specificTools`
- Mantine chat / shared theme with App Builder
- Changing template demo pages/routes except a package bump required for headless tools
- WebMCP changes, new generic tools, Cypress two-window E2E
- Publishing Shared as npm; copying `config/` into the agent repo

## Architecture

```
AB :3000                                         Agent :3001/app
--------                                         ---------------
?agentUrl=http://localhost:3001/app
Open agent (user click)
  window.open(agentUrl, "shapediver-agent")
  useToolsApiConnector({ window: opened })
       ToolsApiConnector                         ToolsApiFactory.getClientApi(window.opener)
       name "app"                                name "agent"
       on(LIST_TOOLS / EXECUTE_TOOL)             handshake TOOLS_API_HANDSHAKE
       then handshake                            listTools() → ∩ InScopeGenericToolName
                                                 implementAppBuilderTools(api, listedNames)
                                                 useStream({ tools })
                                                 POST product chat route (schema-only)
```

One runtime on AB (`useAgentToolRuntime`). WebMCP unchanged. ToolsApi is the second transport; it only starts when `window` is set **and** `snapshotComplete` is true (existing hook).

### Import boundary (do not break)

AppBuilderAgent must not import Shared `model/` (handlers, React stores, viewer).

| Side | Allowed Shared imports |
|---|---|
| Next **server** (chat route, `appBuilderToolDefinitions.ts`) | `features/agent-tools/config` only (`InScopeGenericToolName`, `schemaFor`, `AGENT_TOOL_META`, ToolsApi **types/constants**). |
| Next **client** (`appBuilderHeadlessTools.ts`) | `ToolsApiFactory` from `features/agent-tools/api/toolsApi.ts` (CrossWindow / `post-robot`). Still no `model/`. |

Alias `@AppBuilderLib/*` → submodule root, same as App Builder. `transpilePackages` for the submodule. Add `post-robot` as an AppBuilderAgent dependency.

Shared Zod is Zod 4 (`shared/lib/zod`). AppBuilderAgent must use a compatible Zod major so `schemaFor` is importable. Do not re-handwrite field lists.

### Headless contract

- `appBuilderToolDefinitions.ts` — schema-only `tool({ name, schema, description })` for all **eight** in-scope generic tools. Shared between server and client. No `impl.ts`.
- Server registers **all eight** schema-only. `listTools` is browser-only; the LLM may name a tool AB did not resolve. Execute still happens on the client; AB returns `{ success: false, message: 'Tool "…" does not exist.' }` for unknown names.
- `appBuilderHeadlessTools.ts` (`"use client"`) — `implementAppBuilderTools(api, listedNames)`: `.implement()` only for names in `listTools()` ∩ `InScopeGenericToolName`. Each implementation calls `api.execute({ name, input })` and returns that JSON.
- Product chat uses `useStream({ tools })` and a **new** route (do not replace `app/api/chat/agents`). Template demos stay. Browser talks only to **:3001** (no langgraph-cli :2024). If `useStream` needs the LangGraph platform HTTP shape, host a thin adapter in this same Next app.

`createChatModel` from `utils/llm.ts` is the only chat-model factory.

## Files

**AppBuilderShared / parent**

- `shared/config/queryparams.ts` — `QUERYPARAM_AGENTURL`
- `features/appbuilder/config/appbuilder.ts` — `settings.agentUrl?: string`
- Settings Zod (`validateAppBuilderSettingsJson`) — optional `agentUrl` string
- `pages/appbuilder/AppBuilderPage.tsx` — resolve URL, overlay button, `window.open`, pass `Window` into `useToolsApiConnector`
- Extract a small click helper if that keeps the page thin and Jest-mockable (`window.open` + target name)

**AppBuilderAgent**

- Git submodule `packages/app-builder-shared` → [AppBuilderShared](https://github.com/shapediver/AppBuilderShared). Pin the commit that already has ToolsApi (SS-9974 Shared), not an older `main` without `features/agent-tools/api/toolsApi.ts`.
- `tsconfig` / `next.config` — `@AppBuilderLib/*`, `transpilePackages`
- `package.json` — `"dev": "next dev -p 3001"`; Zod 4-compatible; `post-robot`; `@langchain/react` / langchain that supports schema-only `tool()` + `.implement()`
- `app/app/page.tsx` — product page (ToolsApi connect + chat, colocated, not coupled)
- `appBuilderToolDefinitions.ts` — eight schema-only tools (server + client)
- `appBuilderHeadlessTools.ts` — `implementAppBuilderTools`
- New product chat route (not `app/api/chat/agents`)

## App Builder changes

`QUERYPARAM_AGENTURL = "agentUrl"` in `shared/config/queryparams.ts`.

Optional JSON: `settings.agentUrl` on `IAppBuilderSettingsSettings` (next to `disableFallbackUi`). Add the field to the settings Zod schema used by `validateAppBuilderSettingsJson` so strict validation does not strip/reject it.

**Precedence:** query `agentUrl` wins over `settings.agentUrl`.

Open agent control on `AppBuilderPage` (viewport overlay, near `ViewportAcceptRejectButtons`). Not a new themed widget, not `useProps`.

- No resolved URL → no button; connector still omits `window`.
- Button **disabled** until `snapshotComplete` (otherwise the agent handshake can expire while AB is not listening).
- Click (not `useEffect`): `window.open(url, "shapediver-agent")`. Same target name → reuse/focus, do not spawn extra tabs. `null` (popup blocker) → notification; do not set peer `Window`.
- Success → `useToolsApiConnector({ window: opened, resolvedTools, toolHandlers, snapshotComplete })`.

Do not start the connector against `globalThis.window`.

## AppBuilderAgent changes

- Git submodule: `packages/app-builder-shared` → AppBuilderShared.
- Product URL: **`/app`** (demos remain on `/`).
- `package.json` `"dev": "next dev -p 3001"` (default port **3001**).
- Client: if `window.opener` is missing, do not call `getClientApi`; show “open from App Builder”; chat without ToolsApi.
- System prompt: use the eight generic tools; no template parrot prompt.

## Error handling

| Case | Result |
|---|---|
| No `agentUrl` | No button; connector omitted |
| `window.open` returns `null` | Notification; peer not set |
| Agent without `opener` | Explicit UI; no ToolsApi; no fake peer |
| Handshake timeout (20s) | Error on the agent page, not silent |
| Unknown / filtered tool name | AB JSON `{ success: false, message }`; LLM sees text; run does not crash |
| Handler failure | Same structured JSON as Step 1/2 (never throw across ToolsApi) |
| Missing LLM key | `createChatModel` throws as today |

## Testing

**App Builder / Shared (Jest)**

- Query `agentUrl` vs `settings.agentUrl`; query wins.
- Connector still no-op when `window` omitted.
- Open-agent helper: `window.open` target name; `null` does not get passed to the connector. (Pure function + mock `window.open` if the click handler is extracted.)

**AppBuilderAgent**

- `implementAppBuilderTools` only implements the intersection of listed names and in-scope names.
- Schema-only definitions cover all eight `InScopeGenericToolName` values.

No Cypress two-real-window E2E in this slice. Manual smoke is the acceptance path.

## Smoke

1. App Builder: `http://localhost:3000/?g=all-parameters.json&agentUrl=http://localhost:3001/app`
2. Wait until Open agent is enabled (`snapshotComplete`).
3. Click → window on `:3001/app`, handshake succeeds.
4. Chat: list parameters / set a value / screenshot. Tool call runs in the agent window via ToolsApi; AB handlers execute.

## Success criteria

- Clicking Open agent with `agentUrl` connects ToolsApi (`listTools` + `execute`) between the two windows.
- Agent chat uses headless tools: schema on the Next server, `.implement()` on the client, execution only in App Builder.
- Shared `config/` remains free of React/viewer; agent server does not import `model/` or run AB handlers.
- Template demo pages still exist. Agent `pnpm dev` listens on **3001**.
- Jest above green; `tsc --noEmit` clean in the repos that changed.

## Decisions (locked)

| Topic | Choice |
|---|---|
| Slice | Vertical: submodule + `/app` + ToolsApi client + headless + AB `window.open` |
| Topology | AB `window.open` only; client `window.opener` |
| `agentUrl` | Query `?agentUrl=`; optional `settings.agentUrl`; query wins; not `IAppBuilder.agents[].url` |
| Open UI | Thin `AppBuilderPage` overlay button; no theme widget |
| `window.open` name | `"shapediver-agent"` (reuse/focus) |
| Button enable | Disabled until `snapshotComplete` |
| Tool schemas | Shared `config/` Zod; server all 8 schema-only; client implement intersection with `listTools()` |
| Chat | New product page + route; `useStream`; demos untouched |
| Files | `appBuilderToolDefinitions.ts`, `appBuilderHeadlessTools.ts` (not `impl.ts`) |
| Port | App Builder **3000**; agent `pnpm dev` **3001** |
| Graph host | One Next process on 3001; no langgraph-cli :2024 |
| LLM | `createChatModel` from `utils/llm.ts` |
| Chat UI kit | Minimal LangChain UI; Mantine later |
