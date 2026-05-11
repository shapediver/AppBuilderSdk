# Zod-first Icon theme defaultProps Implementation Plan

> **Language:** This plan is **English-only** (including appendices).  
> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make `Icon` theme `defaultProps` **Zod-first**: one schema defines JSON validation and TypeScript theme props; `themeComponentDefaultPropsRegistry` imports that schema instead of duplicating fields.

**Architecture:** Colocate in **`Icon.types.ts`** (types + theme Zod in one place; no separate schema file): export `IconThemeDefaultPropsSchema`, `type IconThemeDefaultProps = z.infer<typeof …>`, and `iconThemeDefaultStyleProps` via `IconThemeDefaultPropsSchema.parse(…)` (same values as today’s `defaultStyleProps`). `Icon.tsx` imports those symbols from `./Icon.types`; `IconThemeProps` uses `IconThemeDefaultProps`; `useIconProps` passes `iconThemeDefaultStyleProps` into `useProps("Icon", …)`. `features/appbuilder/config/themeComponentDefaultPropsRegistry.ts` imports `IconThemeDefaultPropsSchema` from `@AppBuilderLib/shared/ui/icon` (barrel re-export from `./Icon.types`) or from `@AppBuilderLib/shared/ui/icon/Icon.types` if needed for FSD/lint. FSD: **features → shared** is allowed; `shared` must not import `features`. **Broader rule:** do **not** register strict per-component schemas for custom components whose theme props are mostly Mantine bags (`Partial<ButtonProps>`, nested `buttonProps`, etc.); see Appendix B — those stay opaque at the Mantine theme level.

**Rollout (registry-eligible only):** use **Option A — by layer (waves)** for any new per-component registry entries. **Wave 1:** `shared/ui`. **Wave 2:** `entities` and `features` (all FSD slices under those roots, **excluding** `entities/viewport`). **Wave 3:** `pages`, `entities/viewport`, and **`widgets`** when a theme key’s implementation lives only under `widgets`. Ambiguous **`AppBuilder*`** keys default to **Wave 3** with a verification note unless the owning slice is confirmed (see Appendix D). Detailed key lists: Appendix D.

**Tech Stack:** Zod 4, TypeScript, Jest (existing theme validation tests).

**Worktree:** Implement in **git submodule** `src/shared` (AppBuilderShared); then bump submodule pointer in parent repo if you work from the monorepo root.

---

## File map

| File | Action |
|------|--------|
| `src/shared/shared/ui/icon/Icon.types.ts` | **Modify** — Add `import {z} from "zod"`. Remove `defaultStyleProps` and `IconThemePropsType`. Add `IconThemeDefaultPropsSchema`, `IconThemeDefaultProps`, `iconThemeDefaultStyleProps` (after `IconProps` / related types so the file stays readable). Keep `IconProps`, `IconType`, `sizeMap`, `CustomCSSProperties`. |
| `src/shared/shared/ui/icon/Icon.tsx` | **Modify** — Import `IconThemeDefaultProps`, `iconThemeDefaultStyleProps` from `./Icon.types`; drop `defaultStyleProps` / `IconThemePropsType` imports; `IconThemeProps(props: IconThemeDefaultProps)`; `useIconProps` uses `useProps("Icon", iconThemeDefaultStyleProps, props)`. No `zod` import in `Icon.tsx`. |
| `src/shared/shared/ui/icon/index.ts` | **Modify** — Re-export `IconThemeDefaultPropsSchema`, `iconThemeDefaultStyleProps`, type `IconThemeDefaultProps` from `./Icon.types`. |
| `src/shared/features/appbuilder/config/themeComponentDefaultPropsRegistry.ts` | **Modify** — Replace inline `Icon: z.strictObject({…})` with `Icon: IconThemeDefaultPropsSchema` imported from `@AppBuilderLib/shared/ui/icon` (or `…/icon/Icon.types`). |
| `src/shared/features/appbuilder/config/validateAppBuilderSettingsJson.themeComponents.test.ts` | **Unchanged behavior** — run after refactor to confirm green. |

---

### Task 1: Zod-first theme in `Icon.types.ts` + wire `Icon.tsx`

**Files:**
- Modify: `src/shared/shared/ui/icon/Icon.types.ts`
- Modify: `src/shared/shared/ui/icon/Icon.tsx`

- [ ] **Step 1: Edit `Icon.types.ts`**

1. Add at top (after existing imports, before or after other imports as fits ESLint):

```typescript
import {z} from "zod";
```

2. Remove:

```typescript
export const defaultStyleProps: Partial<IconProps> = {
	size: "1.5rem",
	stroke: "1px",
};
export type IconThemePropsType = Partial<IconProps>;
```

3. After `IconProps` (and related types) are defined, append:

```typescript
/**
 * Single source of truth for Icon theme `defaultProps` (Mantine theme + settings JSON validation).
 * Keys must stay aligned with `useProps("Icon", …)`.
 */
export const IconThemeDefaultPropsSchema = z.strictObject({
	size: z.union([z.string(), z.number()]).optional(),
	stroke: z.string().optional(),
});

export type IconThemeDefaultProps = z.infer<typeof IconThemeDefaultPropsSchema>;

/** Defaults passed to `useProps`; validated so drift vs schema fails in tests/runtime. */
export const iconThemeDefaultStyleProps: IconThemeDefaultProps =
	IconThemeDefaultPropsSchema.parse({
		size: "1.5rem",
		stroke: "1px",
	});
```

(`stroke` stays `string` in Zod to match Iconify / `IconProps` TypeScript types.)

- [ ] **Step 2: Edit `Icon.tsx`**

1. Imports from `./Icon.types` should include `IconThemeDefaultProps`, `iconThemeDefaultStyleProps` and must **not** import `defaultStyleProps` or `IconThemePropsType`.

2. Replace `IconThemeProps`:

```typescript
export function IconThemeProps(
	props: IconThemeDefaultProps,
): MantineThemeComponent {
	return {
		defaultProps: props,
	};
}
```

3. Replace `useIconProps`:

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
git commit -m "SS-9463: Zod-first Icon theme defaultProps in Icon.types.ts"
```

---

### Task 2: Barrel exports + registry import

**Files:**
- Modify: `src/shared/shared/ui/icon/index.ts`
- Modify: `src/shared/features/appbuilder/config/themeComponentDefaultPropsRegistry.ts`

- [ ] **Step 1: Extend `index.ts`**

Re-export from `./Icon.types`:

```typescript
export {
	IconThemeDefaultPropsSchema,
	iconThemeDefaultStyleProps,
} from "./Icon.types";
export type {IconThemeDefaultProps} from "./Icon.types";
```

(Keep existing exports; add these alongside.)

- [ ] **Step 2: Slim registry**

```typescript
import {z} from "zod";
import {IconThemeDefaultPropsSchema} from "@AppBuilderLib/shared/ui/icon";

export const themeComponentDefaultPropsRegistry = {
	Icon: IconThemeDefaultPropsSchema,
} as const satisfies Record<string, z.ZodTypeAny>;
```

Update the registry file comment: **Icon schema lives in `shared/ui/icon/Icon.types.ts` (Zod-first).**

If ESLint FSD rejects the barrel path, use `@AppBuilderLib/shared/ui/icon/Icon.types` for the schema import.

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
git commit -m "SS-9463: registry imports Icon schema from Icon.types barrel"
```

---

### Task 3: Parent repo submodule pointer (if applicable)

- [ ] **From monorepo root**

```bash
cd d:/projects/ShapeDiverCreateReactAppExample
git add src/shared
git commit -m "SS-9463: bump shared submodule (Zod-first Icon in Icon.types.ts)"
```

---

## Plan self-review

| Requirement | Task |
|-------------|------|
| Schema primary, type `z.infer` | Task 1 (`Icon.types.ts`) |
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

After merge, **optional follow-up:** document the same pattern for the next **registry-eligible** component in `custom-component.mdc` or team wiki (see Appendix B policy), following **Appendix D** wave order (Option A).

---

## Appendix A — Reference: `theme.components` keys (`useCustomTheme` + `useProps`)

**Source:** keys under `components` in `useCustomTheme.ts` (what can be overridden from JSON as `themeOverrides.components.<Key>`), cross-checked with `useProps("…")` in code.

**JSON key rule:** the key must match the **first argument of `useProps`** for that style bundle. Example: file `MultiSelectCheckboxesComponent.tsx` but `useProps` string is **`"MultiSelectCheckboxes"`**; `useCustomTheme` uses **`MultiSelectCheckboxes`**. The validator registry must use the **`useProps` string** if you ever register that component.

### Alphabetical list (deduped)

| Theme / `useProps` key | Notes |
|------------------------|-------|
| `AppBuilderActionComponent` | |
| `AppBuilderAgentWidgetComponent` | |
| `AppBuilderAppShellTemplatePage` | |
| `AppBuilderContainer` | |
| `AppBuilderContainerWrapper` | |
| `AppBuilderGridTemplatePage` | |
| `AppBuilderHorizontalContainer` | |
| `AppBuilderImage` | |
| `AppBuilderTemplateSelector` | |
| `AppBuilderTextWidgetComponent` | |
| `AppBuilderVerticalContainer` | |
| `CreateModelStateHook` | |
| `DefaultSession` | |
| `DesktopClientPanel` | |
| `ExportButtonComponent` | |
| `ExportLabelComponent` | |
| `Icon` | In registry: Zod-first in `Icon.types.ts` |
| `LoaderPage` | |
| `MarkdownWidgetComponent` | |
| `ModalBase` | |
| `MultiSelectCheckboxes` | Do not confuse with the `.tsx` file name |
| `NotificationWrapper` | |
| `OutputChunkLabelComponent` | |
| `OutputStargateComponent` | |
| `ParameterColorComponent` | |
| `ParameterDraggingComponent` | |
| `ParameterGumballComponent` | |
| `ParameterLabelComponent` | |
| `ParameterSelectComponent` | |
| `ParameterSelectionComponent` | |
| `ParameterSliderComponent` | |
| `ParameterStargateComponent` | |
| `SelectCarouselComponent` | |
| `SelectColorComponent` | |
| `SelectGridComponent` | |
| `StargateInput` | |
| `StargateShared` | Second `useProps` inside `ExportButtonComponent` |
| `TooltipWrapper` | |
| `ViewportBranding` | |
| `ViewportComponent` | |
| `ViewportIconButton` | |
| `ViewportIconButtonDropdown` | |
| `ViewportIcons` | |
| `ViewportOverlayWrapper` | |

**Not in the table above:** `ParameterBooleanComponent` has `useProps("ParameterBooleanComponent", …)` but **no matching entry** in `useCustomTheme` today — theme JSON cannot target it via the same central `components` map until a theme entry is added.

---

## Appendix B — Registry validation policy and edge cases

### Policy (Mantine-heavy theme props)

**Do not** add `themeComponentDefaultPropsRegistry` entries for custom components whose theme `defaultProps` are mostly **Mantine prop bags** (e.g. `Partial<ButtonProps>`, `Partial<TooltipProps>`, nested `buttonProps` / `tooltipProps` trees). Describing each field in Zod duplicates Mantine and yields little value for JSON validation.

Those keys stay covered only by the generic `MantineThemeOverrideSchema` path (opaque JSON / structural checks), not by per-component strict schemas.

**Do** register Zod-first schemas only for components with a **small, app-owned surface** (primitives, enums, simple records) where JSON mistakes should fail fast — the pilot is **`Icon`**.

If a component mixes both (e.g. a few custom strings plus `buttonProps`), default is: **still skip registry** unless the team explicitly wants partial strictness for the custom slice only (split shape in code + docs).

### Edge cases (when you *do* extend the registry)

1. **Nested Mantine props** — if you ever register a Mantine-heavy component anyway, prefer a **thin** strict layer for app-owned keys only; do not model full `ButtonProps` in Zod.

2. **Multiple `useProps` in one file** — e.g. `ExportButtonComponent` and `StargateShared`: two theme keys ⇒ two optional registry schemas if they become eligible under the policy above.

3. **Component file name ≠ `useProps` id** — wrong registry key ⇒ silent skip (registry-only policy). PR hygiene: grep `useProps("` and align registry keys.

4. **`Partial<>` vs required theme fields** — Zod for JSON should match **what empty `{}` must allow** (usually all keys optional), or `{}` in theme becomes a validation error.

5. **TS vs Zod alignment** — when Iconify/Mantine types narrow a field (e.g. `stroke: string`), keep the Zod schema consistent (avoid `number` in JSON if TS rejects it after merge).

6. **Cross-slice imports into the registry** — from `features/appbuilder/config` into `shared/...`, prefer a **relative path** inside the submodule while root Jest lacks `@AppBuilderLib` mapping (see current `themeComponentDefaultPropsRegistry.ts`).

### Rollout ordering (when adding new eligible components)

| Option | Pros | Cons |
|--------|------|------|
| **A. By layer** (`shared/ui` → `entities` → `pages` / viewport) | Lower risk, easier review | Slower to cover many keys |
| **B. By real JSON churn / pain** | Fast value | Uneven coverage |
| **C. Strictly alphabetical** | Predictable | May delay high-impact keys |

**Decision:** **Chosen: A (waves)** — see **Architecture** and **Appendix D** for the three-wave definition (Wave 1 = `shared/ui`, Wave 2 = `entities` + `features` except viewport, Wave 3 = `pages` + `entities/viewport` + widget-only / ambiguous `AppBuilder*` as noted).

---

## Appendix C — Next steps after `Icon` (registry-eligible only)

For keys in Appendix A that **meet Appendix B policy** (not Mantine-heavy):

1. Add `*ThemeDefaultPropsSchema` Zod-first next to types (same convention as `Icon` in `*.types.ts`, or team-agreed colocation).
2. Import the schema into `themeComponentDefaultPropsRegistry.ts` (relative import from `features/appbuilder/config` if required for Jest).
3. Optionally add a focused `validateAppBuilderSettingsJson` test per component **or** one parametrized suite — team choice (avoid huge test matrices).

**Default for all other Appendix A keys:** no registry work; they remain Mantine-opaque for deep validation.

---

## Appendix D — Rollout waves (registry-eligible only, Appendix B policy)

Only components that satisfy the Mantine-heavy **skip** policy in Appendix B may receive Zod-first `themeComponentDefaultPropsRegistry` entries; **most** Appendix A keys should remain **unregistered** and validated only via generic Mantine/theme JSON paths. The lists below assign **Appendix A** `useProps` / theme keys to rollout **waves by primary implementation path** (typical FSD locations). Order within a wave is team preference.

### Wave 1 (`shared/ui`)

- `Icon`
- `MarkdownWidgetComponent`
- `ModalBase`
- `TooltipWrapper`

### Wave 2 (`entities` except `entities/viewport`, plus `features`)

- `DefaultSession`
- `DesktopClientPanel`
- `ExportButtonComponent`
- `ExportLabelComponent`
- `OutputChunkLabelComponent`
- `OutputStargateComponent`
- `ParameterColorComponent`
- `ParameterDraggingComponent`
- `ParameterGumballComponent`
- `ParameterLabelComponent`
- `ParameterSelectComponent`
- `ParameterSelectionComponent`
- `ParameterSliderComponent`
- `ParameterStargateComponent`
- `MultiSelectCheckboxes`
- `SelectCarouselComponent`
- `SelectColorComponent`
- `SelectGridComponent`
- `StargateInput`
- `StargateShared`
- `CreateModelStateHook`
- `NotificationWrapper`

### Wave 3 (`pages`, `entities/viewport`, and `widgets` where applicable)

- `AppBuilderAppShellTemplatePage`
- `AppBuilderContainer`
- `AppBuilderContainerWrapper`
- `AppBuilderGridTemplatePage`
- `AppBuilderHorizontalContainer`
- `AppBuilderImage`
- `AppBuilderTemplateSelector`
- `AppBuilderTextWidgetComponent`
- `AppBuilderAgentWidgetComponent`
- `AppBuilderVerticalContainer`
- `LoaderPage`
- `ViewportBranding`
- `ViewportComponent`
- `ViewportIconButton`
- `ViewportIconButtonDropdown`
- `ViewportIcons`
- `ViewportOverlayWrapper`

### Wave 3 (verify)

- `AppBuilderActionComponent` — `useCustomTheme` types this key from `@AppBuilderLib/features/appbuilder`, but confirm the live `useProps` implementation slice (`features` vs `widgets`) before treating it as Wave 2 vs Wave 3.

### Unclassified (verify)

- None listed; add keys here if a new Appendix A entry has no clear primary path.
