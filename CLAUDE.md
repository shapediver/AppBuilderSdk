# AppBuilderSdk

## Repositories

- Two git repos: the root (`AppBuilderSdk`, usually on `development`) and `src/shared`, a separate clone of `AppBuilderShared`. Run shared git commands as `git -C src/shared ...`. The root commits only the shared pointer ("shared update") plus app, tests and `public/`, after `src/shared` is committed.
- Shared code also runs in AppBuilderIJewel3D. `src/shared/CLAUDE.md` loads its host rules when you work there.
- New worktree: a SessionStart hook inits `src/shared` and writes `.vscode/settings.json`. Check out `task/<KEY>` in both repos.
- `viewer.local.ts` can link `../Viewer`. Viewer bugs are fixed there and need a dev server restart. Run `pnpm install` when the installed viewer version differs from `package.json`.

## Git

- Branch `task/<KEY>`. Every commit message starts with the ticket (`SS-10004: ...`).
- `git checkout -- <file>` restores from the index. Use `git checkout HEAD -- <file>` when the file is staged.

## Line endings

The working tree is CRLF, git stores LF (`autocrlf`), and eslint enforces `linebreak-style: CRLF`. Edit with the Edit/Write tools. `sed -i` and plain Python writes produce LF and hundreds of lint errors, and Prettier (`endOfLine: auto`) does not repair them. In Python, write with `newline=''` and `\r\n`.

## Checks (changed files only)

- Format: `npx prettier --write <files>` (also organizes imports). Some untouched tests already fail `prettier --check`; ignore those.
- Lint: `npx eslint <files>`
- Typecheck: `npx tsc --noEmit -p .` at the root (covers `src/shared`). Always run it after changing `forwardRef` type parameters or host elements (`svg` vs `img`), or spreading a `ref` onto a third-party component. Don't spread a union-typed `ref` onto a component that accepts one host type; narrow the ref at each host.
- Unit test: `npx jest --config jest.config.mjs <path>`. Tests live in `__tests__` next to the module; store tests need the `jsdom` environment header.
- `jest.mock` replaces all exports. When you add a named export, find the suites that `jest.mock` that module, keep the real exports with `...jest.requireActual(...)`, and run those suites too (or `pnpm test`, which CI runs).
- E2E: `e2e-testing` skill. Never the whole suite. Don't deploy or rerun e2e unless asked.

## Browser

- Don't edit `src/` while a browser run is active: HMR reloads the page.
- Debugging UI, selection or interaction: `browser-diagnosis` skill.

## Don't read

`dist/`, `playwright-report/`, `test-results/` (except your own scratch drivers), typedoc output, `pnpm-lock.yaml`, `.env*`.

## Agent rules

Topic rules live in `.claude/rules/` and load with the files they cover; `.cursor/rules/` is a frozen copy for Cursor users. Edit a topic rule only to record a recurring agent mistake that is not written yet (a wrong assumption about a store, a driver or a root cause). No ticket notes, example paths, coordinates or restatements of a change. Don't add feature notes to this file.
