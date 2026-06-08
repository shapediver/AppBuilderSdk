# Mantine props mirror + ts-to-zod for theme `defaultProps` validation

**Related:** SS-9463, [Theme component defaultProps validation](./2026-05-04-theme-component-defaultprops-validation-design.md), [Zod-first Icon plan](../plans/2026-05-11-zod-first-icon-theme-defaultprops.md).

**Status:** Approved design (brainstorming 2026-05-27). **Amendment 2026-05-27:** public types use **ts-to-zod + `z.infer`** (option B).

## Problem

App Builder custom components accept nested Mantine prop bags (`buttonProps`, `stackPaperProps`, spread into `Group` / `Button`, etc.). Hand-written Zod in each `*.types.ts` duplicates Mantine unions and drifts from `@mantine/core` types.

`themeComponentDefaultPropsRegistry` validates only registered keys at the **top level** of `themeOverrides.components`. Mantine-heavy keys were explicitly **skipped** (Appendix B). Nested `containerThemeOverrides` is not deep-validated. `MantineThemeComponentSchema.defaultProps` remains opaque `JsonValue`.

**Goals (confirmed):**

1. **Runtime (A):** strict validation of settings JSON for registered theme `defaultProps` — invalid Mantine fields fail `validateAppBuilderSettingsJson` with clear paths.
2. **Single source of truth (B):** TypeScript theme surfaces and Zod schemas stay aligned; no `z.any()` in production validation schemas.
3. **Naming:** Mantine-first, no `theme-json` / `ThemeJson` / `-json` suffixes in paths or type names.

**Non-goals:**

- AST/codegen from `@mantine/core` `.d.ts` (phase 2+ idea only).
- Validating non-serializable props (`onClick`, `children`, `ReactNode` labels) in settings JSON.
- Mandatory JSON Schema / LLM export in this iteration.
- Banning unknown `themeOverrides.components` keys globally (registry-only policy unchanged).

## Decision summary

| Topic | Choice |
|--------|--------|
| Approach | **ts-to-zod + `z.infer` (option B):** Zod schema is the public runtime source of truth; TypeScript props types are **derived**, not duplicated |
| Location | `src/shared/shared/mantine-props/` (submodule) |
| Type names | `MantineButtonProps`, `MantineGroupProps`, … = `z.infer<typeof mantine*PropsSchema>` |
| Zod exports | `mantineButtonPropsSchema`, … (generated `*.zod.ts`) |
| Codegen input | `*.schema-input.ts` only (not imported by app code); no `@mantine/*` in inputs |
| Mantine alignment | Compile-time `MantinePropsSubset<MantineProps, z.infer<typeof schema>>` asserts |
| Registry | Same `themeComponentDefaultPropsRegistry`; add Mantine core keys + expand custom entries via schema composition |
| Unknown keys | Still opaque `JsonValue` until registered (policy 1) |

## Serializable contract

**Mantine props mirror** = subset of Mantine component props that may appear in settings / theme `defaultProps` as JSON:

| Allowed | Excluded |
|---------|----------|
| `string`, `number`, `boolean`, `null` | Functions, refs |
| JSON arrays and objects | `children`, `leftSection`, `rightSection`, render props |
| `styles` / `classNames` trees | Full `ReactNode` (e.g. Tooltip `label` → only `string` in mirror if needed) |
| Responsive `{ base, xs, sm, md, lg, xl }` | |

Registered component schemas use **`z.strictObject()`** — unknown keys fail validation.

## Directory layout (option B: ts-to-zod + `z.infer`)

```
src/shared/shared/mantine-props/
  primitives.ts                    # shared type-only helpers (MantineStylesApi, …) for schema-input files
  button.schema-input.ts           # codegen input — interface MantineButtonProps (dev-only surface)
  button.zod.ts                      # generated — mantineButtonPropsSchema
  button.ts                          # public: re-export schema + type MantineButtonProps = z.infer<…>
  group.schema-input.ts / group.zod.ts / group.ts
  …
  index.ts                           # re-export public *.ts facades only
  assert-mantine-subset.test-d.ts    # MantinePropsSubset on z.infer<typeof schema>
```

**Import rule for app / registry / widgets:** `@AppBuilderLib/shared/mantine-props/button` or `button.zod` for schema — **never** `*.schema-input.ts`.

### Codegen input rules (`*.schema-input.ts`)

- Export `interface Mantine{Component}Props` (name must match ts-to-zod / `getSchemaName` → `mantine{Component}PropsSchema`).
- **No** imports from `@mantine/*`, `react`, or viewer packages.
- Prefer inline primitive unions in the same file when cross-file import would yield `z.any()` in output.
- JSDoc `@see` Mantine docs; use `/** @strict */` on the props interface for `z.strictObject`.

### Public module rules (`{component}.ts`, not schema-input)

Each public facade file:

```typescript
import type {z} from "zod";
import {mantineButtonPropsSchema} from "./button.zod";

export {mantineButtonPropsSchema};
export type MantineButtonProps = z.infer<typeof mantineButtonPropsSchema>;
```

No duplicate `export interface MantineButtonProps` in public modules.

### Codegen

- **Tool:** [ts-to-zod](https://www.npmjs.com/package/ts-to-zod) (devDependency; Zod 4).
- **Script:** `generate:mantine-props-zod` runs `ts-to-zod` per `*.schema-input.ts` → matching `*.zod.ts` (CLI paths from repo root; see `package.json`).
- **Output:** committed `*.zod.ts` with `// Generated by ts-to-zod — do not edit`
- **CI:** run generate + assert clean git diff (recommended).

**Why no Mantine imports in schema-input:** ts-to-zod emits `z.any()` for external types.

**Why `z.infer`:** one public TypeScript surface aligned with JSON validation; schema-input interfaces are implementation detail for regeneration only (same idea as Zod-first `Icon.types.ts`, but Zod is generated).

### Primitives (`primitives.ts`)

Shared building blocks (names illustrative):

- `MantineSize`, `MantineSpacing`, `MantineColor`
- `MantineResponsive<T>`
- `MantineStylesApi` — nested records; leaf values use existing `JsonValue` / `JsonValueSchema` from `appbuildertypecheck.ts` (not `z.any()`)

## TypeScript ↔ Mantine ↔ Zod alignment

```typescript
import type { ButtonProps } from "@mantine/core";
import type { z } from "zod";
import { mantineButtonPropsSchema } from "@AppBuilderLib/shared/mantine-props/button.zod";

type MantinePropsSubset<Mantine, JsonProps> = JsonProps extends Partial<Mantine> ? true : false;
type MantineButtonProps = z.infer<typeof mantineButtonPropsSchema>;
type _Button = MantinePropsSubset<ButtonProps, MantineButtonProps>;
```

(`assert-mantine-subset.test-d.ts` may import `MantineButtonProps` from the public `button.ts` facade — it must be identical to `z.infer`.)

- Optional: ts-to-zod `getIntegrationTestFile` to assert generated schema matches schema-input interfaces.
- Adding a field in **schema-input** that is incompatible with Mantine **breaks `tsc`** on the subset assert after regen.
- Workflow: edit `*.schema-input.ts` → `pnpm run generate:mantine-props-zod` → commit schema-input + `*.zod.ts` (public `*.ts` facades usually unchanged unless re-exports renamed).

## Registry and validation integration

### Registry

`themeComponentDefaultPropsRegistry.ts` imports schemas from `@AppBuilderLib/shared/mantine-props` and component `*.types.ts`:

```typescript
export const themeComponentDefaultPropsRegistry = {
  // App Builder (existing + composed)
  Icon: IconThemeDefaultPropsSchema,
  AppBuilderHorizontalContainer: mantineGroupPropsSchema, // or merge app-only fields
  // Mantine core (new)
  Button: mantineButtonPropsSchema,
  Text: mantineTextPropsSchema,
  Paper: mantinePaperPropsSchema,
  Accordion: mantineAccordionPropsSchema,
  Group: mantineGroupPropsSchema,
} as const satisfies Record<string, z.ZodTypeAny>;
```

`superRefine` in `appbuildertypecheck.ts` unchanged: for each `themeOverrides.components[name].defaultProps`, if `name` is in registry → `schema.safeParse`.

### Custom components with nested Mantine

Example `AppBuilderStackUiWidgetComponent`:

```typescript
export const AppBuilderStackUiWidgetThemeDefaultPropsSchema = z.strictObject({
  stackPaperProps: mantinePaperPropsSchema.optional(),
  stackProps: mantineStackPropsSchema.optional(),
  buttonForwardProps: mantineButtonPropsSchema.optional(),
  buttonBackProps: mantineButtonPropsSchema.optional(),
  itemTextProps: mantineTextPropsSchema.optional(),
  iconForwardProps: IconThemeDefaultPropsSchema.optional(),
});
```

### Component theme types

Theme/style surfaces use mirror types instead of raw Mantine props:

```typescript
// Before
buttonForwardProps?: ButtonProps;
// After
buttonForwardProps?: MantineButtonProps;
```

Runtime `{...buttonForwardProps}` remains valid when `MantineButtonProps extends Partial<ButtonProps>` (assert).

### Migrating existing Zod-first schemas

e.g. `AppBuilderHorizontalContainer.types.ts`: remove duplicated `mantineSpacingJsonSchema` / `groupFlexWrapJsonSchema`; delegate to `mantineGroupPropsSchema` (+ app-only fields like `orientation` on parent container).

### Nested `containerThemeOverrides` (phase 2)

Recursive helper `validateThemeComponentsRecord(components, ctx, basePath)` applying the same registry at every nested `components` node. Required for configs like `public/theme08.json` (`styles`, `pt`, `pb` on nested `AppBuilderHorizontalContainer`).

## Appendix B policy update

| Before | After |
|--------|--------|
| Skip registry for Mantine-heavy custom components | Skip only until `Mantine*Props` mirror + registry entry exist |
| Manual duplicate unions per component | Compose from `mantine-props` schemas |

## Rollout phases

| Phase | Work | Done when |
|-------|------|-----------|
| **0** | `mantine-props/` infra, primitives, ts-to-zod config, CI generate check, assert-subset harness, one pilot (`MantineGroupProps` / horizontal container) | `tsc`, Jest green |
| **1** | Mantine core used in `public/*.json`: `Button`, `Text`, `Paper`, `Accordion`, `Group` | Top-level `themeOverrides.components` in `theme08.json` validates |
| **2** | Re-wire registered app schemas; extend Group mirror (`pt`, `pb`, `styles`, …) | No duplicate manual unions in `pages/config/*.types.ts` |
| **3** | Mantine-heavy custom (`TooltipWrapper`, `AppBuilderStackUiWidgetComponent`, …) | Nested `*Props` composed from `mantine-props` |
| **4** | Recursive refine for `containerThemeOverrides` | Nested paths in `theme08.json` validated |
| **5** | **ts-to-zod + `z.infer` refactor** | `*.schema-input.ts` + public `*.ts` facades; no duplicate `interface` in app imports |

## Testing

- Extend `validateAppBuilderSettingsJson.themeComponents.test.ts` per registered key.
- `assert-mantine-subset.test-d.ts` included in submodule `tsc --noEmit`.
- Batch validate `public/**/*.json` after phase 1+ (existing SS-9463 practice).
- Post-generate CI diff check.

## Operational rules

1. New JSON field → edit `*.schema-input.ts` → `pnpm run generate:mantine-props-zod` → commit input + `*.zod.ts` → register component key if needed. Public `Mantine*Props` updates via `z.infer` automatically.
2. Mantine upgrade → fix schema-input + subset asserts; regenerate Zod.
3. Registry imports: `@AppBuilderLib/shared/mantine-props/*.zod` for schemas; `@AppBuilderLib/shared/mantine-props/{component}` for types (facade). Do not import `*.schema-input.ts`.
4. Do not import `*.schema-input.ts` from components, registry, or tests — codegen input only.

## References

- ts-to-zod: external imports become `z.any()` — mirror must be self-contained.
- Existing `JsonValueSchema` in `appbuildertypecheck.ts` for opaque theme slots and style leaves.
- Context7: `/fabien0102/ts-to-zod` (Zod 4, `Partial`/`Pick`, config file, integration tests).
