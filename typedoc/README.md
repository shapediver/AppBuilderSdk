# TypeDoc tooling

This folder holds **custom TypeDoc integration** for App Builder: a plugin that turns theme-related TypeScript declarations into JSON artifacts for tooling, editors, and documentation pipelines.

## Plugin: `typedoc-plugin-config-filter`

**Purpose**

During TypeDoc conversion (`Converter.EVENT_RESOLVE_END`), the plugin scans every reflection that carries an **`@docAttached`** marker. For each match it builds a **configuration-doc entry**: where the setting lives in JSON (`@configPath`), a stable display name, optional prop listings, and optional external documentation links.

It writes two files into **`public/`** (created if missing):

| File | Description |
|------|-------------|
| **`doc-flat.json`** | Array of entries; easy to search or feed into scripts. |
| **`doc-nested.json`** | Same data nested by dot-path from `@configPath` (e.g. `themeOverrides.components.*.defaultProps`). |

Duplicate `@configPath` values are deduplicated (last wins); duplicates log a warning.

**Why it exists**

Mantine theme overrides and App Builder theme props are spread across many components. This plugin extracts **structured metadata** (paths, prop names, types, summaries, defaults from JSDoc) without maintaining a separate manual schema.

### Block tags (conventions)

Declared under `"blockTags"` in root **`typedoc.json`** so TypeDoc preserves them.

| Tag | Required | Role |
|-----|----------|------|
| **`@docAttached`** | Yes | Marks this reflection as a theme-doc source. |
| **`@configPath`** | Yes | Dot path for JSON overrides (e.g. `themeOverrides.components.MyComponent.defaultProps`). |
| **`@displayName`** | No | Human-facing name in output; falls back to the reflection name. |
| **`@docLink`** | No | URL when props should not be inlined (e.g. full Mantine `PaperProps` docs). |
| **`@default`**, **`@minimum`**, **`@maximum`**, **`@example`** | No | On individual props; copied into flat `properties` when present. |

Example (minimal):

```ts
/**
 * Short summary for docs.
 *
 * @docAttached
 * @configPath themeOverrides.components.MyWidget.defaultProps
 * @displayName MyWidget
 */
export interface MyWidgetStyleProps {
	/** Label shown in the header. @default "Settings" */
	title?: string;
}
```

For types backed by an external surface only:

```ts
/**
 * Wraps Mantine Paper; theme follows Paper props.
 *
 * @docAttached
 * @configPath themeOverrides.components.MyCard.defaultProps
 * @displayName MyCard
 * @docLink https://mantine.dev/core/paper/?t=props
 */
export type MyCardStyleProps = PaperProps;
```

### Property extraction notes

- **`export interface`** with explicit members is extracted reliably into **`properties`**.
- **`export type`** aliases (especially intersections and `Partial<…>`) may produce **no members** until refactored (e.g. `interface … extends …`) or documented via **`@docLink`**.
- The merger walks intersections and unwraps optional wrappers where TypeDoc exposes structure; complex mapped types may still yield an empty list.

### Tests

Logic shared by the plugin lives in **`typedoc-plugin-config-filter/buildArtifacts.ts`** (and the `.js` twin used where Node loads plain JS). Unit tests: **`typedoc-plugin-config-filter/buildArtifacts.test.ts`**.

```bash
pnpm exec jest typedoc/typedoc-plugin-config-filter/buildArtifacts.test.ts
```

## How to run TypeDoc

From the repository root:

```bash
pnpm run docs
```

Configuration: **`typedoc.json`** at the repo root (entry points, `emit`, plugin path, `blockTags`, etc.). The plugin path currently references:

`./typedoc/typedoc-plugin-config-filter/index.ts`

After a successful run, check **`public/doc-flat.json`** and **`public/doc-nested.json`** for new or updated entries.
