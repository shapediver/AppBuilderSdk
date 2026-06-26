# Mantine 8 → 9 Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]` / `- [ ]`) syntax for tracking.

**Goal:** Upgrade `@mantine/*` from 8.3.14 to 9.4.0 with v8 visual parity in a **single minimal PR**.

**Architecture:** Parent `package.json` + `src/shared` submodule (runtime, theme, mantine-props). TypeDoc plugin tweaks in parent `typedoc/` only where Mantine 9 breaks doc-flat generation.

**Tech Stack:** React 19.2, Mantine 9.4, recharts 3, Zod 4, ts-to-zod mantine-props pipeline.

**Spec:** `docs/superpowers/specs/2026-06-26-mantine-v9-migration-design.md`  
**Guide:** https://mantine.dev/guides/8x-to-9x/  
**Branch:** `task/SS-9823-mantine-v9`  
**Commits:** `SS-9823: <description>`

---

## Scope policy (updated 2026-06-26)

**In scope:** dependency bump, mechanical Mantine 9 API fixes, `tsc`, mantine-props mirrors + `generate:mantine-props-zod`, `pnpm run docs` + committed `public/doc-flat.json`, v8 visual pins, TypeDoc `MantineStyleProps` allowlist.

**Explicitly out of scope for this PR** (do not add or re-introduce):

| Area | Reason |
| ---- | ------ |
| Jest mocks (`tests/mocks/*`), `tests/jest.setup.ts` | Not part of Mantine migration; reverted in `e1de809` |
| Renaming / rewriting `src/ExampleBase.test.tsx` → `HomePage.test.tsx` | Test must stay as before migration |
| Changes to `jest.config.mjs`, `tsconfig.jest.json` beyond pre-migration baseline | Same |
| `pnpm run check:doc-flat`, `scripts/check-doc-flat-artifacts.mjs`, `docFlatArtifacts.test.ts` | Separate infra task (SS-9298 / SS-9463); removed from PR |
| Vite dev validation plugin (`vite/appBuilderDevValidationPlugin.ts`) | Scope creep |
| `reportAppBuilderValidationError` + wiring in `parseAppBuilderJson` | Scope creep; removed from submodule |
| ESLint / test-infra churn unrelated to Mantine | Keep diffs minimal |

**Known limitation:** `pnpm test` may fail on `ExampleBase.test.tsx` and some validation suites (ESM `uuid@14` via viewer) without Jest mocks. That is **accepted** for this PR — do not fix by adding mocks or changing the smoke test.

**E2E:** Task 7 blocked until `.env.platform-access` with `PLATFORM_CLIENT_ID` and testing-account tokens is available.

---

## Progress summary

| Task | Status |
| ---- | ------ |
| 1 — Bump deps | Done (`a1f0e89`) |
| 2 — API renames | Done (`22b6074`) |
| 3 — TypeScript | Done (`697191c`) |
| 4 — mantine-props | Done (`c8ae5ec`) |
| 5 — Docs + doc-flat | Done (`a92c2fa`); `check:doc-flat` **removed** from scope |
| 6 — Visual pins | Done (`af36f3d`) |
| 7 — E2E | Blocked (credentials) |
| Cleanup — revert Jest/test infra | Done (`e1de809`) |
| Cleanup — remove `check:doc-flat` | Done (this commit) |

---

### Task 1: Bump Mantine + recharts dependencies

**Files:**
- Modify: `package.json` (root)

- [x] **Step 1:** Set all `@mantine/*` to `9.4.0`
- [x] **Step 2:** Add explicit `"recharts": "^3.0.0"` to dependencies
- [x] **Step 3:** Run `pnpm install`
- [x] **Step 4:** Commit: `SS-9823: bump @mantine/* to 9.4.0 and add recharts 3`

---

### Task 2: Mechanical API renames (pre-tsc sweep)

**Files:**
- Modify: `src/shared/entities/parameter/ui/DrawingOptionsComponent.tsx`
- Modify: `src/shared/shared/ui/svg/Svg.tsx`

- [x] **Step 1:** `DrawingOptionsComponent` — `Collapse in={...}` → `expanded={...}`
- [x] **Step 2:** `Svg.tsx` — replace deep `@mantine/core/lib/...` import with public `MantineSize`
- [x] **Step 3:** Grep `color=` on `<Text` / `<Anchor` — fix where needed (`Button`/`Badge` `color` stays)
- [x] **Step 4:** Submodule + parent pointer commits

---

### Task 3: Fix TypeScript compile errors

**Files:** Whatever `tsc` reports (submodule + parent)

- [x] **Step 1:** `pnpm exec tsc --noEmit` — fix until exit 0
- [x] **Step 2:** Priority: chart widgets, `useCustomTheme.ts`, `AppShell` types, hook type renames, `SelectDropDownComponent`, `MarkdownWidgetComponent`, `fontWeights` in appbuildertypecheck
- [ ] **Step 3:** `pnpm test` — **not a merge gate** for this PR; do not add mocks or change `ExampleBase.test.tsx` to make it green
- [x] **Step 4:** Submodule + parent pointer commits

---

### Task 4: Update mantine-props mirrors + regenerate

**Files:**
- Modify: `src/shared/shared/mantine-props/*.schema-input.ts` as needed
- Modify: `src/shared/shared/mantine-props/assert-mantine-subset.test-d.ts`
- Generated: `src/shared/shared/mantine-props/*.zod.ts`

- [x] **Step 1:** Fix subset assert failures
- [x] **Step 2:** Update schema-input for Mantine 9 prop changes (incl. `themeOverride.schema-input.ts`)
- [x] **Step 3:** `pnpm run generate:mantine-props-zod`
- [x] **Step 4:** No `z.any()` in production mantine-props schemas
- [x] **Step 5:** Submodule commit

---

### Task 5: Docs + doc-flat regeneration

**Files:**
- Generated: `public/doc-flat.json`, `public/doc-nested.json`
- Modify (parent): `typedoc/typedoc-plugin-config-filter/tsTypeResolver.ts`, `typeDefinitions.ts`

- [x] **Step 1:** `pnpm run docs` — commit regenerated artifacts
- [x] **Step 2:** TypeDoc — add `isMantineTsExpandAllowlisted` for `MantineStyleProps` (>50 props in Mantine 9; prevents opaque stubs and broken `$ref` for `fz` etc.)
- [x] **Step 3:** `pnpm test -- validateAppBuilderSettingsJson themeRegistryDocParity` (when Jest env allows)
- [ ] **Step 4:** ~~`pnpm run check:doc-flat`~~ — **out of scope**; use separate SS-9298 pipeline when needed

**Do not add:** `scripts/check-doc-flat-artifacts.mjs`, `check:doc-flat` npm script, `docFlatArtifacts.test.ts`.

---

### Task 6: v8 visual parity pins

**Files:**
- Modify: `src/shared/shared/ui/theme/useCustomTheme.ts`
- Create: `src/shared/shared/ui/theme/mergeCssVariablesResolvers.ts`
- Modify: `src/AppBuilderBase.tsx`, `src/LibraryBase.tsx`, `src/ExampleBase.tsx`

- [x] **Step 1:** `mergeCssVariablesResolvers` + compose `v8CssVariablesResolver` with AppBuilder resolver
- [x] **Step 2:** `pauseResetOnHover="notification"` on all `<Notifications>` (3 files)
- [x] **Step 3:** Keep `defaultRadius: "md"` and `defaultFontWeightMedium: "500"` explicit in `createTheme`
- [x] **Step 4:** `pnpm exec tsc --noEmit`
- [x] **Step 5:** Submodule + parent commits

---

### Task 7: E2E snapshots (optional / blocked)

**Files:** `tests/**` Playwright snapshots

**Blocked:** missing `.env.platform-access` (`PLATFORM_CLIENT_ID`, testing-account tokens).

- [ ] **Step 1:** `pnpm test-e2e` — when credentials available
- [ ] **Step 2:** Update snapshots only for expected visual-neutral changes
- [ ] **Step 3:** Commit if snapshots changed

Manual QA per design spec checklist remains recommended even if E2E is skipped.

---

## Final verification (PR merge gate)

```bash
pnpm run generate:mantine-props-zod
pnpm run docs
pnpm exec tsc --noEmit
```

Optional (may fail without Jest mocks — not blocking):

```bash
pnpm test -- validateAppBuilderSettingsJson themeRegistryDocParity
pnpm test-e2e   # requires .env.platform-access
```

**Diff hygiene vs `main` / pre-migration (`8f20c04`):** no changes to `jest.config.mjs`, `tsconfig.jest.json`, `src/ExampleBase.test.tsx`, or `tests/mocks/`; no `check:doc-flat` script.

---

## Commit map (branch `task/SS-9823-mantine-v9`)

| Commit | Description |
| ------ | ----------- |
| `211d834` | Design spec |
| `a1f0e89` | Mantine 9.4 + recharts 3 |
| `22b6074` | Submodule API renames |
| `697191c` | Submodule tsc fixes |
| `c033e7b` | TypeDoc `MantineStyleProps` allowlist (+ jest changes **superseded** by `e1de809`) |
| `c8ae5ec` | mantine-props mirrors |
| `a92c2fa` | docs regen (+ check script **removed** from final scope) |
| `af36f3d` | v8 visual pins |
| `b7efda7` | Partially superseded — jest/eslint churn reverted in `e1de809` |
| `e1de809` | Revert Jest mocks, HomePage test rename, docFlatArtifacts test |
| *(this commit)* | Remove `check:doc-flat` script; update plan scope policy |
