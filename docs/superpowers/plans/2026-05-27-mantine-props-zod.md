# Mantine props mirror + ts-to-zod — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Strict runtime validation and Zod-first TypeScript for theme `defaultProps` that use Mantine prop shapes, via mirror types in `mantine-props/` and ts-to-zod codegen—no `z.any()` in production schemas.

**Architecture:** Self-contained `Mantine*Props` interfaces (no `@mantine/*` imports in ts-to-zod inputs) live under `src/shared/shared/mantine-props/`. Generated `*.zod.ts` export `mantine*PropsSchema`. `themeComponentDefaultPropsRegistry` composes these for Mantine core keys and custom nested bags. Compile-time `MantinePropsSubset` asserts keep mirrors assignable to real Mantine props. `JsonValue` moves to `shared/lib` so `mantine-props` stays FSD-clean.

**Tech Stack:** TypeScript, Zod 4.4.3, ts-to-zod, Jest (`validateAppBuilderSettingsJson.themeComponents.test.ts`), Mantine 8.3.14.

**Spec:** [docs/superpowers/specs/2026-05-27-mantine-props-zod-design.md](../specs/2026-05-27-mantine-props-zod-design.md)

**Worktree:** Primary code in **git submodule** `src/shared` (AppBuilderShared). Root `package.json` owns `generate:mantine-props-zod` and devDependency `ts-to-zod`. Bump submodule pointer in parent when done.

---

## File map (by phase)

| Phase | Create | Modify |
|-------|--------|--------|
| **0** | `src/shared/shared/lib/jsonValue.ts` | `src/shared/features/appbuilder/config/appbuildertypecheck.ts` (re-export/import JsonValue) |
| **0** | `src/shared/shared/mantine-props/primitives.ts`, `group.ts`, `group.zod.ts`, `index.ts`, `ts-to-zod.config.mjs`, `assert-mantine-subset.test-d.ts`, `mantine-props-subset.ts` | `package.json` (root): `ts-to-zod`, script |
| **0** | — | `src/shared/pages/config/AppBuilderHorizontalContainer.types.ts`, `themeComponentDefaultPropsRegistry.ts` |
| **1** | `button.ts`, `button.zod.ts`, `text.ts`, `text.zod.ts`, `paper.ts`, `paper.zod.ts`, `accordion.ts`, `accordion.zod.ts` | `themeComponentDefaultPropsRegistry.ts`, `validateAppBuilderSettingsJson.themeComponents.test.ts` |
| **2** | — | Extend `group.ts` + regen; `AppBuilderContainer.types.ts`; horizontal/vertical types |
| **3** | `stack.ts`, `tooltip.ts`, … as needed | Widget/entity `*.types.ts`, `StyleProps` interfaces in `.tsx` |
| **4** | `validateThemeComponentsRecord.ts` (or inline in appbuildertypecheck) | `appbuildertypecheck.ts` superRefine |

---

## Phase 0 — Infra + pilot (`MantineGroupProps`)

### Task 1: Extract `JsonValue` to shared lib (FSD)

**Files:**
- Create: `src/shared/shared/lib/jsonValue.ts`
- Modify: `src/shared/features/appbuilder/config/appbuildertypecheck.ts`

- [ ] **Step 1: Add `jsonValue.ts`**

```typescript
import {z} from "zod";

export type JsonValue =
	| string
	| number
	| boolean
	| null
	| JsonValue[]
	| {[key: string]: JsonValue};

export const JsonValueSchema: z.ZodType<JsonValue> = z.union([
	z.string(),
	z.number(),
	z.boolean(),
	z.null(),
	z.lazy(() => z.array(JsonValueSchema)),
	z.lazy(() => z.record(z.string(), JsonValueSchema)),
]);
```

- [ ] **Step 2: Update `appbuildertypecheck.ts`**

Remove local `JsonValue` / `JsonValueSchema` definitions. Add:

```typescript
export type {JsonValue} from "@AppBuilderLib/shared/lib/jsonValue";
export {JsonValueSchema} from "@AppBuilderLib/shared/lib/jsonValue";
```

(Keep all existing usages unchanged.)

- [ ] **Step 3: Verify types**

Run: `cd d:/projects/ShapeDiverCreateReactAppExample && pnpm exec tsc --noEmit`

Expected: **PASS**

- [ ] **Step 4: Commit (submodule)**

```bash
cd src/shared
git add shared/lib/jsonValue.ts features/appbuilder/config/appbuildertypecheck.ts
git commit -m "SS-9463: extract JsonValue to shared lib for mantine-props"
```

---

### Task 2: Add ts-to-zod + generate script (root repo)

**Files:**
- Modify: `package.json` (repo root)

- [ ] **Step 1: Install devDependency**

```bash
cd d:/projects/ShapeDiverCreateReactAppExample
pnpm add -D ts-to-zod
```

- [ ] **Step 2: Add script** (inside `"scripts"`)

```json
"generate:mantine-props-zod": "ts-to-zod --config src/shared/shared/mantine-props/ts-to-zod.config.mjs"
```

- [ ] **Step 3: Commit (parent repo)**

```bash
git add package.json pnpm-lock.yaml
git commit -m "SS-9463: add ts-to-zod and generate:mantine-props-zod script"
```

---

### Task 3: Primitives + `MantineGroupProps` mirror

**Files:**
- Create: `src/shared/shared/mantine-props/mantine-props-subset.ts`
- Create: `src/shared/shared/mantine-props/primitives.ts`
- Create: `src/shared/shared/mantine-props/group.ts`

- [ ] **Step 1: Subset helper**

`mantine-props-subset.ts`:

```typescript
/** Compile-time: mirror props must be assignable to Mantine component props. */
export type MantinePropsSubset<MantineProps, Mirror> = Mirror extends Partial<MantineProps>
	? true
	: never;
```

- [ ] **Step 2: Primitives (types only for ts-to-zod)**

`primitives.ts` — no imports from `@mantine/*`:

```typescript
/** Mantine size token or arbitrary CSS length. */
export type MantineSpacing = "xs" | "sm" | "md" | "lg" | "xl" | (string & {}) | number;

export type MantineResponsive<T> =
	| T
	| {
			base?: T;
			xs?: T;
			sm?: T;
			md?: T;
			lg?: T;
			xl?: T;
	  };

export type MantineFlexWrap = "nowrap" | "wrap" | "wrap-reverse";

/** CSS width/height in theme JSON. */
export type MantineCssLength = string | number;
```

- [ ] **Step 3: Group mirror (phase 0 scope = current horizontal container fields)**

`group.ts`:

```typescript
import type {MantineCssLength, MantineFlexWrap, MantineSpacing} from "./primitives";

/**
 * Serializable subset of Mantine `Group` props for settings theme `defaultProps`.
 * @see https://mantine.dev/core/group/
 */
export interface MantineGroupProps {
	w?: MantineCssLength;
	h?: MantineCssLength;
	justify?: string;
	wrap?: MantineFlexWrap;
	p?: MantineSpacing;
}
```

- [ ] **Step 4: Commit (submodule)**

```bash
cd src/shared
git add shared/mantine-props/mantine-props-subset.ts shared/mantine-props/primitives.ts shared/mantine-props/group.ts
git commit -m "SS-9463: add mantine-props primitives and MantineGroupProps mirror"
```

---

### Task 4: ts-to-zod config + generated `group.zod.ts`

**Files:**
- Create: `src/shared/shared/mantine-props/ts-to-zod.config.mjs`
- Create (generated): `src/shared/shared/mantine-props/group.zod.ts`
- Create: `src/shared/shared/mantine-props/index.ts`

- [ ] **Step 1: Config**

`ts-to-zod.config.mjs`:

```javascript
/** @type {import("ts-to-zod").TsToZodConfig} */
export default [
	{
		name: "mantine-props-group",
		input: "src/shared/shared/mantine-props/group.ts",
		output: "src/shared/shared/mantine-props/group.zod.ts",
		getSchemaName: (id) => {
			if (id === "MantineGroupProps") return "mantineGroupPropsSchema";
			return `${id}Schema`;
		},
	},
];
```

(Adjust `input`/`output` paths if ts-to-zod is run from repo root—paths must be relative to cwd. If CLI expects paths from config file location, use `./group.ts` and `./group.zod.ts`.)

- [ ] **Step 2: Run generator from repo root**

```bash
cd d:/projects/ShapeDiverCreateReactAppExample
pnpm run generate:mantine-props-zod
```

Expected: creates `group.zod.ts` with `export const mantineGroupPropsSchema = z.strictObject({...})` (or `z.object` — **manually change to `z.strictObject` in generator output or post-process** if ts-to-zod emits `z.object`; strict is required per spec).

- [ ] **Step 3: `index.ts`**

```typescript
export type {MantineGroupProps} from "./group";
export {mantineGroupPropsSchema} from "./group.zod";
export type {MantineSpacing, MantineResponsive, MantineFlexWrap, MantineCssLength} from "./primitives";
```

- [ ] **Step 4: Scan generated file for `z.any()`**

```bash
rg "z\.any\(\)" src/shared/shared/mantine-props/
```

Expected: **no matches**. If any, fix mirror types (remove external imports) and regenerate.

- [ ] **Step 5: Commit (submodule)**

```bash
cd src/shared
git add shared/mantine-props/ts-to-zod.config.mjs shared/mantine-props/group.zod.ts shared/mantine-props/index.ts
git commit -m "SS-9463: generate mantineGroupPropsSchema via ts-to-zod"
```

---

### Task 5: Compile-time Mantine subset assert (Group)

**Files:**
- Create: `src/shared/shared/mantine-props/assert-mantine-subset.test-d.ts`

- [ ] **Step 1: Add assert file**

```typescript
import type {GroupProps} from "@mantine/core";
import type {MantineGroupProps} from "./group";
import type {MantinePropsSubset} from "./mantine-props-subset";

type _MantineGroupPropsSubset = MantinePropsSubset<GroupProps, MantineGroupProps>;

declare const assertGroup: _MantineGroupPropsSubset;
void assertGroup;
```

- [ ] **Step 2: Ensure file is included in `tsc`**

If submodule has its own `tsconfig.json`, include `shared/mantine-props/**/*.ts`. Otherwise root `tsc` must pick up `src/shared/**`.

Run: `pnpm exec tsc --noEmit`

Expected: **PASS**

- [ ] **Step 3: Commit (submodule)**

```bash
cd src/shared
git add shared/mantine-props/assert-mantine-subset.test-d.ts
git commit -m "SS-9463: compile-time assert MantineGroupProps subset of GroupProps"
```

---

### Task 6: Wire pilot — `AppBuilderHorizontalContainer` + registry

**Files:**
- Modify: `src/shared/pages/config/AppBuilderHorizontalContainer.types.ts`
- Modify: `src/shared/features/appbuilder/config/themeComponentDefaultPropsRegistry.ts`
- Modify: `src/shared/features/appbuilder/config/validateAppBuilderSettingsJson.themeComponents.test.ts`

- [ ] **Step 1: Replace manual Zod in horizontal types**

```typescript
import {mantineGroupPropsSchema} from "@AppBuilderLib/shared/mantine-props/group.zod";
import {z} from "zod";
import type {MantineGroupProps} from "@AppBuilderLib/shared/mantine-props/group";

export const AppBuilderHorizontalContainerThemeDefaultPropsSchema =
	mantineGroupPropsSchema;

export interface AppBuilderHorizontalContainerThemeDefaultProps
	extends MantineGroupProps {}
```

Remove `mantineSpacingJsonSchema`, `cssWidthHeightJsonSchema`, `groupFlexWrapJsonSchema`.

- [ ] **Step 2: Optional registry alias for Mantine `Group` key**

In `themeComponentDefaultPropsRegistry.ts` add:

```typescript
import {mantineGroupPropsSchema} from "@AppBuilderLib/shared/mantine-props/group.zod";

// inside registry object:
Group: mantineGroupPropsSchema,
AppBuilderHorizontalContainer: mantineGroupPropsSchema,
```

- [ ] **Step 3: Jest — registered horizontal container still validates**

Add to `validateAppBuilderSettingsJson.themeComponents.test.ts`:

```typescript
it("accepts registered AppBuilderHorizontalContainer defaultProps from mantineGroupPropsSchema", () => {
	const result = validateAppBuilderSettingsJson({
		...minimalValidSettings,
		themeOverrides: {
			components: {
				AppBuilderHorizontalContainer: {
					defaultProps: {w: "100%", wrap: "nowrap", p: "xs"},
				},
			},
		},
	});
	expect(result.success).toBe(true);
});

it("fails when AppBuilderHorizontalContainer defaultProps have invalid wrap", () => {
	const result = validateAppBuilderSettingsJson({
		...minimalValidSettings,
		themeOverrides: {
			components: {
				AppBuilderHorizontalContainer: {
					defaultProps: {wrap: "invalid-wrap"},
				},
			},
		},
	});
	expect(result.success).toBe(false);
});
```

- [ ] **Step 4: Run tests**

```bash
cd d:/projects/ShapeDiverCreateReactAppExample
pnpm test -- validateAppBuilderSettingsJson.themeComponents.test.ts
```

Expected: **PASS**

- [ ] **Step 5: Commit (submodule)**

```bash
cd src/shared
git add pages/config/AppBuilderHorizontalContainer.types.ts features/appbuilder/config/themeComponentDefaultPropsRegistry.ts features/appbuilder/config/validateAppBuilderSettingsJson.themeComponents.test.ts
git commit -m "SS-9463: wire AppBuilderHorizontalContainer to mantineGroupPropsSchema"
```

---

### Task 7: Phase 0 exit — full check

- [ ] **Step 1: `tsc` + Jest**

```bash
pnpm exec tsc --noEmit
pnpm test
```

Expected: **PASS**

- [ ] **Step 2: Regenerate dry-run**

```bash
pnpm run generate:mantine-props-zod
git status --short src/shared/shared/mantine-props/
```

Expected: **clean** (no unexpected diff).

---

## Phase 1 — Mantine core keys from `public/theme08.json`

### Task 8: `MantineButtonProps` mirror + registry

**Files:**
- Create: `src/shared/shared/mantine-props/button.ts`, `button.zod.ts`
- Modify: `ts-to-zod.config.mjs`, `index.ts`, `assert-mantine-subset.test-d.ts`, `themeComponentDefaultPropsRegistry.ts`, tests

- [ ] **Step 1: `button.ts`** (fields used in `public/theme08.json` `Button.defaultProps`)

```typescript
import type {MantineResponsive, MantineSpacing} from "./primitives";

export interface MantineButtonProps {
	fw?: string | number;
	mt?: MantineSpacing;
	fz?: MantineResponsive<string | number>;
	h?: MantineResponsive<string | number>;
	variant?: string;
	size?: MantineSpacing;
	fullWidth?: boolean;
}
```

Expand with other keys from `useCustomTheme.ts` `Button` block as needed after validating configs.

- [ ] **Step 2: Add config entry, generate, assert `ButtonProps` subset, register `Button: mantineButtonPropsSchema`**

- [ ] **Step 3: Jest**

```typescript
it("accepts theme08-like Button defaultProps", () => {
	const result = validateAppBuilderSettingsJson({
		...minimalValidSettings,
		themeOverrides: {
			components: {
				Button: {
					defaultProps: {
						fw: "400",
						mt: "10px",
						fz: {base: "0px", md: "14px"},
						h: {base: "25px", md: "36px"},
					},
				},
			},
		},
	});
	expect(result.success).toBe(true);
});
```

- [ ] **Step 4: Commit**

```bash
git commit -m "SS-9463: add MantineButtonProps mirror and registry entry"
```

---

### Task 9: `MantineTextProps`, `MantinePaperProps`, `MantineAccordionProps`

Repeat Task 8 pattern for:

| File | Registry key | Sample JSON (`theme08.json`) |
|------|----------------|------------------------------|
| `text.ts` | `Text` | `fw`, `size` |
| `paper.ts` | `Paper` | `withBorder` |
| `accordion.ts` | `Accordion` | `styles.label.fontWeight` |

For `styles`, add to `primitives.ts`:

```typescript
export type MantineStylesApi = {[selector: string]: {[cssProperty: string]: string | number | boolean | null | MantineStylesApi | (string | number)[] } | undefined};
```

Regenerate; use `JsonValueSchema` only if ts-to-zod cannot express deep `styles` without `z.any()` — prefer explicit `MantineStylesApi` mirror + generated schema; if too heavy, use `z.record(z.string(), JsonValueSchema)` **imported from `@AppBuilderLib/shared/lib/jsonValue`** in a **hand-written** `mantineStylesApiSchema` in `primitives.zod.ts` (not generated), re-export for composition.

- [ ] **Step: Batch-validate public configs**

```bash
# Use existing project script or one-off:
node -e "
const fs=require('fs');const path=require('path');
const {validateAppBuilderSettingsJson}=require('./dist-or-ts-path'); // adapt to repo harness
"
```

Prefer reusing any existing SS-9463 validation script; minimum: `pnpm test` + manual `validateAppBuilderSettingsJson` on `public/theme08.json` in a test:

```typescript
it("validates public/theme08.json top-level theme components", () => {
	const json = JSON.parse(
		fs.readFileSync(path.join(__dirname, "../../../../public/theme08.json"), "utf8"),
	);
	const result = validateAppBuilderSettingsJson(json);
	expect(result.success).toBe(true);
});
```

(Adjust relative path to `public/theme08.json` from test file.)

- [ ] **Commit:** `SS-9463: add Mantine Text Paper Accordion props mirrors (phase 1)`

---

## Phase 2 — Extend Group + migrate app container schemas

### Task 10: Extend `MantineGroupProps` (`pt`, `pb`, `styles`)

**Files:**
- Modify: `src/shared/shared/mantine-props/group.ts`, regen `group.zod.ts`
- Modify: `AppBuilderVerticalContainer.types.ts`, `AppBuilderContainer.types.ts`

- [ ] **Step 1: Add fields to mirror** (from nested `theme08` horizontal container usage)

```typescript
pt?: MantineSpacing;
pb?: MantineSpacing;
styles?: MantineStylesApi;
```

- [ ] **Step 2: Regenerate + update subset assert + run tests**

Note: Until **Phase 4**, nested `containerThemeOverrides` paths may still skip deep validation — document in test comment.

- [ ] **Step 3: Point vertical container schema at `mantineGroupPropsSchema` (Stack/Group as appropriate)**

- [ ] **Commit:** `SS-9463: extend MantineGroupProps and migrate container theme types`

---

## Phase 3 — Mantine-heavy custom components

### Task 11: `AppBuilderStackUiWidgetComponent` composed schema

**Files:**
- Create: `src/shared/widgets/appbuilder/config/AppBuilderStackUiWidgetComponent.theme.types.ts` (or colocate under widget slice `config/`)
- Modify: `AppBuilderStackUiWidgetButtonComponent.tsx` `StyleProps`
- Modify: `themeComponentDefaultPropsRegistry.ts`

- [ ] **Step 1: Composed schema**

```typescript
import {mantineButtonPropsSchema} from "@AppBuilderLib/shared/mantine-props/button.zod";
import {mantinePaperPropsSchema} from "@AppBuilderLib/shared/mantine-props/paper.zod";
import {mantineStackPropsSchema} from "@AppBuilderLib/shared/mantine-props/stack.zod";
import {mantineTextPropsSchema} from "@AppBuilderLib/shared/mantine-props/text.zod";
import {IconThemeDefaultPropsSchema} from "@AppBuilderLib/shared/ui/icon/Icon.types";
import {z} from "zod";

export const AppBuilderStackUiWidgetThemeDefaultPropsSchema = z.strictObject({
	stackPaperProps: mantinePaperPropsSchema.optional(),
	stackProps: mantineStackPropsSchema.optional(),
	buttonForwardProps: mantineButtonPropsSchema.optional(),
	buttonBackProps: mantineButtonPropsSchema.optional(),
	itemTextProps: mantineTextPropsSchema.optional(),
	iconForwardProps: IconThemeDefaultPropsSchema.optional(),
});
```

(Create `stack.ts` mirror first if missing.)

- [ ] **Step 2: Change `StyleProps` to use `MantineButtonProps` etc.**

- [ ] **Step 3: Register `AppBuilderStackUiWidgetComponent` in registry**

- [ ] **Step 4: Jest positive/negative fixtures**

- [ ] **Commit:** `SS-9463: register AppBuilderStackUiWidget theme schema with mantine-props`

### Task 12: `TooltipWrapper` (and next priorities from spec)

Same pattern: `MantineTooltipProps` with `label?: string` only (no `ReactNode`), compose into `TooltipWrapper.types.ts`, register `TooltipWrapper`.

---

## Phase 4 — Nested `containerThemeOverrides`

### Task 13: Recursive theme component validation

**Files:**
- Create: `src/shared/features/appbuilder/config/validateThemeComponentsRecord.ts`
- Modify: `appbuildertypecheck.ts`

- [ ] **Step 1: Implement walker**

```typescript
import type {z} from "zod";
import {themeComponentDefaultPropsRegistry} from "./themeComponentDefaultPropsRegistry";

export function validateThemeComponentsRecord(
	components: Record<string, {defaultProps?: unknown}>,
	ctx: z.RefinementCtx,
	basePath: (string | number)[],
): void {
	for (const [componentName, entry] of Object.entries(components)) {
		const schema =
			themeComponentDefaultPropsRegistry[
				componentName as keyof typeof themeComponentDefaultPropsRegistry
			];
		if (!schema || entry?.defaultProps === undefined) continue;

		const parsed = schema.safeParse(entry.defaultProps);
		if (parsed.success) continue;

		const defaultPropsPath = [...basePath, componentName, "defaultProps"];
		for (const issue of parsed.error.issues) {
			ctx.addIssue({...issue, path: [...defaultPropsPath, ...issue.path]});
		}

		// Recurse into nested Mantine theme shapes
		const dp = entry.defaultProps as Record<string, unknown>;
		const nested = dp?.containerThemeOverrides as
			| Record<string, Record<string, {components?: Record<string, {defaultProps?: unknown}>}>>
			| undefined;
		if (nested && typeof nested === "object") {
			for (const [template, containers] of Object.entries(nested)) {
				if (!containers || typeof containers !== "object") continue;
				for (const [containerName, containerEntry] of Object.entries(containers)) {
					const inner = containerEntry?.components;
					if (!inner || typeof inner !== "object") continue;
					validateThemeComponentsRecord(inner, ctx, [
						...basePath,
						componentName,
						"defaultProps",
						"containerThemeOverrides",
						template,
						containerName,
						"components",
					]);
				}
			}
		}
	}
}
```

- [ ] **Step 2: Replace inline loop in `superRefine` with helper for top-level + call from `AppBuilderContainerWrapper` path**

- [ ] **Step 3: Jest using nested fragment from `theme08.json`**

```typescript
it("validates nested AppBuilderHorizontalContainer defaultProps under containerThemeOverrides", () => {
	// load minimal wrapper + nested structure from theme08 or inline fixture
	// expect success when pt/pb/styles included after phase 2 group extension
});
```

- [ ] **Step 4: `theme08.json` full file test**

- [ ] **Commit:** `SS-9463: recursive theme component defaultProps validation`

---

## CI / housekeeping

### Task 14: Generate check in CI (optional but recommended)

- [ ] Add script `scripts/check-mantine-props-zod-generated.mjs` that runs `pnpm run generate:mantine-props-zod` and exits non-zero if `git diff --quiet src/shared/shared/mantine-props` fails.

- [ ] Wire into existing CI workflow or `npm test` precursor.

---

## Spec coverage checklist (self-review)

| Spec requirement | Task |
|------------------|------|
| `mantine-props/` + naming `Mantine*Props` | Tasks 3–4 |
| No `z.any()` in prod schemas | Task 4 step 4, all regen scans |
| ts-to-zod + committed `*.zod.ts` | Tasks 2, 4 |
| `MantinePropsSubset` asserts | Task 5 |
| Registry composition | Tasks 6, 8–9, 11 |
| JsonValue in shared lib (FSD) | Task 1 |
| Phase 0–4 rollout | Tasks 1–7, 8–9, 10, 11–12, 13 |
| Appendix B policy | Tasks 11–12 |
| No codegen from Mantine d.ts | N/A (explicit non-goal) |
| Unknown keys stay JsonValue | Unchanged `superRefine` skip |

---

## Appendix — Adding a new Mantine component mirror

1. Add `src/shared/shared/mantine-props/{name}.ts` with `Mantine{Name}Props`.
2. Add entry to `ts-to-zod.config.mjs`.
3. `pnpm run generate:mantine-props-zod` → commit `{name}.zod.ts`.
4. Add row to `assert-mantine-subset.test-d.ts` against `{Name}Props` from `@mantine/core`.
5. Register in `themeComponentDefaultPropsRegistry.ts` if settings JSON uses that theme key.
6. Add Jest fixture in `validateAppBuilderSettingsJson.themeComponents.test.ts`.

**Do not** import `@mantine/*` in `*.schema-input.ts` files.

---

## Phase 5 — `appBuilderOverride` props validation tests (SS-9065)

**Goal:** Settings JSON with real `appBuilderOverride` shapes (containers, nested widgets, action props) must pass `validateAppBuilderSettingsJson` — catch `Unrecognized key` regressions before production configs fail at load.

**Fixture:** `public/SS-9065.json` (`stickyTabs`, `tooltip` in `definition.props`, `message` on `setParameterValues`).

### Task 15: Schema fixes + regression tests

**Files:**
- Modify: `src/shared/features/appbuilder/config/appbuilder.ts`
- Modify: `src/shared/features/appbuilder/config/appbuildertypecheck.ts`
- Create: `src/shared/features/appbuilder/config/validateAppBuilderSettingsJson.appBuilderOverride.test.ts`

**Schema changes:**
- `IAppBuilderContainer.stickyTabs?: boolean` + Zod on standard containers
- `IAppBuilderActionPropsSetParameterValues.message?: string` + Zod
- `IAppBuilderActionDefinitionSchema` uses **legacy** action prop schemas (includes `IAppBuilderActionPropsCommon` — `tooltip` inside `definition.props` matches runtime spread in `AppBuilderActionFromType`)

**Tests:**
- Full file: `public/SS-9065.json` validates
- Focused fixtures for `stickyTabs`, `message`, nested `tooltip` on control `addToCart`

**Commit:** `SS-9463: allow stickyTabs and action props in appBuilderOverride validation`

**Status:** Done (submodule `c81f364`).
