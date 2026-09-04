# SS-9974: Strip template, one Mantine chat page

## Problem

AppBuilderAgent still ships the LangChain Next.js template: demo pages, Vercel AI SDK chat, shadcn/Tailwind, Supabase/Tavily. Product chat is a Tailwind `/app` page. Jira SS-9974 said Mantine can wait; that wait is over. Template leftovers hide the product and pull unused packages.

## Context

| Repo | Role |
|---|---|
| AppBuilderAgent | **All work.** Delete demos. One Mantine chat at `/app`. |
| App Builder parent / Shared | **No code.** `agentUrl` stays `http://localhost:3001/app`. Iframe + `getParentClientApi` already shipped. |

Jira: start from the Next.js LangChain template; chat UI in the same window as ToolsApi; later refactor to Mantine, reuse Shared so theme can match App Builder. This slice does the Mantine refactor with **default** theme only. Passing `themeOverrides` from App Builder is a later slice.

Mantine version matches App Builder: **`@mantine/core` / `@mantine/hooks` `9.4.0`**.

## Scope

**In**

- `/app` is the only product UI. `GET /` redirects to `/app`.
- Root layout: `html` + `body` + `MantineProvider` (default theme) + `{children}`. No LangChain nav, logo, GitHub button, `Toaster`, `NuqsAdapter`.
- Rewrite `AppBuilderAgentPage` to Mantine. Same ToolsApi + `useStream` behavior.
- Delete all template demo pages, their API routes, `components/`, `data/`.
- Remove unused npm packages. Add Mantine 9.4.0 + PostCSS preset.
- Title: `ShapeDiver Agent`.

**Out**

- App Builder / Shared code, iframe wiring, `agentUrl`.
- App Builder `themeOverrides` in the agent iframe.
- Markdown message render, tool-call chips, AppShell header.
- Fixing handshake/`API_READY` / draft-lost-on-submit.
- New generic tools, WebMCP, `ask_user_question`.
- Changing `/api/app-builder-agent/**`, `lib/app-builder-agent/**` (except if a demo-only import must move — none expected), `utils/llm.ts`.

## Architecture

```
GET /  →  redirect /app
GET /app
  layout: MantineProvider
  AppBuilderAgentPage
    ToolsApi (parent iframe or opener) + implementAppBuilderTools
    useStream → HttpAgentServerAdapter → /api/app-builder-agent/threads/:id/{commands,stream,state}
    UI: Alert + ScrollArea messages + TextInput + Send
```

Server agent loop, headless tool schemas, and ToolsApi client stay as they are. This slice is delete + skin.

## Routing and layout

- `app/page.tsx`: `redirect("/app")` from `next/navigation`. No demo `ChatWindow`.
- `app/app/page.tsx`: unchanged role — renders `AppBuilderAgentPage`.
- `app/layout.tsx`: drop template chrome. Import `@mantine/core/styles.css`. Wrap children in `MantineProvider`. Set `<title>ShapeDiver Agent</title>`. Drop `Public_Sans` unless Mantine default font is enough (use Mantine default).
- Delete pages: `app/agents`, `app/retrieval`, `app/retrieval_agents`, `app/structured_output`, `app/ai_sdk/**`, `app/langgraph/**`.
- Delete APIs: `app/api/chat/**`, `app/api/retrieval/**`.
- Keep: `app/api/app-builder-agent/**`.

## Chat UI

Full-viewport `Stack` (`h="100%"` / `100dvh`). No `AppShell`.

1. `Alert` when `status` or `stream.error` is set (handshake copy, thrown ToolsApi errors, stream errors). `color="red"` for errors. Copy for missing peer stays exactly: `Open this page from App Builder.`
2. `ScrollArea` `flex=1`: `stream.messages`. Human: right-aligned `Paper`. Assistant: left-aligned `Paper`. Body: Mantine `Text` with `style={{ whiteSpace: "pre-wrap" }}`. No markdown.
3. `Group`: `TextInput` `flex=1` + `Button` `type="submit"` label `Send`. Both `disabled={stream.isLoading}`.

Submit path unchanged: `stream.submit({ messages: [{ type: "human", content: text }] })`.

Components allowed: `MantineProvider`, `Stack`, `ScrollArea`, `Alert`, `Paper`, `Text`, `TextInput`, `Button`, `Group`.

Connect path unchanged: `resolveAgentToolsApiPeer` → `getParentClientApi` or `getClientApi(opener)` → `peerIsReady` → `listTools` → `implementAppBuilderTools`. Dynamic `import()` of `ToolsApiFactory` stays (SSR / post-robot).

## Packages

**Add (pin):** `@mantine/core@9.4.0`, `@mantine/hooks@9.4.0`, `postcss-preset-mantine`, `postcss-simple-vars`. Wire `postcss.config` like App Builder (preset + simple-vars). Drop Tailwind `postcss` plugins.

**Keep:** `next`, `react`, `react-dom`, `langchain`, `@langchain/core`, `@langchain/langgraph`, `@langchain/react`, `@langchain/openai`, `@langchain/google-genai`, `zod@4.4.3`, `post-robot`, `@types/post-robot`, `vitest`, TypeScript, ESLint, Prettier, `@types/*` for React/Node, `postcss`.

**Remove:** `@ai-sdk/react`, `@ai-sdk/rsc`, `ai`, `@langchain/community`, `@langchain/tavily`, `@langchain/langgraph-sdk`, `@radix-ui/react-checkbox`, `@radix-ui/react-dialog`, `@radix-ui/react-popover`, `@radix-ui/react-slot`, `@supabase/supabase-js`, `class-variance-authority`, `clsx`, `tailwind-merge`, `tailwindcss`, `tailwindcss-animate`, `autoprefixer`, `lucide-react`, `next-themes`, `nuqs`, `react-toastify`, `sonner`, `use-stick-to-bottom`, `vaul`, `zod-to-json-schema`.

**Delete trees:** `components/`, `data/` (retrieval demo text only), Tailwind config and `app/globals.css`. Mantine styles come from `@mantine/core/styles.css` in the layout.

Regenerate `pnpm-lock.yaml` via `pnpm install`. Do not hand-edit the lockfile.

## Errors

Same states, Mantine `Alert`:

- No peer (`resolveAgentToolsApiPeer` null): `Open this page from App Builder.`
- ToolsApi / handshake throw: `error.message` (including `Peer did not respond within 20000ms, giving up`).
- `stream.error`: same Alert, red.

Do not change handshake timeout, names `"agent"` / `"app"`, or connector behavior.

## Tests

- Keep existing `lib/app-builder-agent/__tests__/**` vitest files. They must still pass (`pnpm test`).
- No new jsdom tests for Mantine markup.
- After deleting ingest, `@langchain/textsplitters` must not be imported. `pnpm exec tsc --noEmit` should not fail on missing demo deps. Pre-existing errors unrelated to this slice: do not hunt; do not add those packages back.

## Success

- `http://localhost:3001/` redirects to `/app`.
- `http://localhost:3001/app` is a Mantine chat: status, messages, input, Send. No template nav.
- App Builder iframe `?agentUrl=http://localhost:3001/app` still loads that page.
- `pnpm test` green. Unused demo packages gone from `package.json`.

## Risks

- Mantine 9 + Next 15 App Router needs `MantineProvider` on the client. If layout is a Server Component, put a tiny `app/MantineRoot.tsx` `"use client"` wrapper; do not mark the whole root layout client-only unless required.
- Stripping Tailwind may leave className leftovers; product UI must not depend on `globals.css` Tailwind utilities.
