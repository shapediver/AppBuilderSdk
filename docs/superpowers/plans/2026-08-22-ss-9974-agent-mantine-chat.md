# Strip Template + Mantine Chat Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** AppBuilderAgent is one Mantine chat at `/app`; LangChain template demos and unused packages are gone.

**Architecture:** Keep ToolsApi, headless tools, and `/api/app-builder-agent`. Replace root layout with official Mantine 9 App Router `MantineProvider`. `/` redirects to `/app`. Rewrite `AppBuilderAgentPage` markup only. Then delete demo trees and drop unused npm deps.

**Tech Stack:** Next.js 15 App Router, React 18, `@mantine/core@9.4.0`, `@mantine/hooks@9.4.0`, `@langchain/react` `useStream`, vitest.

**Spec:** `docs/superpowers/specs/2026-08-22-ss-9974-agent-mantine-chat-design.md`

## Global Constraints

- Work only in `D:/agents/AppBuilderAgent/SS-9974` except this plan/spec live in the App Builder parent docs.
- Do not change App Builder / Shared, iframe, `agentUrl`, handshake, or `lib/app-builder-agent/**` (except no new product files there).
- Do not change `utils/llm.ts` or `/api/app-builder-agent/**`.
- Mantine pins: `@mantine/core@9.4.0` and `@mantine/hooks@9.4.0`. Default theme only. No App Builder `themeOverrides`.
- Missing-peer copy stays exactly `Open this page from App Builder.`
- Send button label stays `Send`.
- Allowed UI components: `MantineProvider`, `ColorSchemeScript`, `Stack`, `ScrollArea`, `Alert`, `Paper`, `Text`, `TextInput`, `Button`, `Group`.
- No AppShell, no markdown, no tool chips, no new jsdom UI tests.
- Commits: `SS-9974: {name}`. pnpm only. Do not hand-edit `pnpm-lock.yaml`.
- Existing `pnpm test` (`lib/**/*.test.ts`) must stay green after every task.

---

### Task 1: Mantine install, PostCSS, layout, `/` redirect

**Files:**
- Modify: `D:/agents/AppBuilderAgent/SS-9974/package.json`
- Modify: `D:/agents/AppBuilderAgent/SS-9974/postcss.config.js`
- Modify: `D:/agents/AppBuilderAgent/SS-9974/next.config.js`
- Modify: `D:/agents/AppBuilderAgent/SS-9974/app/layout.tsx`
- Modify: `D:/agents/AppBuilderAgent/SS-9974/app/page.tsx`
- Modify: `D:/agents/AppBuilderAgent/SS-9974/app/globals.css`
- Delete after later task: `tailwind.config.js` (leave it until Task 3 so leftover Tailwind classNames on `/app` still compile if any remain)

**Interfaces:**
- Consumes: Next App Router `app/layout.tsx`, `app/page.tsx`
- Produces: `MantineProvider` wrapping all routes; `GET /` → `/app`; Mantine CSS + PostCSS preset

This task is config + layout. Spec forbids new UI tests. Covering check is TypeScript + `pnpm test`.

- [ ] **Step 1: Install Mantine 9.4.0 and PostCSS plugins**

From `D:/agents/AppBuilderAgent/SS-9974`:

```bash
pnpm add @mantine/core@9.4.0 @mantine/hooks@9.4.0
pnpm add -D postcss-preset-mantine postcss-simple-vars
```

Expected: `package.json` lists those versions. Do not remove Tailwind yet (Task 3).

- [ ] **Step 2: Replace PostCSS config**

Overwrite `postcss.config.js` with (Mantine 9 getting-started):

```js
module.exports = {
  plugins: {
    "postcss-preset-mantine": {},
    "postcss-simple-vars": {
      variables: {
        "mantine-breakpoint-xs": "36em",
        "mantine-breakpoint-sm": "48em",
        "mantine-breakpoint-md": "62em",
        "mantine-breakpoint-lg": "75em",
        "mantine-breakpoint-xl": "88em",
      },
    },
  },
};
```

- [ ] **Step 3: Enable Mantine package import optimization**

In `next.config.js`, keep existing `webpack` alias and `headers`. Add `experimental.optimizePackageImports`:

```js
module.exports = withBundleAnalyzer({
  experimental: {
    optimizePackageImports: ["@mantine/core", "@mantine/hooks"],
  },
  webpack: (config) => {
    config.resolve.alias["@AppBuilderLib"] = appBuilderShared;
    return config;
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "Cross-Origin-Embedder-Policy",
            value: "credentialless",
          },
          {
            key: "Cross-Origin-Resource-Policy",
            value: "cross-origin",
          },
        ],
      },
    ];
  },
});
```

- [ ] **Step 4: Minimal height reset in `app/globals.css`**

Replace Tailwind layers with:

```css
html,
body {
  height: 100%;
  margin: 0;
}
```

- [ ] **Step 5: Root layout = Mantine App Router setup**

Overwrite `app/layout.tsx` (official Mantine 9 Next App Router guide). Keep layout a Server Component. Do **not** add a separate `MantineRoot.tsx` unless `tsc` requires `MantineProvider` to be client-only — then add `app/MantineRoot.tsx` with `"use client"` wrapping `{children}` and keep layout as the server parent.

```tsx
import "@mantine/core/styles.css";
import "./globals.css";
import {
  ColorSchemeScript,
  MantineProvider,
  mantineHtmlProps,
} from "@mantine/core";

export const metadata = {
  title: "ShapeDiver Agent",
  description: "ShapeDiver App Builder agent chat",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" {...mantineHtmlProps}>
      <head>
        <ColorSchemeScript />
      </head>
      <body>
        <MantineProvider>{children}</MantineProvider>
      </body>
    </html>
  );
}
```

No Navbar, Logo, GitHub button, `Toaster`, `NuqsAdapter`, `Public_Sans`.

- [ ] **Step 6: Redirect `/` to `/app`**

Overwrite `app/page.tsx`:

```tsx
import { redirect } from "next/navigation";

export default function Home() {
  redirect("/app");
}
```

- [ ] **Step 7: Verify**

```bash
pnpm test
pnpm exec tsc --noEmit
```

Expected: vitest all pass. `tsc` may still mention demo files; must not fail on `@mantine/core`. If `MantineProvider` errors as a client component in a server layout, add `app/MantineRoot.tsx` as in the spec risk note and re-run `tsc`.

- [ ] **Step 8: Commit**

```bash
git add package.json pnpm-lock.yaml postcss.config.js next.config.js app/layout.tsx app/page.tsx app/globals.css app/MantineRoot.tsx
git commit -m "SS-9974: add Mantine layout and redirect / to /app"
```

Omit `app/MantineRoot.tsx` from `git add` if you did not create it.

---

### Task 2: Mantine chat markup on `/app`

**Files:**
- Modify: `D:/agents/AppBuilderAgent/SS-9974/app/app/AppBuilderAgentPage.tsx`
- Keep: `D:/agents/AppBuilderAgent/SS-9974/app/app/page.tsx` (still `return <AppBuilderAgentPage />`)

**Interfaces:**
- Consumes: `implementAppBuilderTools`, `resolveAgentToolsApiPeer`, `resolveAgentHttpApiUrl`, `ToolsApiFactory`, `useStream`, `HttpAgentServerAdapter` — unchanged
- Produces: same connect/submit behavior; Mantine `Stack` / `Alert` / `ScrollArea` / `Paper` / `Text` / `TextInput` / `Button` / `Group`

Connect + submit logic stays. Replace the `return (` JSX only (imports at top of file: add Mantine, drop none of the existing logic imports).

- [ ] **Step 1: Add Mantine imports next to existing ones**

```tsx
import {
  Alert,
  Button,
  Group,
  Paper,
  ScrollArea,
  Stack,
  Text,
  TextInput,
} from "@mantine/core";
```

- [ ] **Step 2: Replace the `return (` tree with this markup**

Keep `onSubmit`, `connect` effect, `transport`, `stream` exactly as they are.

```tsx
  return (
    <Stack h="100%" p="md" gap="sm">
      {status ? <Alert>{status}</Alert> : null}
      {stream.error ? (
        <Alert color="red">{errorText(stream.error)}</Alert>
      ) : null}
      <ScrollArea flex={1} type="auto">
        <Stack gap="xs">
          {stream.messages.map((message, index) => {
            const human = message.getType() === "human";
            return (
              <Paper
                key={message.id ?? index}
                p="sm"
                maw="80%"
                ml={human ? "auto" : 0}
                mr={human ? 0 : "auto"}
                withBorder
              >
                <Text style={{ whiteSpace: "pre-wrap" }}>
                  {messageContent(message)}
                </Text>
              </Paper>
            );
          })}
        </Stack>
      </ScrollArea>
      <form onSubmit={onSubmit}>
        <Group wrap="nowrap">
          <TextInput
            style={{ flex: 1 }}
            value={input}
            onChange={(event) => setInput(event.currentTarget.value)}
            disabled={stream.isLoading}
          />
          <Button type="submit" disabled={stream.isLoading}>
            Send
          </Button>
        </Group>
      </form>
    </Stack>
  );
```

No `className` Tailwind utilities. No AppShell.

- [ ] **Step 3: Verify**

```bash
pnpm test
pnpm exec tsc --noEmit
```

Expected: vitest pass. `AppBuilderAgentPage.tsx` has no `className=` leftover.

- [ ] **Step 4: Commit**

```bash
git add app/app/AppBuilderAgentPage.tsx
git commit -m "SS-9974: render agent chat with Mantine"
```

---

### Task 3: Delete template pages and unused packages

**Files — delete (all under `D:/agents/AppBuilderAgent/SS-9974`):**

Pages:
- `app/agents/page.tsx`
- `app/retrieval/page.tsx`
- `app/retrieval_agents/page.tsx`
- `app/structured_output/page.tsx`
- `app/ai_sdk/` (entire tree)
- `app/langgraph/` (entire tree)

APIs:
- `app/api/chat/` (entire tree)
- `app/api/retrieval/` (entire tree)

Other:
- `components/` (entire tree)
- `data/` (entire tree)
- `utils/cn.ts`
- `tailwind.config.js`
- `components.json`

Keep: `app/app/`, `app/api/app-builder-agent/`, `app/layout.tsx`, `app/page.tsx`, `app/globals.css`, `lib/`, `utils/llm.ts`, `packages/app-builder-shared`.

**Modify:** `package.json` (remove unused deps), `pnpm-lock.yaml` via `pnpm install`.

**Interfaces:**
- Consumes: product routes from Tasks 1–2
- Produces: `package.json` without demo stacks; `pnpm test` green; `tsc` not failing on deleted demo imports

- [ ] **Step 1: Confirm no product file imports the trees above**

```bash
rg -n "from \"@/components|from \"@/data|from \"@/utils/cn|app/api/chat|@ai-sdk|ChatWindow" --glob '!packages/**' --glob '!node_modules/**'
```

Expected: only files you are about to delete. If `app/app/AppBuilderAgentPage.tsx` or `lib/` matches, stop and fix — do not delete.

- [ ] **Step 2: Delete the trees**

```bash
rm -rf app/agents app/retrieval app/retrieval_agents app/structured_output app/ai_sdk app/langgraph app/api/chat app/api/retrieval components data
rm -f utils/cn.ts tailwind.config.js components.json
```

- [ ] **Step 3: Remove unused packages**

```bash
pnpm remove @ai-sdk/react @ai-sdk/rsc ai @langchain/community @langchain/tavily @langchain/langgraph-sdk @radix-ui/react-checkbox @radix-ui/react-dialog @radix-ui/react-popover @radix-ui/react-slot @supabase/supabase-js class-variance-authority clsx tailwind-merge tailwindcss tailwindcss-animate autoprefixer lucide-react next-themes nuqs react-toastify sonner use-stick-to-bottom vaul zod-to-json-schema
```

Do not remove `postcss`, `next`, `react`, LangChain product packages, `zod`, `post-robot`, Mantine, vitest.

- [ ] **Step 4: Verify `package.json` keep/remove lists**

Keep must still include: `next`, `react`, `react-dom`, `langchain`, `@langchain/core`, `@langchain/langgraph`, `@langchain/react`, `@langchain/openai`, `@langchain/google-genai`, `zod`, `post-robot`, `@mantine/core`, `@mantine/hooks`.

Remove list must be gone from both `dependencies` and `devDependencies`.

- [ ] **Step 5: Run tests and tsc**

```bash
pnpm test
pnpm exec tsc --noEmit
```

Expected: vitest pass. `tsc` must not report missing `@langchain/textsplitters` or `@/components/*`. Do not add deleted packages back to silence errors — delete the leftover import instead.

- [ ] **Step 6: Smoke URLs (reuse Next on :3001; do not start a second `pnpm dev`)**

```bash
curl -sI http://localhost:3001/ | tr -d '\r' | head -n 20
curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/app
```

Expected: `/` is `307`/`308` to `/app` (or `200` after follow). `/app` is `200`, not `500`. HTML must not contain `LangChain + Next.js Template` or `🏴‍☠️ Chat`.

If Next is not running, start `pnpm dev` once, then curl.

- [ ] **Step 7: Commit**

```bash
git add -A
git status
```

Do not add `.env.local`, `.next/`, `node_modules/`, or `packages/app-builder-shared` content except the existing gitlink. Then:

```bash
git commit -m "SS-9974: remove LangChain template demos and unused packages"
```

---

## Execution notes

- Iframe smoke / ToolsApi `API_READY` is **out of scope**. Do not “fix handshake” in this plan.
- If `pnpm remove` fails because a package is not in `package.json`, continue; do not add it.
- Do not open a GitHub PR unless the human asks.
