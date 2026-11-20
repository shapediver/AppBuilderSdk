# AppBuilderSdk

Instructions for every coding agent (Claude Code, Cursor, Codex, Copilot). Keep this file tool-neutral; tool-specific notes go in that tool's file (`CLAUDE.md` for Claude Code).

## Repositories

- Two git repos: the root (`AppBuilderSdk`, usually on `development`) and `src/shared`, a separate clone of `AppBuilderShared`. Run shared git commands as `git -C src/shared ...`. The root commits only the shared pointer (`<KEY>: shared update`) plus app, tests and `public/`, after `src/shared` is committed.
- Shared code also runs in AppBuilderIJewel3D, which has no `@shapediver/viewer.viewport` / `viewer.features.*`. Before changing `src/shared`, read `src/shared/.cursor/rules/host-compat.mdc`.
- Path alias `@AppBuilderLib/...` → `src/shared/...`. FSD layers under `src/shared`: `shared/`, `entities/` (parameter, session, viewport), `features/`, `widgets/`, `pages/`.
- New worktree: `node scripts/agents/setup-worktree.mjs` copies the local files listed in `.worktreeinclude` from the main checkout, inits `src/shared` and writes `.vscode/settings.json`. Each agent tool runs it automatically (see "Agent config"); run it by hand if `src/shared` is empty. Check out `task/<KEY>` in both repos.
- `viewer.local.ts` can link `../Viewer`. Viewer bugs are fixed there and need a dev server restart. Run `pnpm install` when the installed viewer version differs from `package.json`.

## Git

- Branch `task/<KEY>`. Every commit message starts with the ticket (`SS-10004: ...`).
- `git checkout -- <file>` restores from the index. Use `git checkout HEAD -- <file>` when the file is staged.

## Line endings

The working tree is CRLF, git stores LF (`autocrlf`), and eslint enforces `linebreak-style: CRLF`. Edit with your tool's file edit tool. `sed -i` and plain Python writes produce LF and hundreds of lint errors, and Prettier (`endOfLine: auto`) does not repair them. In Python, write with `newline=''` and `\r\n`.

## Checks (changed files only)

- Format: `npx prettier --write <files>` (also organizes imports). Some untouched tests already fail `prettier --check`; ignore those.
- Lint: `npx eslint <files>`
- Typecheck: `npx tsc --noEmit -p .` at the root (covers `src/shared`). IDE lints are no substitute. Always run it after changing `forwardRef` type parameters or host elements (`svg` vs `img`), or spreading a `ref` onto a third-party component. Don't spread a union-typed `ref` onto a component that accepts one host type; narrow the ref at each host.
- Unit test: `npx jest --config jest.config.mjs <path>`. Tests live in `__tests__` next to the module; store tests need the `jsdom` environment header.
- `jest.mock` replaces all exports. When you add a named export, find the suites that `jest.mock` that module, keep the real exports with `...jest.requireActual(...)`, and run those suites too (or `pnpm test`, which CI runs).
- E2E: `e2e-testing` skill (user level). Never the whole suite. Don't deploy or rerun e2e unless asked or the `implement` or `spec` skill runs it.

## Browser

- Don't edit `src/` while a browser run is active: HMR reloads the page.
- Debugging UI, selection or interaction: `browser-diagnosis` skill.

## Don't read

`dist/`, `playwright-report/`, `test-results/` (except your own scratch drivers), typedoc output, `pnpm-lock.yaml`, `.env*`.

## Agent config

All content is tool-neutral and lives in `AGENTS.md`, `.agents/`, `.worktreeinclude` and `scripts/agents/`. Files under `.claude/`, `.cursor/` and `.codex/` are only hook adapters, plus `.cursor/BUGBOT.md` for the Bugbot PR reviewer, which reads only that file.

| Concern           | Content (edit this)                                      | Adapters                                                                                     |
| ----------------- | -------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| Repo instructions | `AGENTS.md`                                              | `CLAUDE.md` imports it; Cursor, Codex and Copilot read it directly                           |
| Topic rules       | `.agents/rules/<topic>.md`                               | None: the list below is the only index                                                       |
| Skills            | `.agents/skills/<name>/SKILL.md`                         | None: Cursor, Codex and Copilot discover them; others use the list below                     |
| Worktree setup    | `.worktreeinclude` + `scripts/agents/setup-worktree.mjs` | `.claude/settings.json`, `.cursor/hooks.json`, `.cursor/worktrees.json`, `.codex/hooks.json` |

- New or renamed rule or skill: add the file in `.agents/` and its line in the matching list below. Don't add tool-specific rule or skill files.
- Don't `@`-import rules or skills: Claude Code expands `@` imports at session start, which loads all of them into every session.

Edit a topic rule only to record a recurring agent mistake that is not written yet (a wrong assumption about a store, a driver or a root cause). No ticket notes, example paths, coordinates or restatements of a change. Don't add feature notes to this file.

### Skills

Procedures. When a task matches, read the skill's `SKILL.md` and follow it (skip this if your tool already loaded it as a skill).

- `.agents/skills/browser-diagnosis/SKILL.md`: Reproduce and diagnose App Builder behavior in a browser — dev server and slugs, throwaway Playwright drivers, window.SDV, counting PUT computations, finding who committed a value. Use when debugging UI, selection or interaction.
- `.agents/skills/custom-component/SKILL.md`: Create or change a React component that reads style props from the Mantine theme (useProps / usePropsAppBuilder, useCustomTheme.ts registration, @docAttached tags, pnpm run docs). Use when adding a component or changing its theme-controlled props.
- `.agents/skills/fsd-migrate/SKILL.md`: Move files into the Feature Sliced Design layers under src/shared (shared, entities, features, widgets, pages), updating every import. Shows a migration plan and waits for confirmation. Use when asked to migrate or move components, hooks or types between FSD layers.

### Topic rules

Before changing a file that matches a rule's globs, or working on the area it describes, read that rule and follow it.

- `.agents/rules/accept-reject.md` (`**/AcceptReject*`, `**/acceptReject*`, `**/ViewportAcceptReject*`): Accept/reject presentation for pending parameter changes — global overlay vs inline controls. Apply when changing acceptRejectModePresentation or Accept/Reject buttons.
- `.agents/rules/appbuilder-action-slots.md` (`**/appBuilderActionSlots.ts`, `**/appbuilderActionSlots.ts`, `**/AppBuilderActionSlots.tsx`, `**/AppBuilderApplicationActionSlots.tsx`, `**/AppBuilderInteractionSlotListeners.tsx`, `**/actionSlots*`): App Builder action slots — UI and application events, custom events, selection/hover host listeners, and waitUntilReady. Apply when changing actionSlots or interaction slot listeners.
- `.agents/rules/appbuilder-actions.md` (`**/appBuilderActionCatalog.ts`, `**/appBuilderActionRun.ts`, `**/sharedAppBuilderActions.ts`, `**/appbuilderActions.ts`, `**/appbuilderActionsTypecheck.ts`, `**/appBuilderActionType.ts`, `**/AppBuilderAction*.tsx`, `**/AppBuilderRoot.tsx`, `**/runAppBuilderAction*`): App Builder action catalog, host overlay, and shared non-React action cores. Apply when changing actions, executeActions, camera/AR/fullscreen registration, or action-prop types.
- `.agents/rules/appbuilder-icons.md` (`**/shared/ui/icon/**`, `**/isIconImageUrl.ts`): App Builder icon values — Iconify names, image URLs, and inline Iconify objects. Apply when changing iconType, Icon, or toolbar button icons.
- `.agents/rules/e2e-playwright.md` (`tests/**`, `**/scenarioActions.ts`): Playwright e2e for App Builder — scenarios, snapshots, deploy skip, and when to add entries.
- `.agents/rules/ecommerce-tools-api.md` (`**/features/ecommerce/**`, `**/features/agent-tools/**`, `**/tests/fixtures/cross-window/**`, `**/ecommerceapi*`, `**/toolsApi*`): E-commerce connector and tools CrossWindow APIs. Apply when changing triggerAction, the tools client, addToCart, or the facades those APIs share with action cores.
- `.agents/rules/empty-containers.md` (`**/isContainerEmpty*`, `**/useAppBuilderStandardContainers*`, `**/useViewportAnchors*`, `**/pages/templates/**`, `**/viewport-anchor/**`): Containers which render nothing are not shown (laid out like absent ones, their nodes still rendered). Apply when changing the standard containers hook, the viewport anchors hook, the templates, the anchor container, or what text / controls widgets and interaction parameters render.
- `.agents/rules/mobile-fallback.md` (`**/AppBuilderTemplateSelector*`, `**/viewport-anchor/**`, `**/useViewportAnchors*`, `**/*mobileFallback*`, `**/*MobileFallback*`): Mobile fallback for containers and viewport anchors. Apply when changing mobileFallbacks, mobileBreakpoint, or anchor mobile layout.
- `.agents/rules/parameters-and-selection.md` (`**/entities/parameter/**`, `**/entities/session/**`, `**/entities/viewport/**`, `**/*[Ss]election*`, `**/*[Ii]nteraction*`, `**/*Toolbar*`, `**/useParameterComponentCommons*`): Parameter store, reset values, selection stack, interaction ownership, and toolbar. Apply when changing parameters, selection, session nodes, or interaction UI.
- `.agents/rules/shared-imports.md` (`src/shared/**/*.ts`, `src/shared/**/*.tsx`): Imports in src/shared - no index.ts barrels, @AppBuilderLib paths across slices, relative imports inside a slice. Apply when adding or changing imports in src/shared.
