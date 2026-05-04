# SS-9298: Design — Config documentation for LLM (TypeDoc + custom tags)

## Context

- **Jira:** [SS-9298](https://shapediver.atlassian.net/browse/SS-9298) — AppBuilder documentation: automated generation from TSDoc via TypeDoc; focus on settings that are configurable (components using `useProps` from `@mantine/core`, aligned with theme overrides such as in `useCustomTheme`).
- **Goal:** Produce artifacts that are easy for LLMs to consume, starting with one fully annotated component, then rolling the same tagging pattern to other `MantineThemeComponent` / `useProps` components.
- **Reference implementation (first component):** `StyleProps` on `AppBuilderAppShellTemplatePage` — `@docAttached`, `@configPath`, `@displayName`, per-property JSDoc with `@default`, `@minimum`, `@maximum`, `@example` where useful.

## Outputs

Two generated JSON files under `public/` (written by the existing TypeDoc plugin `typedoc/typedoc-plugin-config-filter`, extended):

| File | Purpose |
|------|---------|
| `doc-flat.json` | **LLM-primary:** flat array of objects; each object includes explicit `configPath`. |
| `doc-nested.json` | **Human / config mirror:** nested structure matching JSON config path segments (as in SS-9298). |

Naming is fixed as above for this iteration.

## Marker and tags (source code contract)

- **`@docAttached`** — include this declaration in generated docs (required for extraction).
- **`@configPath`** — dot-separated path where this block belongs in config (e.g. `themeOverrides.components.AppBuilderAppShellTemplatePage.defaultProps`). Required for an entry to appear in **`doc-flat.json`** and for placement in **`doc-nested.json`**.
- **`@displayName`** — optional; overrides display/name field for the entry when present.
- **Per-property block tags** (optional, parsed when present): `@default`, `@minimum`, `@maximum`, `@example`. Values are normalized (strip code fences / surrounding quotes) as in the current plugin.

`typedoc.json` **`blockTags`** must list any custom tags used so TypeDoc preserves them.

## Flat entry schema (`doc-flat.json`)

Root: **JSON array**.

Each element:

| Field | Type | Required | Notes |
|-------|------|----------|--------|
| `configPath` | string | yes | From `@configPath`; unique key for indexing (see duplicates policy). |
| `name` | string | yes | From `@displayName` trimmed text, else reflection name. |
| `summary` | string | no | Concatenated summary of the `@docAttached` declaration comment. |
| `source` | string | yes | First source file name from TypeDoc, or `"unknown"`. |
| `properties` | array | no | Same shape as today: `name`, `description`, `type`, optional `default`, `minimum`, `maximum`, `example` from child reflections and tags. |

Reflections with `@docAttached` but **without** `@configPath` are **skipped** for both outputs (nested already skips when path missing); optional `console.warn` for visibility.

## Nested shape (`doc-nested.json`)

Unchanged intent: object nested by splitting `configPath` on `.`; leaf value is an object containing at least `properties` (array), matching current plugin behavior.

## Plugin behavior

- **Hook:** `Converter.EVENT_RESOLVE_END` (current).
- **Selection:** reflections whose comment includes `@docAttached`.
- **Dual emit:** build in-memory list of config items (as today); write **`doc-flat.json`** as `JSON.stringify(array)`; build nested structure and write **`doc-nested.json`**.
- **Align comments:** plugin comments that refer to obsolete filenames should match actual output names (`doc-flat.json`, `doc-nested.json`).

## Duplicate `configPath`

If two entries share the same `configPath`:

- Emit **`console.warn`** listing the path.
- **Nested:** last write wins (same as sequential `set` today).
- **Flat:** last entry wins by replacing prior element with the same `configPath`, so the array stays **deduplicated by `configPath`** for LLM consumption.

## Verification

- Run the project’s TypeDoc script (see `package.json`).
- After run: `public/doc-flat.json` is valid JSON array; `public/doc-nested.json` is valid JSON object.
- With only `AppBuilderAppShellTemplatePage` annotated: `doc-flat.json` contains **one** element with expected `configPath` and non-empty `properties` aligned with `StyleProps`.

## Rollout

1. Land plugin extension + both files generation.
2. Keep `AppBuilderAppShellTemplatePage` as the golden sample.
3. Add `@docAttached` / `@configPath` / `@displayName` and property tags to remaining theme-configurable components incrementally; CI or local script verifies generation succeeds.

## Non-goals (this iteration)

- Replacing TypeDoc HTML docs site as the primary developer documentation.
- Documenting every TypeScript interface in the repo — only opt-in `@docAttached` surfaces.
- Changing Mantine or runtime behavior of `useProps`.

## Related files

- `typedoc.json` — TypeDoc config and `blockTags`.
- `typedoc/typedoc-plugin-config-filter/index.ts` / `index.js` — generator logic.
- `.cursor/rules/custom-component.mdc` — pattern for theme props and `useProps`.
