# Theme component `defaultProps` validation (settings JSON)

**Related:** SS-9463 (typed theme properties, documentation, Zod 4), follow-up on component-level validation.

**Status:** Approved design (brainstorming session 2026-05-04).

## Problem

`validateAppBuilderSettingsJson` uses `MantineThemeOverrideSchema`, where `themeOverrides.components` is a string-keyed record and each component entry allows `defaultProps` as arbitrary JSON (`JsonValueSchema`). That correctly guards the overall Mantine theme shape but does **not** validate App Builder–specific theme keys passed to `useProps` / `usePropsAppBuilder` (e.g. `buttonProps` on a named component). Invalid or mistyped nested props therefore pass parsing and never surface as Zod errors on settings load.

## Goals

1. When settings JSON is loaded and validated (same path as today: `useAppBuilderSettings` → `validateAppBuilderSettingsJson` → failure throws with `formatAppBuilderZodError`), **invalid `defaultProps` for registered App Builder components must fail validation** with clear paths (Zod 4 `prettifyError`).
2. **No second validation channel** is required at this stage (no mandatory duplicate check in `ThemeProvider`); scope is settings JSON parse only.
3. Align with SS-9463 direction: Zod as source for strict JSON-side validation; optional later use for JSON Schema / docs (`meta`) on the same schemas where useful.

## Non-goals

- Validating Mantine core component names (e.g. `Button`) beyond what `MantineThemeOverrideSchema` already allows.
- Codegen pipelines (TypeScript ↔ Zod) in this iteration; registry may duplicate types—mitigate with tests and conventions.
- CI-only or editor-only validation without wiring into `validateAppBuilderSettingsJson`.

## Decisions

| Topic | Choice |
|--------|--------|
| Mechanism | **Approach 1:** extend `validateAppBuilderSettingsJson` using `superRefine` (or equivalent single-schema pass) so one `safeParse` / one error stream. |
| `components` keys | **Policy 1 — registry only:** apply strict Zod only for keys present in an explicit **registry** of App Builder component theme names. Any other key keeps current behavior (opaque JSON under Mantine theme rules); no new global ban on unknown keys. |
| Error UX | Reuse `formatAppBuilderZodError` / `prettifyError`; issue paths should include `themeOverrides.components.<ComponentName>.defaultProps…` where applicable. |

## Architecture

### Registry

- Maintain a mapping: **component theme name** (string, must match `useProps` / `usePropsAppBuilder` first argument) → **Zod schema** for the object merged into / validated as `defaultProps` for that component.
- Schemas describe the **style/theme props object** only (the shape intended for theme `defaultProps`), not full React props with callbacks unless those are intentionally part of theme config (avoid per brainstorming / project conventions).

### Integration point

- Extend `IAppBuilderSettingsJsonSchema` with `superRefine` (after structural parse) **or** a nested refine on `themeOverrides` only:
  - If `themeOverrides?.components` is absent or not an object, skip.
  - For each key `name` in `components`:
    - If `name` is in the registry, parse `entry.defaultProps` (when defined) with the registry schema; on failure, add Zod issues with paths rooted under `themeOverrides`, `components`, and `name`.
    - If `name` is not in the registry, **do not** run deep validation (policy 1).

### Module boundaries (FSD)

- Prefer a dedicated module under `src/shared/features/appbuilder/config/` (e.g. `themeComponentDefaultPropsRegistry.ts` or similar) exporting the registry and a small helper used from `appbuildertypecheck.ts`.
- Avoid importing UI from `config/`; registry should depend only on Zod + types/schemas. If a schema must live next to a component, re-export it from the registry slice to keep `appbuildertypecheck` import graph clean and respect `@feature-sliced` boundaries.

### Strictness of per-component schemas

- Prefer **`.strict()`** (or explicit `.passthrough()` only where JSON must allow forward-compatible keys) on registry schemas so typos in known keys fail fast. Document the chosen default in the registry file.

## Operational rules

1. **Adding a component** that supports theme `defaultProps` in JSON: register its name and Zod schema in the registry; add/adjust a unit test fixture.
2. **Renaming** a `useProps` identifier: treat as breaking for JSON configs; update registry key and docs/changelog as needed.

## Testing

- Unit test: `validateAppBuilderSettingsJson` with minimal valid settings plus `themeOverrides.components.<RegisteredName>.defaultProps` containing an invalid value → `success === false`, error message/path substring assertions.
- Unit test: unknown component name with arbitrary `defaultProps` → still **succeeds** structurally (policy 1), assuming the rest of the document is valid.

## Follow-up (optional, not part of this spec)

- Generate JSON Schema from registry Zods for documentation (SS-9463).
- Stricter policy for unknown keys if product later forbids arbitrary Mantine overrides from JSON.
