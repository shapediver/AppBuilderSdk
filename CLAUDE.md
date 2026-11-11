# AppBuilderSdk

@.cursor/rules/appbuilder-sdk.mdc

## Commands (changed files only)
- Format: `npx prettier --write <files>` (also organizes imports)
- Lint: `npx eslint <files>`
- Typecheck: `npx tsc --noEmit -p .` (root, also covers `src/shared`)
- Unit test: `npx jest --config jest.config.mjs <path>`. If you changed a module that other suites `jest.mock`, run those suites too.
- E2E: `e2e-testing` skill. Never the whole suite. Don't deploy unless asked.

## Don't read
`dist/`, `playwright-report/`, `test-results/`, `typedoc/` output, `pnpm-lock.yaml`, `.env*`.

## Topic rules: read the file before touching that area
The rules live in `.cursor/rules/` and are shared with Cursor; update them there.

| Area | Rule |
|---|---|
| Accept/Reject buttons, `acceptRejectModePresentation` | `accept-reject.mdc` |
| `actionSlots`, selection/hover slot listeners, `waitUntilReady` | `appbuilder-action-slots.mdc` |
| Action catalog, `executeActions`, camera/AR/fullscreen registration | `appbuilder-actions.mdc` |
| `iconType`, `Icon`, toolbar icons (`shared/ui/icon/`) | `appbuilder-icons.mdc` |
| Debugging UI, selection, or interaction in the browser | `browser-diagnosis.mdc` |
| New or changed React components (useProps + Mantine theme) | `custom-component.mdc` |
| Anything under `tests/` | `e2e-playwright.mdc` |
| `triggerAction`, tools client, `addToCart` (`features/ecommerce/`) | `ecommerce-tools-api.mdc` |
| Empty containers, viewport anchors, templates | `empty-containers.mdc` |
| Moving files between FSD layers in `src/shared` | `fsd.mdc` |
| `mobileFallbacks`, `mobileBreakpoint` | `mobile-fallback.mdc` |
| Parameters, selection, session nodes, interaction UI (21 KB: grep for the section, don't read it all) | `parameters-and-selection.mdc` |
| New worktree setup | `worktree-shared-repo.mdc` |
| Anything under `src/shared` (must also work in AppBuilderIJewel3D) | `src/shared/.cursor/rules/host-compat.mdc` |
