# Theme component defaultProps validation (settings JSON) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extend `validateAppBuilderSettingsJson` so `themeOverrides.components.<registeredName>.defaultProps` is validated with Zod (registry-only policy); failures surface in the same `formatAppBuilderZodError` path as today when settings JSON loads.

**Architecture:** A `features/appbuilder/config` registry maps `useProps` component names to Zod schemas for `defaultProps`. `IAppBuilderSettingsJsonSchema` gains a `superRefine` that, for each registry hit, runs `safeParse` on `defaultProps` and merges issues with paths prefixed by `themeOverrides`, `components`, `<name>`, `defaultProps`. Unknown component keys are unchanged (opaque JSON). Pilot schema: `Icon` with a strict v1 subset matching current `defaultStyleProps` keys (`size`, `stroke`).

**Tech Stack:** TypeScript, Zod 4 (`z`, `z.strictObject`, `superRefine`), Jest + ts-jest (`pnpm test`).

---

## File map

| File | Responsibility |
|------|----------------|
| `src/shared/features/appbuilder/config/themeComponentDefaultPropsRegistry.ts` | **Create** — registry object + exported type for keys; Zod schemas per registered component; short comment on how to add entries. |
| `src/shared/features/appbuilder/config/appbuildertypecheck.ts` | **Modify** — wrap or extend `IAppBuilderSettingsJsonSchema` with `superRefine` calling registry validation; keep `validateAppBuilderSettingsJson` as single public entry (still `safeParse` once). |
| `src/shared/features/appbuilder/config/index.ts` | **Modify** only if you need to re-export registry for tests or docs (optional; prefer tests importing from `appbuildertypecheck` only). |
| `src/shared/features/appbuilder/config/validateAppBuilderSettingsJson.themeComponents.test.ts` | **Create** — two tests: registered component invalid `defaultProps`; unknown component key passes. |

---

### Task 1: Failing test — invalid `defaultProps` for registered `Icon`

**Files:**
- Create: `src/shared/features/appbuilder/config/validateAppBuilderSettingsJson.themeComponents.test.ts`

- [ ] **Step 1: Add failing test (registry + refine not implemented yet — test documents desired behavior)**

```typescript
import {formatAppBuilderZodError, validateAppBuilderSettingsJson} from "./appbuildertypecheck";

const minimalValidSettings = {
	version: "1.0" as const,
};

describe("validateAppBuilderSettingsJson theme component defaultProps", () => {
	it("fails when registered Icon defaultProps violate schema", () => {
		const result = validateAppBuilderSettingsJson({
			...minimalValidSettings,
			themeOverrides: {
				components: {
					Icon: {
						defaultProps: {
							size: true,
						},
					},
				},
			},
		});

		expect(result.success).toBe(false);
		if (result.success) return;
		const msg = formatAppBuilderZodError(result.error);
		expect(msg).toMatch(/themeOverrides/i);
		expect(msg).toMatch(/components/i);
		expect(msg).toMatch(/Icon/i);
		expect(msg).toMatch(/defaultProps/i);
	});
});
```

- [ ] **Step 2: Run test and confirm it fails**

Run:

```bash
cd d:/projects/ShapeDiverCreateReactAppExample && pnpm exec jest src/shared/features/appbuilder/config/validateAppBuilderSettingsJson.themeComponents.test.ts --no-cache
```

Expected: **FAIL** — either `result.success` is true (no validation yet) or error message does not match paths (if partial implementation). Prefer **success === true** before implementation, proving validation is missing.

- [ ] **Step 3: Commit**

```bash
git add src/shared/features/appbuilder/config/validateAppBuilderSettingsJson.themeComponents.test.ts
git commit -m "SS-9463: add failing test for theme Icon defaultProps validation"
```

---

### Task 2: Registry module with `Icon` schema

**Files:**
- Create: `src/shared/features/appbuilder/config/themeComponentDefaultPropsRegistry.ts`

- [ ] **Step 1: Create registry (Zod only; no React imports)**

`Icon` matches `useProps("Icon", …)` in `src/shared/shared/ui/icon/Icon.tsx`. `defaultStyleProps` uses `size` and `stroke` only. v1 schema is **strict** on top-level keys so typos fail; only these two keys allowed (expand later when JSON needs more `Icon` theme keys).

```typescript
import {z} from "zod";

/**
 * Zod schemas for theme `defaultProps` of components registered here.
 * Keys MUST match the first argument of `useProps` / `usePropsAppBuilder` for that component.
 * Only listed components get deep validation; others stay opaque (Mantine JSON rules).
 */
export const themeComponentDefaultPropsRegistry = {
	Icon: z.strictObject({
		size: z.union([z.string(), z.number()]).optional(),
		stroke: z.union([z.string(), z.number()]).optional(),
	}),
} as const satisfies Record<string, z.ZodTypeAny>;

export type ThemeComponentDefaultPropsRegistryKey = keyof typeof themeComponentDefaultPropsRegistry;
```

- [ ] **Step 2: Run TypeScript check (optional quick gate)**

Run:

```bash
cd d:/projects/ShapeDiverCreateReactAppExample && pnpm exec tsc --noEmit
```

Expected: **PASS** (no consumers yet if registry unused — still should compile).

- [ ] **Step 3: Commit**

```bash
git add src/shared/features/appbuilder/config/themeComponentDefaultPropsRegistry.ts
git commit -m "SS-9463: add theme component defaultProps Zod registry (Icon pilot)"
```

---

### Task 3: Wire `superRefine` into `IAppBuilderSettingsJsonSchema`

**Files:**
- Modify: `src/shared/features/appbuilder/config/appbuildertypecheck.ts` (near `IAppBuilderSettingsJsonSchema` definition, ~1347–1358)

- [ ] **Step 1: Import registry**

At top of `appbuildertypecheck.ts` (with other imports from same folder):

```typescript
import {themeComponentDefaultPropsRegistry} from "./themeComponentDefaultPropsRegistry";
```

- [ ] **Step 2: Replace flat schema with refined schema**

Find:

```typescript
const IAppBuilderSettingsJsonSchema = z.strictObject({
	version: z.literal("1.0"),
	sessions: z.array(IAppBuilderSettingsSessionSchema).optional(),
	settings: IAppBuilderSettingsSettingsSchema.optional(),
	themeOverrides: MantineThemeOverrideSchema.optional(),
	appBuilderOverride: IAppBuilderSchema.optional(),
});

export const validateAppBuilderSettingsJson = (value: any) => {
	return IAppBuilderSettingsJsonSchema.safeParse(value);
};
```

Replace with (keep the same exported name `validateAppBuilderSettingsJson`; only the const name for base schema may change):

```typescript
const IAppBuilderSettingsJsonSchemaBase = z.strictObject({
	version: z.literal("1.0"),
	sessions: z.array(IAppBuilderSettingsSessionSchema).optional(),
	settings: IAppBuilderSettingsSettingsSchema.optional(),
	themeOverrides: MantineThemeOverrideSchema.optional(),
	appBuilderOverride: IAppBuilderSchema.optional(),
});

const IAppBuilderSettingsJsonSchema = IAppBuilderSettingsJsonSchemaBase.superRefine(
	(data, ctx) => {
		const components = data.themeOverrides?.components as
			| Record<string, {defaultProps?: unknown}>
			| undefined;
		if (!components || typeof components !== "object") return;

		for (const [componentName, entry] of Object.entries(components)) {
			const schema =
				themeComponentDefaultPropsRegistry[
					componentName as keyof typeof themeComponentDefaultPropsRegistry
				];
			if (!schema) continue;

			if (entry?.defaultProps === undefined) continue;

			const parsed = schema.safeParse(entry.defaultProps);
			if (parsed.success) continue;

			const basePath: (string | number)[] = [
				"themeOverrides",
				"components",
				componentName,
				"defaultProps",
			];
			for (const issue of parsed.error.issues) {
				ctx.addIssue({
					...issue,
					path: [...basePath, ...issue.path],
				});
			}
		}
	},
);

export const validateAppBuilderSettingsJson = (value: any) => {
	return IAppBuilderSettingsJsonSchema.safeParse(value);
};
```

Note: if TypeScript complains on `components` typing, use a narrower guard (`data.themeOverrides && typeof data.themeOverrides === "object" && "components" in data.themeOverrides`) instead of cast.

- [ ] **Step 3: Run failing test — expect PASS**

Run:

```bash
cd d:/projects/ShapeDiverCreateReactAppExample && pnpm exec jest src/shared/features/appbuilder/config/validateAppBuilderSettingsJson.themeComponents.test.ts --no-cache
```

Expected: **PASS**

- [ ] **Step 4: Run full `tsc`**

Run:

```bash
cd d:/projects/ShapeDiverCreateReactAppExample && pnpm exec tsc --noEmit
```

Expected: **PASS**

- [ ] **Step 5: Commit**

```bash
git add src/shared/features/appbuilder/config/appbuildertypecheck.ts
git commit -m "SS-9463: superRefine settings JSON for registered theme defaultProps"
```

---

### Task 4: Passing test — unknown `components` key still validates structurally

**Files:**
- Modify: `src/shared/features/appbuilder/config/validateAppBuilderSettingsJson.themeComponents.test.ts`

- [ ] **Step 1: Append second test**

```typescript
	it("does not deep-validate unknown component keys (policy: registry only)", () => {
		const result = validateAppBuilderSettingsJson({
			...minimalValidSettings,
			themeOverrides: {
				components: {
					NotRegisteredInAppBuilderRegistry123: {
						defaultProps: {
							anything: {nested: true},
							size: false,
						},
					},
				},
			},
		});

		expect(result.success).toBe(true);
	});
```

- [ ] **Step 2: Run both tests**

Run:

```bash
cd d:/projects/ShapeDiverCreateReactAppExample && pnpm exec jest src/shared/features/appbuilder/config/validateAppBuilderSettingsJson.themeComponents.test.ts --no-cache
```

Expected: **PASS** (opaque `defaultProps` still satisfies `JsonValueSchema` from Mantine branch).

- [ ] **Step 3: Commit**

```bash
git add src/shared/features/appbuilder/config/validateAppBuilderSettingsJson.themeComponents.test.ts
git commit -m "SS-9463: test unknown theme component keys skip deep validation"
```

---

## Plan self-review

**1. Spec coverage**

| Spec item | Task |
|-----------|------|
| `superRefine` / single `safeParse` | Task 3 |
| Registry-only policy | Task 2 + Task 4 |
| Paths under `themeOverrides.components…` | Task 1 assertions + Task 3 `basePath` |
| Dedicated config module | Task 2 file |
| No UI imports in registry | Task 2 (Zod only) |
| `.strict()` preference | Task 2 `z.strictObject` (Zod 4 — already strict) |
| FSD `features/appbuilder/config` | All paths under that slice |

**2. Placeholder scan** — none intentional.

**3. Type consistency** — `validateAppBuilderSettingsJson` name unchanged; registry keys use string `Icon` matching `useProps("Icon", …)`.

**Known follow-up (out of plan scope):** Expand `Icon` schema when JSON configs need additional `Partial<IconProps>` keys; add more components to `themeComponentDefaultPropsRegistry` the same way.

---

## Execution handoff

Plan complete and saved to `docs/superpowers/plans/2026-05-04-theme-component-defaultprops-validation.md`. Two execution options:

**1. Subagent-Driven (recommended)** — dispatch a fresh subagent per task, review between tasks, fast iteration.

**2. Inline Execution** — execute tasks in this session using executing-plans, batch execution with checkpoints.

Which approach?

If **Subagent-Driven:** use superpowers:subagent-driven-development (fresh subagent per task + two-stage review).

If **Inline:** use superpowers:executing-plans (batch with checkpoints).
