# Zod-first Icon theme defaultProps Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make `Icon` theme `defaultProps` **Zod-first**: one schema defines JSON validation and TypeScript theme props; `themeComponentDefaultPropsRegistry` imports that schema instead of duplicating fields.

**Architecture:** Colocate in **`Icon.tsx`** (no separate schema file): export `IconThemeDefaultPropsSchema`, `type IconThemeDefaultProps = z.infer<typeof …>`, and `iconThemeDefaultStyleProps` via `IconThemeDefaultPropsSchema.parse(…)` (same values as today’s `defaultStyleProps` in `Icon.types.ts`). `IconThemeProps` uses `IconThemeDefaultProps`; `useIconProps` passes `iconThemeDefaultStyleProps` into `useProps("Icon", …)`. `features/appbuilder/config/themeComponentDefaultPropsRegistry.ts` imports `IconThemeDefaultPropsSchema` from `@AppBuilderLib/shared/ui/icon` (barrel re-export from `./Icon`) or from `@AppBuilderLib/shared/ui/icon/Icon` if you prefer a direct path. FSD: **features → shared** is allowed; `shared` must not import `features`.

**Tech Stack:** Zod 4, TypeScript, Jest (existing theme validation tests).

**Worktree:** Implement in **git submodule** `src/shared` (AppBuilderShared); then bump submodule pointer in parent repo if you work from the monorepo root.

---

## File map

| File | Action |
|------|--------|
| `src/shared/shared/ui/icon/Icon.tsx` | **Modify** — Add `import {z} from "zod"`; define `IconThemeDefaultPropsSchema`, `IconThemeDefaultProps`, `iconThemeDefaultStyleProps` near top (after imports, before preload list); `IconThemeProps(props: IconThemeDefaultProps)`; `useIconProps` uses `useProps("Icon", iconThemeDefaultStyleProps, props)`. Remove any obsolete imports of `defaultStyleProps` / `IconThemePropsType` from `./Icon.types`. |
| `src/shared/shared/ui/icon/Icon.types.ts` | **Modify** — Remove `defaultStyleProps` and `IconThemePropsType`; keep `IconProps`, `IconType`, `sizeMap`, `CustomCSSProperties`. |
| `src/shared/shared/ui/icon/index.ts` | **Modify** — Re-export `IconThemeDefaultPropsSchema`, `IconThemeDefaultProps`, `iconThemeDefaultStyleProps` from `./Icon` (named exports live next to default export in `Icon.tsx`). |
| `src/shared/features/appbuilder/config/themeComponentDefaultPropsRegistry.ts` | **Modify** — Replace inline `Icon: z.strictObject({…})` with `Icon: IconThemeDefaultPropsSchema` imported from `@AppBuilderLib/shared/ui/icon` (or `…/icon/Icon`). |
| `src/shared/features/appbuilder/config/validateAppBuilderSettingsJson.themeComponents.test.ts` | **Unchanged behavior** — run after refactor to confirm green. |

---

### Task 1: Colocate Zod-first theme in `Icon.tsx` + trim `Icon.types.ts`

**Files:**
- Modify: `src/shared/shared/ui/icon/Icon.types.ts`
- Modify: `src/shared/shared/ui/icon/Icon.tsx`

- [ ] **Step 1: Edit `Icon.types.ts`**

Remove:

```typescript
export const defaultStyleProps: Partial<IconProps> = {
	size: "1.5rem",
	stroke: "1px",
};
export type IconThemePropsType = Partial<IconProps>;
```

Keep `IconProps`, `IconType`, `sizeMap`, `CustomCSSProperties` unchanged.

- [ ] **Step 2: Edit `Icon.tsx`**

1. Add:

```typescript
import {z} from "zod";
```

2. After imports from `./Icon.types` (and before `PRELOAD_ICONS` / component logic), add:

```typescript
/**
 * Single source of truth for Icon theme `defaultProps` (Mantine theme + settings JSON validation).
 * Keys must stay aligned with `useProps("Icon", …)`.
 */
export const IconThemeDefaultPropsSchema = z.strictObject({
	size: z.union([z.string(), z.number()]).optional(),
	stroke: z.union([z.string(), z.number()]).optional(),
});

export type IconThemeDefaultProps = z.infer<typeof IconThemeDefaultPropsSchema>;

/** Defaults passed to `useProps`; validated so drift vs schema fails in tests/runtime. */
export const iconThemeDefaultStyleProps: IconThemeDefaultProps =
	IconThemeDefaultPropsSchema.parse({
		size: "1.5rem",
		stroke: "1px",
	});
```

3. Trim `./Icon.types` imports: drop `defaultStyleProps`, `IconThemePropsType`.

4. Replace `IconThemeProps`:

```typescript
export function IconThemeProps(
	props: IconThemeDefaultProps,
): MantineThemeComponent {
	return {
		defaultProps: props,
	};
}
```

5. Replace `useIconProps`:

```typescript
export function useIconProps(props: Partial<IconProps>): Partial<IconProps> {
	return useProps("Icon", iconThemeDefaultStyleProps, props);
}
```

- [ ] **Step 3: `tsc` (submodule)**

```bash
cd d:/projects/ShapeDiverCreateReactAppExample/src/shared && pnpm exec tsc --noEmit
```

Expected: **PASS**

- [ ] **Step 4: Commit (submodule)**

```bash
cd d:/projects/ShapeDiverCreateReactAppExample/src/shared
git add shared/ui/icon/Icon.types.ts shared/ui/icon/Icon.tsx
git commit -m "SS-9463: Zod-first Icon theme defaultProps in Icon.tsx"
```

---

### Task 2: Barrel exports + registry import

**Files:**
- Modify: `src/shared/shared/ui/icon/index.ts`
- Modify: `src/shared/features/appbuilder/config/themeComponentDefaultPropsRegistry.ts`

- [ ] **Step 1: Extend `index.ts`**

Re-export from `./Icon`:

```typescript
export {
	IconThemeDefaultPropsSchema,
	iconThemeDefaultStyleProps,
} from "./Icon";
export type {IconThemeDefaultProps} from "./Icon";
```

(If `index.ts` already default-exports `Icon`, keep that line; add the named re-exports alongside.)

- [ ] **Step 2: Slim registry**

```typescript
import {z} from "zod";
import {IconThemeDefaultPropsSchema} from "@AppBuilderLib/shared/ui/icon";

export const themeComponentDefaultPropsRegistry = {
	Icon: IconThemeDefaultPropsSchema,
} as const satisfies Record<string, z.ZodTypeAny>;
```

Update the registry file comment: **Icon schema is colocated in `shared/ui/icon/Icon.tsx` (Zod-first).**

If ESLint FSD rejects the barrel path, use `@AppBuilderLib/shared/ui/icon/Icon` for the schema import (grep the codebase for `@AppBuilderLib/shared/ui/icon` imports).

- [ ] **Step 3: Tests**

```bash
cd d:/projects/ShapeDiverCreateReactAppExample && pnpm exec jest src/shared/features/appbuilder/config/validateAppBuilderSettingsJson.themeComponents.test.ts --no-cache
```

Expected: **PASS** (2 tests).

- [ ] **Step 4: `tsc` from parent**

```bash
cd d:/projects/ShapeDiverCreateReactAppExample && pnpm exec tsc --noEmit
```

Expected: **PASS**

- [ ] **Step 5: Commit (submodule)**

```bash
cd d:/projects/ShapeDiverCreateReactAppExample/src/shared
git add shared/ui/icon/index.ts features/appbuilder/config/themeComponentDefaultPropsRegistry.ts
git commit -m "SS-9463: registry imports Icon schema from shared barrel"
```

---

### Task 3: Parent repo submodule pointer (if applicable)

- [ ] **From monorepo root**

```bash
cd d:/projects/ShapeDiverCreateReactAppExample
git add src/shared
git commit -m "SS-9463: bump shared submodule (Zod-first Icon in Icon.tsx)"
```

---

## Plan self-review

| Requirement | Task |
|-------------|------|
| Schema primary, type `z.infer` | Task 1 (`Icon.tsx`) |
| No separate `Icon.theme.schema.ts` | Architecture + Task 1 |
| No duplicate field definitions in registry | Task 2 |
| `useProps("Icon", defaults, …)` unchanged semantically | Task 1 (`parse` same values as old defaults) |
| FSD boundaries | Registry imports **down** into shared only |
| JSON validation unchanged | Same Zod object reference in registry |

**Placeholder scan:** none.

---

## Execution handoff

Plan saved to `docs/superpowers/plans/2026-05-11-zod-first-icon-theme-defaultprops.md`.

**1. Subagent-Driven** — one subagent per task above + reviews.  
**2. Inline** — implement Tasks 1–2 in order in one session.

After merge, **optional follow-up:** document the same pattern for the next component (e.g. `ExportButtonComponent`) in `custom-component.mdc` or team wiki.
