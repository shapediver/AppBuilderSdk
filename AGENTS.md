# AppBuilder

## Project origin

The directory `src/shared` is a **Git submodule** pointing at [AppBuilderShared](https://github.com/shapediver/AppBuilderShared) (`git@github.com:shapediver/AppBuilderShared.git`).

## AppBuilderShared source of truth (SS-9974)

**This checkout is the source of truth:** `ShapeDiverCreateReactAppExample/src/shared`.

- Author all AppBuilderShared work here (`features/agent-tools`, WebMCP, `ToolsApi`, tests). Branch `task/SS-9974` (or the current task branch) lives in this submodule.
- GitHub remote is still [AppBuilderShared](https://github.com/shapediver/AppBuilderShared). Push/PR from **this** `src/shared`, not from a copy.
- [AppBuilderAgent](https://github.com/shapediver/AppBuilderAgent) also vendors the same repo as `packages/app-builder-shared`. That path is a **consumer gitlink** (often detached / stale). Do not commit Shared changes there.
- After Shared commits: bump the gitlink in this parent repo. Optionally bump AppBuilderAgent’s `packages/app-builder-shared` to the same SHA so it matches truth — never the other way around.
- If a SHA exists only under AppBuilderAgent’s submodule, cherry-pick or merge it into `ShapeDiverCreateReactAppExample/src/shared` first.

## Git workflow

- **Branches:** Create work for each task on a branch named `task/SS-{task_number}-{task_name}` (replace `{task_number}` and `{task_name}` with the real values; use a short, kebab-case task name).
- **Commits:** Use messages in the form `SS-{task_number}: {commit_name}` (a concise description after the colon).
- **Pull requests:** The user creates pull requests. Do not open PRs unless explicitly asked.

## Jira (Atlassian MCP)

If the user's message contains text in the form `SS-{number}` (a Jira issue key for this project), fetch the task description from Jira using the **Atlassian MCP** before planning or implementing the work, so scope and requirements match the ticket.

## Unit tests

- **Runner:** Jest (`pnpm test`), config in `jest.config.mjs`, TypeScript via `tsconfig.jest.json`.
- **Location:** Place unit tests in a `__tests__` folder next to the code under test (not beside the source file).
  - Example: `src/shared/features/appbuilder/model/agentResponseSchema.ts` → `src/shared/features/appbuilder/model/__tests__/agentResponseSchema.test.ts`
  - Example: `src/shared/features/appbuilder/config/parseAppBuilderJson.ts` → `src/shared/features/appbuilder/config/__tests__/parseAppBuilderJson.test.ts`
- **Imports:** Use relative imports from the parent folder (`../moduleUnderTest`), matching existing tests in `src/shared/features/appbuilder/**/__tests__/`.
- **Fixtures:** Shared test data and helpers for a feature area live under that area's `__tests__/` (e.g. `__tests__/__fixtures__/`, `*.helpers.ts`).
- **Submodule:** Tests for `src/shared` code belong in the AppBuilderShared submodule so they are shared across App Builder repos.

## Dev server

Before `pnpm run start`, confirm Vite is not already running on port 3000 (check IDE terminals or `http://localhost:3000`). Reuse an existing server; do not start a duplicate.
