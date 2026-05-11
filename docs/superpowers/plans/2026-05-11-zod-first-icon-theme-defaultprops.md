# Zod-first Icon theme defaultProps Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make `Icon` theme `defaultProps` **Zod-first**: one schema defines JSON validation and TypeScript theme props; `themeComponentDefaultPropsRegistry` imports that schema instead of duplicating fields.

**Architecture:** Add `Icon.theme.schema.ts` in `shared/ui/icon` exporting `IconThemeDefaultPropsSchema`, `type IconThemeDefaultProps = z.infer<typeof …>`, and `iconThemeDefaultStyleProps` produced via `IconThemeDefaultPropsSchema.parse(…)` (same values as today’s `defaultStyleProps`). `Icon.tsx` / `IconThemeProps` use the inferred type. `features/appbuilder/config/themeComponentDefaultPropsRegistry.ts` imports the schema from `@AppBuilderLib/shared/ui/icon/Icon.theme.schema` (or barrel export). FSD: **features → shared** is allowed; `shared` must not import `features`.

**Tech Stack:** Zod 4, TypeScript, Jest (existing theme validation tests).

**Worktree:** Implement in **git submodule** `src/shared` (AppBuilderShared); then bump submodule pointer in parent repo if you work from the monorepo root.

---

## File map

| File | Action |
|------|--------|
| `src/shared/shared/ui/icon/Icon.theme.schema.ts` | **Create** — `IconThemeDefaultPropsSchema`, `IconThemeDefaultProps`, `iconThemeDefaultStyleProps`. |
| `src/shared/shared/ui/icon/Icon.types.ts` | **Modify** — Remove `defaultStyleProps` and `IconThemePropsType`; keep `IconProps`, `IconType`, `sizeMap`, `CustomCSSProperties`. |
| `src/shared/shared/ui/icon/Icon.tsx` | **Modify** — Import `iconThemeDefaultStyleProps` + `IconThemeDefaultProps` from `./Icon.theme.schema`; wire `IconThemeProps(props: IconThemeDefaultProps)`; `useIconProps` continues to use `useProps("Icon", iconThemeDefaultStyleProps, props)`. |
| `src/shared/shared/ui/icon/index.ts` | **Modify** — Re-export `IconThemeDefaultPropsSchema`, `IconThemeDefaultProps`, `iconThemeDefaultStyleProps` (only what the registry or consumers need; minimum: schema + type). |
| `src/shared/features/appbuilder/config/themeComponentDefaultPropsRegistry.ts` | **Modify** — Replace inline `Icon: z.strictObject({…})` with `Icon: IconThemeDefaultPropsSchema` from `@AppBuilderLib/shared/ui/icon` (path per project alias). |
| `src/shared/features/appbuilder/config/validateAppBuilderSettingsJson.themeComponents.test.ts` | **Unchanged behavior** — run after refactor to confirm green. |

---

### Task 1: Add `Icon.theme.schema.ts`

**Files:**
- Create: `src/shared/shared/ui/icon/Icon.theme.schema.ts`

- [ ] **Step 1: Create file**

```typescript
import {z} from "zod";

/**
 * Single source of truth for Icon theme `defaultProps` (Mantine theme + settings JSON validation).
 * Keys must stay aligned with `useProps("Icon", …)`.
 */
export const IconThemeDefaultPropsSchema = z.strictObject({
	size: z.union([z.string(), z.number()]).optional(),
	stroke: z.union([z.string(), z.number()]).optional(),
});

export type IconThemeDefaultProps = z.infer<typeof IconThemeDefaultPropsSchema>;

/** Defaults passed to `useProps`; validated against schema so drift fails at runtime/build tests. */
export const iconThemeDefaultStyleProps: IconThemeDefaultProps =
	IconThemeDefaultPropsSchema.parse({
		size: "1.5rem",
		stroke: "1px",
	});
```

- [ ] **Step 2: `tsc` in submodule**

```bash
cd d:/projects/ShapeDiverCreateReactAppExample/src/shared && pnpm exec tsc --noEmit
```

Expected: **PASS** (file unused until wired).

- [ ] **Step 3: Commit (submodule)**

```bash
cd d:/projects/ShapeDiverCreateReactAppExample/src/shared
git add shared/ui/icon/Icon.theme.schema.ts
git commit -m "SS-9463: add Zod-first Icon theme defaultProps schema"
```

---

### Task 2: Rewire `Icon.types.ts`, `Icon.tsx`

**Files:**
- Modify: `src/shared/shared/ui/icon/Icon.types.ts`
- Modify: `src/shared/shared/ui/icon/Icon.tsx`

- [ ] **Step 1: Edit `Icon.types.ts`**

Remove these lines (move concept to schema file):

```typescript
export const defaultStyleProps: Partial<IconProps> = {
	size: "1.5rem",
	stroke: "1px",
};
export type IconThemePropsType = Partial<IconProps>;
```

Keep `IconProps`, `IconType`, `sizeMap`, `CustomCSSProperties` unchanged.

- [ ] **Step 2: Edit `Icon.tsx` imports and `IconThemeProps`**

Replace imports from `./Icon.types`:

```typescript
import {
	CustomCSSProperties,
	IconProps,
	sizeMap,
} from "./Icon.types";
import {
	IconThemeDefaultProps,
	iconThemeDefaultStyleProps,
} from "./Icon.theme.schema";
```

Replace `IconThemeProps`:

```typescript
export function IconThemeProps(
	props: IconThemeDefaultProps,
): MantineThemeComponent {
	return {
		defaultProps: props,
	};
}
```

Replace `useIconProps`:

```typescript
export function useIconProps(props: Partial<IconProps>): Partial<IconProps> {
	return useProps("Icon", iconThemeDefaultStyleProps, props);
}
```

- [ ] **Step 3: `tsc`**

```bash
cd d:/projects/ShapeDiverCreateReactAppExample/src/shared && pnpm exec tsc --noEmit
```

Expected: **PASS**

- [ ] **Step 4: Commit**

```bash
git add shared/ui/icon/Icon.types.ts shared/ui/icon/Icon.tsx
git commit -m "SS-9463: Icon theme props from Zod schema (Zod-first)"
```

---

### Task 3: Barrel exports + registry import

**Files:**
- Modify: `src/shared/shared/ui/icon/index.ts`
- Modify: `src/shared/features/appbuilder/config/themeComponentDefaultPropsRegistry.ts`

- [ ] **Step 1: Extend `index.ts`**

Add exports (adjust if you prefer named-only):

```typescript
export {
	IconThemeDefaultPropsSchema,
	iconThemeDefaultStyleProps,
} from "./Icon.theme.schema";
export type {IconThemeDefaultProps} from "./Icon.theme.schema";
```

- [ ] **Step 2: Slim registry**

Replace inline Icon schema with:

```typescript
import {z} from "zod";
import {IconThemeDefaultPropsSchema} from "@AppBuilderLib/shared/ui/icon/Icon.theme.schema";

export const themeComponentDefaultPropsRegistry = {
	Icon: IconThemeDefaultPropsSchema,
} as const satisfies Record<string, z.ZodTypeAny>;
```

Keep the existing file header comment; add one line: **Icon schema is defined in `shared/ui/icon/Icon.theme.schema.ts` (Zod-first).**

If ESLint FSD complains about the import path, use the same path style as other `@AppBuilderLib/shared/ui/...` imports in `features/appbuilder` (grep for precedent).

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
git commit -m "SS-9463: registry imports Icon Zod-first schema"
```

---

### Task 4: Parent repo submodule pointer (if applicable)

- [ ] **From monorepo root**

```bash
cd d:/projects/ShapeDiverCreateReactAppExample
git add src/shared
git commit -m "SS-9463: bump shared submodule (Zod-first Icon theme schema)"
```

---

## Plan self-review

| Requirement | Task |
|-------------|------|
| Schema primary, type `z.infer` | Task 1 |
| No duplicate field definitions in registry | Task 3 |
| `useProps("Icon", defaults, …)` unchanged semantically | Task 1–2 (`parse` same values as old defaults) |
| FSD boundaries | Registry imports **down** into shared only |
| JSON validation unchanged | Same Zod object reference in registry |

**Placeholder scan:** none.

---

## Execution handoff

Plan saved to `docs/superpowers/plans/2026-05-11-zod-first-icon-theme-defaultprops.md`.

**1. Subagent-Driven** — one subagent per task above + reviews.  
**2. Inline** — implement Tasks 1–3 in order in one session.

After merge, **optional follow-up:** document the same pattern for the next component (e.g. `ExportButtonComponent`) in `custom-component.mdc` or team wiki.
