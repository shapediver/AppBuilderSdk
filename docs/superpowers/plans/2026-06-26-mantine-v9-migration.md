# Mantine 8 → 9 Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Upgrade `@mantine/*` from 8.3.14 to 9.4.0 with v8 visual parity and green validation pipeline.

**Architecture:** Phased PRs — deps+compile → mantine-props/docs → visual pins+e2e. Code in `src/shared` submodule + parent `package.json`.

**Tech Stack:** React 19.2, Mantine 9.4, recharts 3, Zod 4, ts-to-zod mantine-props pipeline.

**Spec:** `docs/superpowers/specs/2026-06-26-mantine-v9-migration-design.md`  
**Guide:** https://mantine.dev/guides/8x-to-9x/  
**Branch:** `task/SS-9823-mantine-v9`  
**Commits:** `SS-9823: <description>`

---

### Task 1: Bump Mantine + recharts dependencies

**Files:**
- Modify: `package.json` (root)

- [ ] **Step 1:** Set all `@mantine/*` to `9.4.0`:
  - `@mantine/carousel`, `@mantine/charts`, `@mantine/core`, `@mantine/form`, `@mantine/hooks`, `@mantine/notifications`
- [ ] **Step 2:** Add explicit `"recharts": "^3.0.0"` to dependencies (`@mantine/charts` peer)
- [ ] **Step 3:** Run `pnpm install`
- [ ] **Step 4:** Commit parent repo only:

```bash
git add package.json pnpm-lock.yaml
git commit -m "$(cat <<'EOF'
SS-9823: bump @mantine/* to 9.4.0 and add recharts 3

EOF
)"
```

---

### Task 2: Mechanical API renames (pre-tsc sweep)

**Files:**
- Modify: `src/shared/entities/parameter/ui/DrawingOptionsComponent.tsx`
- Modify: `src/shared/shared/ui/svg/Svg.tsx`
- Audit: grep `color=` on `<Text` / `<Anchor` / theme defaultProps

- [ ] **Step 1:** `DrawingOptionsComponent` — `Collapse in={...}` → `expanded={...}`
- [ ] **Step 2:** `Svg.tsx` — replace deep import `@mantine/core/lib/core/MantineProvider/theme.types` with public `MantineSize` from `@mantine/core` (or local type if needed)
- [ ] **Step 3:** Grep and fix `Text`/`Anchor` `color` prop → `c` where applicable (Button/Badge `color` stays)
- [ ] **Step 4:** Commit in submodule:

```bash
cd src/shared
git add -A
git commit -m "SS-9823: mechanical Mantine 9 API renames"
cd ../..
git add src/shared
git commit -m "SS-9823: bump shared submodule for Mantine 9 API renames"
```

---

### Task 3: Fix TypeScript compile errors

**Files:** Whatever `tsc` reports (~130 files may need touches)

- [ ] **Step 1:** Run `pnpm exec tsc --noEmit` from repo root, capture errors
- [ ] **Step 2:** Fix errors in priority order: chart widgets, `useCustomTheme.ts`, `AppShell` types, hook type renames
- [ ] **Step 3:** Re-run until `pnpm exec tsc --noEmit` exits 0
- [ ] **Step 4:** Run `pnpm test` — fix failures caused by upgrade
- [ ] **Step 5:** Commit submodule + parent pointer:

```bash
cd src/shared && git add -A && git commit -m "SS-9823: fix TypeScript errors for Mantine 9"
cd ../.. && git add src/shared && git commit -m "SS-9823: update shared submodule after Mantine 9 tsc fixes"
```

---

### Task 4: Update mantine-props mirrors + regenerate

**Files:**
- Modify: `src/shared/shared/mantine-props/*.schema-input.ts` as needed
- Modify: `src/shared/shared/mantine-props/assert-mantine-subset.test-d.ts`
- Generated: `src/shared/shared/mantine-props/*.zod.ts`

- [ ] **Step 1:** From repo root: `pnpm exec tsc --noEmit` — fix subset assert failures first
- [ ] **Step 2:** Update schema-input for prop renames (`color`→`c` on text/anchor mirrors if present)
- [ ] **Step 3:** `pnpm run generate:mantine-props-zod`
- [ ] **Step 4:** `rg "z\.any\(\)" src/shared/shared/mantine-props/` — must be empty in production schemas
- [ ] **Step 5:** Commit submodule:

```bash
cd src/shared
git add shared/mantine-props/
git commit -m "SS-9823: update mantine-props mirrors for Mantine 9"
```

---

### Task 5: Docs + doc-flat validation

**Files:** Generated `public/doc-flat.json` (if committed), TypeDoc outputs

- [ ] **Step 1:** `pnpm run docs`
- [ ] **Step 2:** `pnpm run check:doc-flat`
- [ ] **Step 3:** `pnpm test -- validateAppBuilderSettingsJson themeRegistryDocParity`
- [ ] **Step 4:** Commit submodule + parent as needed

---

### Task 6: v8 visual parity pins

**Files:**
- Modify: `src/shared/shared/ui/theme/useCustomTheme.ts`
- Modify: `src/AppBuilderBase.tsx`, `src/LibraryBase.tsx`, `src/ExampleBase.tsx`
- Create (if needed): `src/shared/shared/ui/theme/mergeCssVariablesResolvers.ts`

- [ ] **Step 1:** Add `mergeCssVariablesResolvers` helper and compose `v8CssVariablesResolver` with existing AppBuilder resolver
- [ ] **Step 2:** Add `pauseResetOnHover="notification"` to all `<Notifications>` (3 files)
- [ ] **Step 3:** Confirm `defaultRadius: "md"` and `defaultFontWeightMedium: "500"` remain explicit in `createTheme`
- [ ] **Step 4:** `pnpm exec tsc --noEmit && pnpm test`
- [ ] **Step 5:** Commit submodule + parent

---

### Task 7: E2E snapshots (if needed)

**Files:** `tests/**` Playwright snapshots

- [ ] **Step 1:** `pnpm test-e2e` — review failures
- [ ] **Step 2:** Update snapshots only for expected visual-neutral changes; document unexpected diffs
- [ ] **Step 3:** Commit if snapshots changed

---

## Final verification

```bash
pnpm run generate:mantine-props-zod
pnpm run docs && pnpm run check:doc-flat
pnpm exec tsc --noEmit
pnpm test
pnpm test-e2e
```
