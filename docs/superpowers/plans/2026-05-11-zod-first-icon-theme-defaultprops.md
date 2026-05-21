# Zod-first Icon theme defaultProps Implementation Plan

> **Language:** This plan is **English-only** (including appendices).  
> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make `Icon` theme `defaultProps` **Zod-first**: one schema defines JSON validation and TypeScript theme props; `themeComponentDefaultPropsRegistry` imports that schema instead of duplicating fields.

**Architecture:** Colocate in **`Icon.types.ts`** (types + theme Zod in one place; no separate schema file): export `IconThemeDefaultPropsSchema`, `type IconThemeDefaultProps = z.infer<typeof …>`, and `iconThemeDefaultStyleProps` via `IconThemeDefaultPropsSchema.parse(…)` (same values as today’s `defaultStyleProps`). `Icon.tsx` imports those symbols from `./Icon.types`; `IconThemeProps` uses `IconThemeDefaultProps`; `useIconProps` passes `iconThemeDefaultStyleProps` into `useProps("Icon", …)`. `features/appbuilder/config/themeComponentDefaultPropsRegistry.ts` should import the schema via **`@AppBuilderLib/shared/ui/icon/Icon.types`** (preferred for Jest: avoids pulling `Icon.tsx` → `.css`) or another **`@AppBuilderLib/...`** entry that does not transitively import UI/CSS. **Do not** rely on long relative paths such as `../../../shared/ui/...`. If root Jest cannot resolve `@AppBuilderLib`, add **`moduleNameMapper`** in the repo that runs tests (see Appendix B — *Registry import style*). FSD: **features → shared** is allowed; `shared` must not import `features`. **Broader rule:** do **not** register strict per-component schemas for custom components whose theme props are mostly Mantine bags (`Partial<ButtonProps>`, nested `buttonProps`, etc.); see Appendix B — those stay opaque at the Mantine theme level.

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
| `src/shared/features/appbuilder/config/themeComponentDefaultPropsRegistry.ts` | **Modify** — `Icon: IconThemeDefaultPropsSchema` via **`@AppBuilderLib/shared/ui/icon/Icon.types`** (avoid `../../../shared/...` and avoid the `shared/ui/icon` barrel in Jest — it pulls `Icon.tsx` + CSS). |
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

Use the **path alias** (preferred). Do **not** commit long `../../../shared/...` relative imports.

Prefer **`@AppBuilderLib/shared/ui/icon/Icon.types`** for the schema so Jest does not load `Icon.tsx` (which imports `.css`). The package barrel `@AppBuilderLib/shared/ui/icon` also re-exports the React component and can break Jest without a CSS mapper.

```typescript
import {z} from "zod";
import {IconThemeDefaultPropsSchema} from "@AppBuilderLib/shared/ui/icon/Icon.types";
```

If Jest in the monorepo root fails to resolve `@AppBuilderLib`, add `moduleNameMapper` in `package.json` (or `jest.config`) for `@AppBuilderLib/(.*)$` → `src/shared/$1` (adjust to your layout), then keep the alias import above.

Update the registry file comment: **Icon schema lives in `shared/ui/icon/Icon.types.ts` (Zod-first).**

If ESLint FSD rejects the barrel path, use `@AppBuilderLib/shared/ui/icon/Icon.types` (still an alias, not `../../../`).

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
| `ModalBase` | `useProps("ModalBase", …)` in `ModalBase.tsx` — aligned with `useCustomTheme.components.ModalBase` (was `UniversalModal`, fixed). Registry: **SKIP** (Mantine-heavy). |
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

6. **Cross-slice imports into the registry** — import from **`shared/**` via `@AppBuilderLib/...` path aliases**, not deep relative paths (`../../../shared/...`). Deep relatives are **discouraged**: they break when folders move, are hard to read, and hide the FSD dependency direction. If tests fail without alias resolution, fix **Jest `moduleNameMapper`** (or run tests from a config that respects `tsconfig` paths), instead of downgrading to relatives.

### Registry import style (registry file)

| Approach | Verdict |
|----------|---------|
| `import { … } from "@AppBuilderLib/shared/ui/icon/Icon.types"` (or other `*.types` entry points) | **Preferred** for registry — avoids pulling React modules (and `.css`) into Node/Jest. |
| `import { … } from "@AppBuilderLib/shared/ui/icon"` (barrel) | **Risky in Jest** — may transitively import `Icon.tsx` → CSS unless you add a CSS `moduleNameMapper` stub. |
| `import { … } from "../../../shared/ui/icon/Icon.types"` | **Avoid** — works as a short-term test workaround only; treat as **debt** to replace with alias + Jest mapping. |

**Action item:** align `themeComponentDefaultPropsRegistry.ts` with the preferred row and document the Jest change in the same PR when you switch imports.

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
2. Import the schema into `themeComponentDefaultPropsRegistry.ts` using **`@AppBuilderLib/...`** (see *Registry import style* in Appendix B). Add Jest `moduleNameMapper` if the monorepo test runner does not resolve the alias yet — do **not** add long `../../../shared/...` imports as the permanent solution.
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

#### Wave 1 — execution log (subagent-driven, Appendix B)

Subagents assessed the remaining Wave 1 keys (Icon already shipped). **Registry / Zod-first** only where Appendix B allows; otherwise **SKIP** (stay on generic Mantine JSON validation).

| Theme key (`useCustomTheme.components`) | `useProps(…)` id in code | Registry / Zod-first | Outcome |
|------------------------------------------|--------------------------|----------------------|---------|
| `Icon` | `Icon` | **Done** | Zod-first in `Icon.types.ts`; registry uses **`@AppBuilderLib/shared/ui/icon/Icon.types`** + root Jest `moduleNameMapper` (Appendix B — *Registry import style*). |
| `TooltipWrapper` | `TooltipWrapper` | **SKIP** | Theme type is `Partial<TooltipWrapperProps & TooltipProps>` — Mantine-heavy (`TooltipProps` bag). |
| `MarkdownWidgetComponent` | `MarkdownWidgetComponent` | **SKIP** | App-owned primitives plus optional `MantineThemeOverride`; Appendix B default is skip unless the team adds a **thin** schema for primitives only. |
| `ModalBase` | `ModalBase` | **SKIP** | `StyleProps` extends `ModalProps` plus `Record<string, any>` button prop bags — Mantine-heavy. **Resolved:** `useProps` id was **`UniversalModal`** (theme did not apply); now **`ModalBase`** to match `useCustomTheme`. |

**Wave 1 registry conclusion:** no additional `themeComponentDefaultPropsRegistry` entries beyond **`Icon`** unless policy changes or a team-approved thin schema is added later.

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

#### Wave 2 — execution log (subagent-driven, Appendix B)

Subagents inventoried Wave 2 keys against Appendix B (Mantine-heavy skip vs thin, app-owned surfaces). **SKIP** means no `themeComponentDefaultPropsRegistry` work under current policy; **ELIGIBLE** means a thin Zod-first schema is plausible if the team prioritizes that key; **VERIFY** means the theme hook / `useProps` wiring was unclear in the snapshot submodule and should be re-checked in a full checkout before treating as ELIGIBLE vs SKIP.

| Theme key (`useCustomTheme.components`) | `useProps(…)` id (or notes) | Registry / Zod-first | Outcome |
|------------------------------------------|----------------------------|----------------------|---------|
| `DefaultSession` | Aligned with `useDefaultSessionDto` props (not a standalone `useProps("DefaultSession")` surface in the assessed tree) | **SKIP** | Session DTO / hook-shaped defaults — not the same “small theme defaultProps object” pattern as `Icon`; defer unless the team defines a dedicated thin props type. |
| `DesktopClientPanel` | `DesktopClientPanel` | **SKIP** | Mantine prop bags (`ButtonProps`, layout) — Appendix B default. |
| `ExportButtonComponent` | `ExportButtonComponent` + `StargateShared` merge | **SKIP** | Mantine-heavy button/tooltip bags on the main key; Stargate colors are a separate thin surface (see `StargateShared` row). |
| `ExportLabelComponent` | `ExportLabelComponent` | **Done** | Zod in `ExportLabelComponent.types.ts`; component uses `z.infer` for theme props. |
| `OutputChunkLabelComponent` | `OutputChunkLabelComponent` | **Done** | Same pattern as export label. |
| `OutputStargateComponent` | `OutputStargateComponent` | **SKIP** | Mantine-heavy. |
| `ParameterColorComponent` | `ParameterColorComponent` | **Done** | `colorFormat` union in `ParameterColorComponent.types.ts`. |
| `ParameterDraggingComponent` | `ParameterDraggingComponent` | **Done** | JSON schema in `parameterInteractionThemeDefaultProps.ts`; runtime defaults stay `InteractionEffect` in `.tsx`. |
| `ParameterGumballComponent` | `ParameterGumballComponent` | **Done** | Same as dragging. |
| `ParameterLabelComponent` | `ParameterLabelComponent` | **SKIP** | Mantine / composite label surface — Appendix B default. |
| `ParameterSelectComponent` | `ParameterSelectComponent` | **SKIP** | Mantine-heavy select props. |
| `ParameterSelectionComponent` | `ParameterSelectionComponent` | **Done** | Same interaction JSON pattern as dragging/gumball. |
| `ParameterSliderComponent` | `ParameterSliderComponent` | **Done** | Width fields in `ParameterSliderComponent.types.ts`. |
| `ParameterStargateComponent` | `ParameterStargateComponent` | **SKIP** | Mantine + Stargate UX composite. |
| `MultiSelectCheckboxes` | `MultiSelectCheckboxes` | **SKIP** | Checkbox / Mantine composition. |
| `SelectCarouselComponent` | `SelectCarouselComponent` | **SKIP** | Mantine / carousel bags. |
| `SelectColorComponent` | `SelectColorComponent` | **SKIP** | Mantine-heavy (distinct from `ParameterColorComponent`). |
| `SelectGridComponent` | `SelectGridComponent` | **SKIP** | Mantine-heavy grid/card props. |
| `StargateInput` | `StargateInput` | **SKIP** | `ButtonProps`, `TextProps`, `LoaderProps` — Mantine-heavy. |
| `StargateShared` | `StargateShared` (merged from `rest` in export/output/parameter Stargate UIs) | **Done** | Zod in `entities/stargate/ui/stargateShared.ts`; defaults use `satisfies` on nested colors; `StargateStyleProps` stays Mantine-strict for `mapStargateComponentStatusDefinition`. |
| `CreateModelStateHook` | `CreateModelStateHook` | **Done** | Zod in `features/model-state/model/useCreateModelState.types.ts`; hook `defaultThemeProps` typed from `z.infer`. |
| `NotificationWrapper` | `NotificationWrapper` | **Done** | Zod in `features/notifications/config/notificationcontext.ts` as `NotificationWrapperThemeDefaultPropsSchema`; `NotificationStyleProps` = `z.infer` (single source). |

#### Wave 2 — registry implementation (shipped)

Registry keys and schema locations (parent app + `src/shared`):

| Registry key | Schema / types module |
|----------------|------------------------|
| `CreateModelStateHook` | `@AppBuilderLib/features/model-state/model/useCreateModelState.types` |
| `ExportLabelComponent` | `@AppBuilderLib/entities/export/ui/ExportLabelComponent.types` |
| `Icon` | `@AppBuilderLib/shared/ui/icon/Icon.types` |
| `NotificationWrapper` | `@AppBuilderLib/features/notifications/config/notificationcontext` |
| `OutputChunkLabelComponent` | `@AppBuilderLib/entities/output/ui/OutputChunkLabelComponent.types` |
| `ParameterColorComponent` | `@AppBuilderLib/entities/parameter/ui/ParameterColorComponent.types` |
| `ParameterDraggingComponent` | `@AppBuilderLib/entities/parameter/config/theme/parameterInteractionThemeDefaultProps` |
| `ParameterGumballComponent` | same |
| `ParameterSelectionComponent` | same |
| `ParameterSliderComponent` | `@AppBuilderLib/entities/parameter/ui/ParameterSliderComponent.types` |
| `StargateShared` | `@AppBuilderLib/entities/stargate/ui/stargateShared` |

**Wave 2 registry conclusion (updated):** ELIGIBLE thin keys above are **registered** in `themeComponentDefaultPropsRegistry` with Zod-first (or Zod-primary for notifications) and Jest coverage in `validateAppBuilderSettingsJson.themeComponents.test.ts` for a subset (Icon, ParameterColor, StargateShared, CreateModelStateHook, NotificationWrapper, plus unknown-key policy). Interaction components keep `InteractionEffect`-typed runtime defaults in `.tsx` while theme JSON uses `InteractionEffectThemeJsonSchema` (`string | record | null`). Remaining Wave 2 keys in the inventory table stay **SKIP** (Mantine-heavy or out of scope).

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

#### Wave 3 — execution log (initial)

| Theme key | `useProps(…)` id | Registry / Zod-first | Outcome |
|-----------|------------------|----------------------|---------|
| `LoaderPage` | `LoaderPage` | **Done** | `pages/misc/LoaderPage.types.ts` — `type` + `size` (Mantine size union / string / number). |
| `AppBuilderTemplateSelector` | `AppBuilderTemplateSelector` | **Done** | `pages/templates/AppBuilderTemplateSelector.types.ts` — `template` (`grid` \| `appshell`) + `showContainerButtons`. |
| `AppBuilderAppShellTemplatePage`, `AppBuilderGridTemplatePage` | same | **SKIP** | Mantine / layout prop surfaces (typical Appendix B). |
| `AppBuilderHorizontalContainer` | `AppBuilderHorizontalContainer` | **Done** | `pages/templates/AppBuilderHorizontalContainer.types.ts` — `w`/`h`/`justify`/`wrap`/`p` (JSON); component keeps Mantine `StyleProps` for `Group` typing (no `satisfies` merge). |
| `AppBuilderVerticalContainer` | `AppBuilderVerticalContainer` | **Done** | `pages/templates/AppBuilderVerticalContainer.types.ts` — `p` spacing; component uses `satisfies` + `z.infer`. |
| `AppBuilderContainer` | `AppBuilderContainer` (`usePropsAppBuilder`) | **Done** | `pages/templates/AppBuilderContainer.types.ts` — merge of horizontal + vertical schemas + `orientation`; component keeps Mantine intersection types for child spreads. |
| `AppBuilderContainerWrapper` | `AppBuilderContainerWrapper` | **SKIP** | `containerThemeOverrides` maps to `MantineThemeOverride` — opaque at depth. |
| `AppBuilderImage`, `AppBuilderTextWidgetComponent`, `AppBuilderAgentWidgetComponent` | widgets | **SKIP** (default) | Confirm per-file `useProps` if adding registry; expect Mantine-heavy. |
| `ViewportBranding`, `ViewportComponent`, `ViewportIcons`, `ViewportIconButton`, `ViewportIconButtonDropdown`, `ViewportOverlayWrapper` | same | **SKIP** (default) | Viewport props merge with viewer session enums and Mantine; deep Zod not targeted in this rollout. |

**Wave 3 registry (shipped subset):** `LoaderPage`, `AppBuilderTemplateSelector`, `AppBuilderVerticalContainer`, `AppBuilderHorizontalContainer`, `AppBuilderContainer` — see `themeComponentDefaultPropsRegistry` and Jest in `validateAppBuilderSettingsJson.themeComponents.test.ts`.

### Wave 3 (verify)

- `AppBuilderActionComponent` — **Resolved:** implemented in `features/appbuilder/ui/AppBuilderActionComponent.tsx` with `useProps("AppBuilderActionComponent", …)`; theme merges **`ButtonProps` / `PolymorphicComponentProps`** — **SKIP** for deep registry (Appendix B Mantine-heavy). Theme key matches `useProps` id.

### Unclassified (verify)

- None listed; add keys here if a new Appendix A entry has no clear primary path.
