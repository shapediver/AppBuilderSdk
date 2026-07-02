# SS-9717: Filterable Database Component

## Motivation

Southern Sewing needs a searchable textile database UI inside App Builder. Users filter a large CSV dataset via hierarchical filters, then pick an item whose data is serialized into a String parameter value.

Client approved the TreeSelect filter UI (see [Jira comment 73450](https://shapediver.atlassian.net/browse/SS-9717?focusedCommentId=73450) and attached `treeselect.gif`).

Reference prototype: [Agnieszka's App Builder model](https://www.shapediver.com/app/builder/v1/main/latest/?redirect=0&slug=unHEkdNzahgHiF1iQDO278KoMX2CvC).

## Scope (v1)

| In scope | Out of scope (later) |
|----------|----------------------|
| CSV data via public `href` only | ShapeDiver `export` data source |
| `FilterableSelectComponent` with Mantine Tree filters | Accordion / chip-based filter UIs |
| Types from [AppBuilderShared PR #318](https://github.com/shapediver/AppBuilderShared/pull/318) (`IFilterableDatabaseSettings`) | `jsonEngine` implementation |
| Integration via `SelectComponent` → `ParameterStringComponent` | E-commerce `source` scrolling API changes |
| `fullwidthcards` and `grid` select types | Other select types |
| Unit tests for engine + filter logic | Cypress E2E against live model |

## Architecture

**Approach:** `FilterableDatabaseEngine` + shared filter logic + `IScrollingApi` adapter.

```
href ──fetch──► csvEngine.parse() ──► DatabaseTable
                                         │
                    filterLogic ◄────────┤
                    itemMapping  ◄───────┘
                                         │
              createFilterableDatabaseScrollingApi()
                                         │
              SelectComponentAsync (fullwidthcards | grid)
```

### Format-specific engines

`FilterableDatabaseEngine` is the extension point for future `jsonEngine`:

```typescript
export interface DatabaseTable {
  rows: string[][]; // 0-based column index → cell string
}

export interface FilterableDatabaseEngine {
  fetch(href: string): Promise<string>;
  parse(raw: string): DatabaseTable;
}
```

- **`csvEngine`** (v1): `fetch` via `fetch(href)`, `parse` via lightweight RFC-style CSV parser (quoted fields, comma delimiter).
- **`jsonEngine`** (future): same interface, different `parse`.

Multivalued cell content uses semicolons (`;`) per type definitions — handled in **filter logic**, not CSV parsing.

### Shared logic (format-agnostic)

| Module | Responsibility |
|--------|----------------|
| `filterLogic.ts` | Extract unique filter values; apply active filter selections (`multivalued`, `multiple`) |
| `itemMapping.ts` | Map filtered rows → `items: string[]` + `itemData` per `itemDataDefinition` |
| `createScrollingApi.ts` | Client-side paging adapter implementing `IScrollingApi<IScrollingApiItemTypeSelect>` |

### UI

**`FilterableSelectComponent`** (`entities/parameter/ui/select/`):

1. **TreeSelect filters** — one tree per filter group (or single tree with labeled sections); checkboxes for value selection; color swatch when `filter.type === "color"`.
2. **`SelectComponentAsync`** — renders filtered items with infinite scroll via scrolling API adapter.

**Wiring:**

```
ParameterStringComponent
  └─ selectSettings.database ? FilterableSelectComponent : SelectComponent (existing)
       └─ FilterableSelectComponent
            ├─ TreeSelect filter panel
            └─ SelectComponentAsync (type from selectSettings)
```

**Value serialization:** Reuse `SelectComponentAsync` behavior — if selected item has `itemData.data`, `JSON.stringify(data)` is passed to `onChange`; otherwise the item value string.

## Type definitions

Merge commit `fdc188b` into `features/appbuilder/config/appbuilder.ts`:

- `IFilterableDatabaseSettings` with `dataSource`, `itemDataDefinition`, `filters[]`
- `database?: IFilterableDatabaseSettings` on `IStringParameterSelectSettings`

Add matching Zod schemas in `appbuildertypecheck.ts`. Validation rules for v1:

- `database.dataSource.href` required (reject configs that only specify `export`)
- `database.filters` non-empty array
- Column indices are non-negative integers
- `selectSettings.type` must be `fullwidthcards` or `grid` when `database` is set

## Filter behavior

For each filter definition:

| Setting | Behavior |
|---------|----------|
| `multivalued: true` | Split cell by `;`, trim; match if **any** segment equals a selected value |
| `multivalued: false` | Whole cell must equal a selected value |
| `multiple: true` | User may select multiple values; row matches if **any** selected value matches |
| `multiple: false` | Single selection (TreeSelect radio-like behavior per group) |
| `filterValues` | Use provided list; else derive unique values from column (lazy: compute once after load) |
| `type: "color"` | Show `ColorSwatch` next to label; value still compared as string |

**Combined filters:** Row must pass **all** active filter groups (AND across filters, OR within a multi-select group).

## Scrolling API adapter

Client-side adapter over filtered rows:

| Property / method | Behavior |
|-------------------|----------|
| `items` | Current page of `IScrollingApiItemTypeSelect` |
| `loadMore` | Append next page (`pageSize` default 20) |
| `hasNextPage` | More filtered rows remain |
| `setSearchTerms` | Optional text search on mapped `displayname` / value within current filter set |
| `reset` / `resetState` | Clear pages; triggered when filter selection changes |
| `loading` | `true` during initial `href` fetch |
| `error` | Fetch or parse failure |

Filter state lives in `FilterableSelectComponent`; filter changes rebuild adapter state and call `reset`.

## File layout (submodule `src/shared`)

```
entities/parameter/
  lib/filterableDatabase/
    types.ts
    filterLogic.ts
    itemMapping.ts
    csvEngine.ts
    createScrollingApi.ts
    __tests__/
      filterLogic.test.ts
      itemMapping.test.ts
      csvEngine.test.ts
      createScrollingApi.test.ts
  model/filterableDatabase/
    useFilterableDatabase.ts
  ui/select/
    FilterableSelectComponent.tsx
    SelectComponent.tsx          (modify)
features/appbuilder/config/
  appbuilder.ts                  (modify — types)
  appbuildertypecheck.ts         (modify — Zod)
```

## Error handling

| Case | UX |
|------|-----|
| `href` fetch fails | Notification + inline error in component; empty item list |
| CSV parse error | Same |
| Invalid `database` settings | Existing `ParameterStringComponent` validation notification |
| Zero rows after filter | Empty state in select area; `onChange(null)` on filter change if prior selection not in list |

## Test plan

### Unit tests

- `csvEngine`: quoted fields, commas in quotes, empty rows skipped
- `filterLogic`: multivalued / multiple combinations, AND across filters
- `itemMapping`: all `itemDataDefinition` column mappings including `data` record
- `createScrollingApi`: paging, reset on filter change, `hasNextPage`

### Manual

1. Add `public/SS-9717.json` settings fixture pointing `database.dataSource.href` to committed sample CSV (from Jira attachment or subset).
2. `pnpm run start` with `VALIDATE_SETTINGS_FILE=public/SS-9717.json`.
3. Verify TreeSelect filters narrow items; selection updates parameter value.
4. Compare against Southern Sewing prototype behavior.

## Success criteria

- String parameter with `selectSettings.database` renders `FilterableSelectComponent` instead of plain text input.
- CSV loads from `href`; filters work per type definition; items paginate via existing async select UI.
- Selected item serializes to parameter value (JSON `data` when configured).
- `csvEngine` implements `FilterableDatabaseEngine`; shared modules are format-agnostic for future `jsonEngine`.
