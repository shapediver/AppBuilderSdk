# SS-9717 Filterable Database Component Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a `FilterableSelectComponent` that loads CSV from a public URL, filters rows via Mantine filter UI (Accordion + checkboxes), and displays results through the existing `SelectComponentAsync` infinite-scroll path.

**Architecture:** `FilterableDatabaseEngine` (`csvEngine` | `jsonEngine`) + `resolveDataSource` (`href` | `export`) → shared `filterLogic` / `itemMapping` → client-side `IScrollingApi` adapter → `SelectComponentAsync`. Types from commit `fdc188b` merged into `appbuilder.ts` with Zod validation.

**Tech Stack:** React 19, TypeScript, Mantine v8 (Accordion, Checkbox, Pill), Zustand (existing scrolling store bypassed — local adapter), Jest, Zod.

**Status (2026-06-30):** Phases 1–5 Tasks 32–36 done. **Phase 6** (flicker + value serialization) done in working tree, **uncommitted**. **79 tests** pass (`filterableDatabase` + `resolveStringSelectEmitValue`). Task 37 manual QA pending. Parent fixture `SS-9717.json` + submodule pointer may still need commit.

**Status (2026-06-25):** **Phase 7** (lazy-load scrolling fixes + `database-full.csv` fixture) done in working tree, **uncommitted**. `createScrollingApi` tests: **10** passed. `tsc --noEmit` clean. Task 37 manual QA still pending (re-verify lazy scroll after Phase 7).

**Manual test URLs:**
- Full fixture: `http://localhost:3000/?g=/SS-9717.json&redirect=0` (prefer leading `/` on `g`)
- Legacy port note: dev server may use **3001** when 3000 is busy
- Minimal session (Settings textarea): `http://localhost:3000/?g=/SS-9717--2.json`

**Spec:** `docs/superpowers/specs/2026-06-23-ss-9717-filterable-database-design.md`

**Branch:** `task/SS-9717-Filterable-database-component` (parent + `src/shared` submodule)

---

## File map

### Phase 1 (original)

| File | Action | Status |
|------|--------|--------|
| `src/shared/features/appbuilder/config/appbuilder.ts` | Add `IFilterableDatabaseSettings`, `database` on select settings | Done |
| `src/shared/features/appbuilder/config/appbuildertypecheck.ts` | Zod schemas + href refinement | Done (+ Phase 2 fixes) |
| `src/shared/entities/parameter/lib/filterableDatabase/types.ts` | Create | Done |
| `src/shared/entities/parameter/lib/filterableDatabase/csvEngine.ts` | Create | Done |
| `src/shared/entities/parameter/lib/filterableDatabase/filterLogic.ts` | Create | Done |
| `src/shared/entities/parameter/lib/filterableDatabase/itemMapping.ts` | Create | Done |
| `src/shared/entities/parameter/lib/filterableDatabase/createScrollingApi.ts` | Create | Done (+ Phase 2 fixes) |
| `src/shared/entities/parameter/lib/filterableDatabase/__tests__/*.test.ts` | Create | Done (**71** tests in filterableDatabase scope) |
| `src/shared/entities/parameter/model/filterableDatabase/useFilterableDatabase.ts` | Create | Done (+ Phase 2) |
| `src/shared/entities/parameter/ui/select/FilterableSelectComponent.tsx` | Create | Done (thin orchestrator) |
| `src/shared/entities/parameter/ui/select/SelectComponent.tsx` | Wire `database` branch | Done |
| `public/SS-9717.json` | Test fixture (parent repo) | Done (+ Phase 2) |
| `public/textile-database-sample.csv` | Trimmed CSV sample (parent repo) | Done |

### Phase 2 (integration, UI, bugfixes)

| File | Action | Status |
|------|--------|--------|
| `src/shared/entities/parameter/lib/filterableDatabase/filterableDatabaseSettingsSchema.ts` | Extract Zod schema (avoid circular import with theme registry) | Done |
| `src/shared/entities/parameter/lib/filterableDatabase/buildActiveFilterTags.ts` | Pure helper for active-filter pills | Done |
| `src/shared/entities/parameter/lib/filterableDatabase/resolveFilterColor.ts` | Named color → hex for `ColorSwatch` | Done |
| `src/shared/entities/parameter/lib/filterableDatabase/__tests__/buildActiveFilterTags.test.ts` | Unit test | Done |
| `src/shared/entities/parameter/ui/filterableDatabase/FilterableDatabaseFilters.tsx` | Accordion container | Done |
| `src/shared/entities/parameter/ui/filterableDatabase/FilterableDatabaseFilterGroup.tsx` | One filter group panel | Done |
| `src/shared/entities/parameter/ui/filterableDatabase/FilterableDatabaseFilterOption.tsx` | Checkbox row + optional swatch | Done |
| `src/shared/entities/parameter/ui/filterableDatabase/FilterableDatabaseActiveFilterTags.tsx` | Removable `Pill` tags | Done |
| `src/shared/entities/parameter/ui/filterableDatabase/FilterableDatabaseFilters.module.css` | Row hover + accordion item gap | Done |
| `src/shared/entities/parameter/config/selectComponent.theme.types.ts` | Allow `database`, `height`, `searchable`, etc. in theme `componentSettings` | Done |
| `src/shared/entities/parameter/ui/ParameterSelectComponent.tsx` | Pass `database={settings.database}` | Done |
| `src/shared/entities/parameter/ui/ParameterStringComponent.tsx` | `componentSettings` theme merge + `database` render branch; pass `value` to `SelectComponent` | Done |
| `src/shared/entities/parameter/model/select/useSelectAsync.ts` | `resetState` + `searchRevision` deps; `onSyncScrollingApiState` callback | Done |
| `src/shared/entities/parameter/ui/select/SelectComponentAsync.tsx` | `prependTopSection`, `onSyncScrollingApiState`, conditional reset + `displayValue` JSON→key | Done (+ review fixes) |

### Phase 3 (additional data sources)

| File | Action | Status |
|------|--------|--------|
| `entities/parameter/lib/filterableDatabase/fetchDataSource.ts` | Shared `fetchText(href)` | Done (`ff5f016`) |
| `entities/parameter/lib/filterableDatabase/jsonEngine.ts` | JSON parse → `DatabaseTable` (Option A) | Done |
| `entities/parameter/lib/filterableDatabase/resolveEngine.ts` | `format` explicit or `.json`/`.csv` suffix | Done |
| `entities/parameter/lib/filterableDatabase/exportEngine.ts` | Session export → raw text via `getExport` + `actions.request/fetch` | Done (`a4e192a`) |
| `entities/parameter/lib/filterableDatabase/resolveDataSource.ts` | `fetchRawText` — href precedence over export | Done |
| `entities/parameter/lib/filterableDatabase/__tests__/jsonEngine.test.ts` | 6 parse tests | Done |
| `entities/parameter/lib/filterableDatabase/__tests__/resolveEngine.test.ts` | 5 resolution tests | Done |
| `entities/parameter/lib/filterableDatabase/__tests__/exportEngine.test.ts` | Mock export store | Done |
| `entities/parameter/lib/filterableDatabase/__tests__/resolveDataSource.test.ts` | href vs export routing | Done |
| `features/appbuilder/config/appbuilder.ts` | `dataSource.format?: "csv" \| "json"` | Done |
| `public/textile-database-sample.json` | Parent repo JSON sample (Option A) | Done (uncommitted in parent) |
| `tsconfig.jest.json` (parent repo) | Explicit `baseUrl` + `paths` for `@AppBuilderLib/*` in tests | Done |

### Phase 4 (filter dropdown UX)

| File | Action | Status |
|------|--------|--------|
| `ui/filterableDatabase/FilterableDatabaseFilterSelect.tsx` | Combobox + pills in input; dropdown hosts filters | Done |
| `ui/filterableDatabase/FilterableDatabaseActiveFilterTags.tsx` | Removable pills inside `PillsInput` | Done |
| `lib/filterableDatabase/buildFilterSelectPlaceholder.ts` | Placeholder helper | Done |
| `lib/filterableDatabase/__tests__/buildFilterSelectPlaceholder.test.ts` | Unit test | Done |
| `lib/filterableDatabase/buildFilterTreeData.ts` | Tree metadata incl. `text-input` nodes | Done |
| `lib/filterableDatabase/__tests__/buildFilterTreeData.test.ts` | Unit test | Done |
| `lib/filterableDatabase/buildFilterRenderSegments.ts` | Batch accordion groups; preserve order with `inline` filters | Done |
| `lib/filterableDatabase/__tests__/buildFilterRenderSegments.test.ts` | Order / batching tests | Done |
| `features/appbuilder/config/appbuilder.ts` | `type: "text"`, `inline?: boolean` on filters | Done |
| `lib/filterableDatabase/filterableDatabaseSettingsSchema.ts` | Zod: `type`, `inline` | Done |
| `lib/filterableDatabase/filterLogic.ts` | Text substring match; `filterNodesBySearch`; select-all helpers | Done |
| `ui/filterableDatabase/FilterableDatabaseFilterGroup.tsx` | Accordion + `FilterableDatabaseInlineFilter`; shared `FilterableDatabaseFilterGroupBody` | Done |
| `ui/filterableDatabase/FilterableDatabaseFilterOption.tsx` | `keepComboboxOpen` on option rows (inverted focus pattern) | Done |
| `public/SS-9717.json` | TenCards: Name `type: "text"`, `inline: true`; Category/Color/Materials | Done |

---

### Task 1: Type definitions (`appbuilder.ts`)

**Files:**
- Modify: `src/shared/features/appbuilder/config/appbuilder.ts`

- [ ] **Step 1: Cherry-pick type definitions**

In submodule:

```bash
cd src/shared
git cherry-pick fdc188b
```

If conflicts, manually add `IFilterableDatabaseSettings` and `database?: IFilterableDatabaseSettings` on `IStringParameterSelectSettings` per commit `fdc188b`.

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd src/shared && pnpm exec tsc --noEmit -p tsconfig.json 2>&1 | head -20
```

Expected: no new errors from type additions.

- [ ] **Step 3: Commit (submodule)**

```bash
cd src/shared
git add features/appbuilder/config/appbuilder.ts
git commit -m "SS-9717: Add filterable database type definitions"
```

---

### Task 2: Zod validation schemas

**Files:**
- Modify: `src/shared/features/appbuilder/config/appbuildertypecheck.ts`
- Test: `src/shared/features/appbuilder/config/__tests__/filterableDatabaseSettings.test.ts`

- [ ] **Step 1: Write failing tests**

Create `src/shared/features/appbuilder/config/__tests__/filterableDatabaseSettings.test.ts`:

```typescript
import {validateStringParameterSettings} from "../appbuildertypecheck";

const validDatabase = {
	type: "fullwidthcards",
	database: {
		dataSource: {href: "https://example.com/data.csv"},
		itemDataDefinition: {value: 0, displayname: 1},
		filters: [{column: 2}],
	},
};

describe("filterable database settings", () => {
	it("accepts selectSettings with database.href", () => {
		const result = validateStringParameterSettings({
			selectSettings: validDatabase,
		});
		expect(result.success).toBe(true);
	});

	it("rejects database without href", () => {
		const result = validateStringParameterSettings({
			selectSettings: {
				...validDatabase,
				database: {
					...validDatabase.database,
					dataSource: {export: {name: "csv", sessionId: "s1"}},
				},
			},
		});
		expect(result.success).toBe(false);
	});

	it("rejects database with unsupported select type", () => {
		const result = validateStringParameterSettings({
			selectSettings: {...validDatabase, type: "dropdown"},
		});
		expect(result.success).toBe(false);
	});
});
```

- [ ] **Step 2: Run test — expect FAIL**

```bash
pnpm test -- src/shared/features/appbuilder/config/__tests__/filterableDatabaseSettings.test.ts
```

- [ ] **Step 3: Add Zod schemas**

In `appbuildertypecheck.ts`, before `IStringParameterSelectSettingsSchema`:

```typescript
const IFilterableDatabaseDataSourceSchema = z
	.object({
		export: z
			.object({
				name: z.string(),
				sessionId: z.string(),
			})
			.optional(),
		href: z.string().url().optional(),
	})
	.refine((ds) => !!ds.href, {
		message: "database.dataSource.href is required in v1",
	});

const IFilterableDatabaseFilterSchema = z.object({
	column: z.number().int().nonnegative(),
	multivalued: z.boolean().optional(),
	multiple: z.boolean().optional(),
	type: z.literal("color").optional(),
	filterValues: z.array(z.string()).optional(),
});

const IFilterableDatabaseSettingsSchema = z.object({
	dataSource: IFilterableDatabaseDataSourceSchema,
	itemDataDefinition: z.object({
		value: z.number().int().nonnegative(),
		displayname: z.number().int().nonnegative().optional(),
		tooltip: z.number().int().nonnegative().optional(),
		description: z.number().int().nonnegative().optional(),
		imageUrl: z.number().int().nonnegative().optional(),
		color: z.number().int().nonnegative().optional(),
		data: z.record(z.string(), z.number().int().nonnegative()).optional(),
	}),
	filters: z.array(IFilterableDatabaseFilterSchema).min(1),
});
```

Extend `IStringParameterSelectSettingsSchema`:

```typescript
const IStringParameterSelectSettingsSchema =
	ISelectParameterSettingsSchema.extend(
		z
			.object({
				items: z.array(z.string()).optional(),
				source: z.string().optional(),
				database: IFilterableDatabaseSettingsSchema.optional(),
			})
			.shape,
	)
	.refine(
		(s) =>
			!s.database ||
			s.type === "fullwidthcards" ||
			s.type === "grid",
		{
			message:
				'database requires selectSettings.type "fullwidthcards" or "grid"',
		},
	);
```

- [ ] **Step 4: Run test — expect PASS**

```bash
pnpm test -- src/shared/features/appbuilder/config/__tests__/filterableDatabaseSettings.test.ts
```

- [ ] **Step 5: Commit (submodule)**

```bash
cd src/shared
git add features/appbuilder/config/appbuildertypecheck.ts features/appbuilder/config/__tests__/filterableDatabaseSettings.test.ts
git commit -m "SS-9717: Add Zod validation for filterable database settings"
```

---

### Task 3: Core types

**Files:**
- Create: `src/shared/entities/parameter/lib/filterableDatabase/types.ts`

- [ ] **Step 1: Create types file**

```typescript
import type {IFilterableDatabaseSettings} from "@AppBuilderLib/features/appbuilder/config/appbuilder";

export interface DatabaseTable {
	rows: string[][];
}

export interface FilterableDatabaseEngine {
	fetch(href: string): Promise<string>;
	parse(raw: string): DatabaseTable;
}

export type FilterSelection = Record<number, string[]>;

export interface FilterableDatabaseContext {
	settings: IFilterableDatabaseSettings;
	table: DatabaseTable;
	selection: FilterSelection;
}
```

- [ ] **Step 2: Commit (submodule)**

```bash
cd src/shared
git add entities/parameter/lib/filterableDatabase/types.ts
git commit -m "SS-9717: Add filterable database core types"
```

---

### Task 4: CSV engine

**Files:**
- Create: `src/shared/entities/parameter/lib/filterableDatabase/csvEngine.ts`
- Test: `src/shared/entities/parameter/lib/filterableDatabase/__tests__/csvEngine.test.ts`

- [ ] **Step 1: Write failing tests**

```typescript
import {csvEngine} from "../csvEngine";

describe("csvEngine.parse", () => {
	it("parses simple rows", () => {
		const {rows} = csvEngine.parse("a,b\n1,2\n3,4\n");
		expect(rows).toEqual([
			["1", "2"],
			["3", "4"],
		]);
	});

	it("handles quoted commas", () => {
		const {rows} = csvEngine.parse('x,"a,b"\n');
		expect(rows).toEqual([["x", "a,b"]]);
	});

	it("skips empty lines", () => {
		const {rows} = csvEngine.parse("a,b\n\n1,2\n");
		expect(rows).toEqual([
			["a", "b"],
			["1", "2"],
		]);
	});
});
```

- [ ] **Step 2: Run test — expect FAIL**

```bash
pnpm test -- src/shared/entities/parameter/lib/filterableDatabase/__tests__/csvEngine.test.ts
```

- [ ] **Step 3: Implement csvEngine**

```typescript
import type {DatabaseTable, FilterableDatabaseEngine} from "./types";

function parseCsvLine(line: string): string[] {
	const cells: string[] = [];
	let current = "";
	let inQuotes = false;
	for (let i = 0; i < line.length; i++) {
		const ch = line[i];
		if (inQuotes) {
			if (ch === '"') {
				if (line[i + 1] === '"') {
					current += '"';
					i++;
				} else {
					inQuotes = false;
				}
			} else {
				current += ch;
			}
		} else if (ch === '"') {
			inQuotes = true;
		} else if (ch === ",") {
			cells.push(current);
			current = "";
		} else {
			current += ch;
		}
	}
	cells.push(current);
	return cells;
}

function parseCsv(raw: string): DatabaseTable {
	const rows = raw
		.split(/\r?\n/)
		.map((l) => l.trimEnd())
		.filter((l) => l.length > 0)
		.map(parseCsvLine);
	if (rows.length > 0) {
		rows.shift(); // v1: first row is header
	}
	return {rows};
}

export const csvEngine: FilterableDatabaseEngine = {
	async fetch(href: string): Promise<string> {
		const res = await fetch(href);
		if (!res.ok) {
			throw new Error(`Failed to fetch CSV: ${res.status} ${res.statusText}`);
		}
		return res.text();
	},
	parse: parseCsv,
};
```

- [ ] **Step 4: Run test — expect PASS**

- [ ] **Step 5: Commit (submodule)**

```bash
git add entities/parameter/lib/filterableDatabase/csvEngine.ts entities/parameter/lib/filterableDatabase/__tests__/csvEngine.test.ts
git commit -m "SS-9717: Add csvEngine with CSV parser"
```

---

### Task 5: Filter logic

**Files:**
- Create: `src/shared/entities/parameter/lib/filterableDatabase/filterLogic.ts`
- Test: `src/shared/entities/parameter/lib/filterableDatabase/__tests__/filterLogic.test.ts`

- [ ] **Step 1: Write failing tests**

Cover:
- `extractFilterValues` with/without `filterValues`, multivalued split
- `applyFilters` — single filter, multiple filters AND, `multiple` OR within group
- `rowMatchesFilter` multivalued semicolon cells

```typescript
import {applyFilters, extractFilterValues} from "../filterLogic";
import type {DatabaseTable} from "../types";

const table: DatabaseTable = {
	rows: [
		["id1", "Red", "Cotton;Linen"],
		["id2", "Blue", "Wool"],
		["id3", "Red", "Silk"],
	],
};

const filters = [
	{column: 1, multiple: true},
	{column: 2, multivalued: true, multiple: true},
];

describe("filterLogic", () => {
	it("extracts unique filter values from column", () => {
		expect(extractFilterValues(table, filters[0])).toEqual(["Red", "Blue"]);
	});

	it("extracts multivalued segments", () => {
		const values = extractFilterValues(table, filters[1]);
		expect(values).toEqual(
			expect.arrayContaining(["Cotton", "Linen", "Wool", "Silk"]),
		);
	});

	it("filters rows by combined selections", () => {
		const filtered = applyFilters(table, filters, {
			0: ["Red"],
			1: ["Cotton"],
		});
		expect(filtered).toEqual([table.rows[0]]);
	});
});
```

- [ ] **Step 2: Run test — expect FAIL**

- [ ] **Step 3: Implement filterLogic.ts**

Key exports:
- `getCellValues(row, column, multivalued): string[]`
- `extractFilterValues(table, filter): string[]`
- `rowMatchesFilter(row, filter, selected: string[]): boolean` — empty selection = pass
- `applyFilters(table, filters, selection): string[][]`

- [ ] **Step 4: Run test — expect PASS**

- [ ] **Step 5: Commit (submodule)**

---

### Task 6: Item mapping

**Files:**
- Create: `src/shared/entities/parameter/lib/filterableDatabase/itemMapping.ts`
- Test: `src/shared/entities/parameter/lib/filterableDatabase/__tests__/itemMapping.test.ts`

- [ ] **Step 1: Write failing test**

```typescript
import {mapRowsToSelectItems} from "../itemMapping";

const def = {
	value: 0,
	displayname: 1,
	data: {weight: 2},
};

it("maps rows to items and itemData", () => {
	const rows = [["SKU1", "Fabric A", "120"]];
	const {items, itemData} = mapRowsToSelectItems(rows, def);
	expect(items).toEqual(["SKU1"]);
	expect(itemData.SKU1).toEqual({
		displayname: "Fabric A",
		data: {weight: "120"},
	});
});
```

- [ ] **Step 2–4: Implement, run, pass**

`mapRowsToSelectItems(rows, itemDataDefinition)` returns `{items: string[], itemData: Record<string, ISelectComponentItemDataType>}`.

Skip rows with empty value column. Deduplicate by value (last wins).

- [ ] **Step 5: Commit (submodule)**

---

### Task 7: Scrolling API adapter

**Files:**
- Create: `src/shared/entities/parameter/lib/filterableDatabase/createScrollingApi.ts`
- Test: `src/shared/entities/parameter/lib/filterableDatabase/__tests__/createScrollingApi.test.ts`

- [ ] **Step 1: Write failing tests**

Test factory `createFilterableDatabaseScrollingApi({table, settings, selection, pageSize})`:
- Initial `items` length ≤ pageSize
- `loadMore` appends; `hasNextPage` false at end
- Changing `selection` via `updateSelection` resets items

- [ ] **Step 2–4: Implement**

Returns object satisfying `IScrollingApi<IScrollingApiItemTypeSelect>`:

```typescript
export function createFilterableDatabaseScrollingApi(options: {
	table: DatabaseTable;
	settings: IFilterableDatabaseSettings;
	selection: FilterSelection;
	pageSize?: number;
}): IScrollingApi<IScrollingApiItemTypeSelect> & {
	updateSelection(selection: FilterSelection): void;
	updateTable(table: DatabaseTable): void;
};
```

Internal state: filtered rows → mapped items; slice by offset.

`setSearchTerms`: filter mapped items by lowercase match on value/displayname (optional v1 — implement if trivial).

- [ ] **Step 5: Commit (submodule)**

---

### Task 8: `useFilterableDatabase` hook

**Files:**
- Create: `src/shared/entities/parameter/model/filterableDatabase/useFilterableDatabase.ts`

- [ ] **Step 1: Implement hook**

```typescript
export function useFilterableDatabase(settings: IFilterableDatabaseSettings) {
	// state: loading, error, table, selection, scrollingApi ref
	// useEffect: fetch href via csvEngine on mount
	// onSelectionChange: update scrollingApi.updateSelection
	// return { loading, error, scrollingApi, selection, setSelection, filterTreeData }
}
```

`filterTreeData` — build Mantine Tree `data` nodes from `extractFilterValues` per filter (include color metadata for swatches).

- [ ] **Step 2: Commit (submodule)**

---

### Task 9: `FilterableSelectComponent` UI

**Files:**
- Create: `src/shared/entities/parameter/ui/select/FilterableSelectComponent.tsx`

- [ ] **Step 1: Fetch Mantine Tree docs**

Use context7 MCP for `@mantine/core` Tree / checkbox tree patterns before coding.

- [ ] **Step 2: Implement component**

Props: extend `SelectComponentProps` + `{ database: IFilterableDatabaseSettings; type: "fullwidthcards" | "grid" }`.

Layout:
- `Stack` with filter `Tree` (checkboxes, expand/collapse)
- Color filter nodes: `Group` with `ColorSwatch` + label
- `SelectComponentAsync` below with `scrollingApi` from hook

Loading: `Loader` while fetching. Error: `Text c="red"`.

- [ ] **Step 3: Commit (submodule)**

---

### Task 10: Wire `SelectComponent`

**Files:**
- Modify: `src/shared/entities/parameter/ui/select/SelectComponent.tsx`

- [ ] **Step 1: Add `database` to props**

Extend `SelectComponentPropsBase`:

```typescript
database?: IFilterableDatabaseSettings;
```

- [ ] **Step 2: Add branch before existing type switches**

```typescript
if (database && (type === "fullwidthcards" || type === "grid")) {
	return (
		<FilterableSelectComponent
			{...rest}
			type={type}
			database={database}
			multiselect={false}
		/>
	);
}
```

- [ ] **Step 3: Pass `database` from `ParameterStringComponent`**

In `ParameterStringComponent.tsx`, spread already includes `selectSettings` — ensure `database` flows through `{...selectSettings}`.

- [ ] **Step 4: Commit (submodule)**

```bash
git commit -m "SS-9717: Add FilterableSelectComponent and wire SelectComponent"
```

---

### Task 11: Test fixture (parent repo)

**Files:**
- Create: `public/textile-database-sample.csv` (10–20 rows, subset of Jira CSV columns)
- Create: `public/SS-9717.json`

- [ ] **Step 1: Add trimmed CSV sample**

Include columns used by filters in Southern Sewing use case (color, material, etc.).

- [ ] **Step 2: Add settings JSON**

```json
{
  "version": "1.0",
  "sessions": [{ "id": "default", "slug": "REPLACE_WITH_TEST_SLUG" }],
  "parameters": [
    {
      "name": "Textile",
      "settings": {
        "selectSettings": {
          "type": "fullwidthcards",
          "height": "400px",
          "database": {
            "dataSource": { "href": "/textile-database-sample.csv" },
            "itemDataDefinition": { "value": 0, "displayname": 1, "imageUrl": 2 },
            "filters": [
              { "column": 3, "multiple": true },
              { "column": 4, "type": "color", "multiple": true }
            ]
          }
        }
      }
    }
  ]
}
```

Adjust column indices to match sample CSV.

- [ ] **Step 3: Validate settings**

```bash
VALIDATE_SETTINGS_FILE=public/SS-9717.json pnpm test -- src/shared/features/appbuilder/config/__tests__/validateSettingsJsonFile.test.ts
```

- [ ] **Step 4: Manual smoke test**

```bash
pnpm run start
```

Load app with `SS-9717.json`; verify filters + selection.

---

### Task 12: Full test suite + submodule pointer

- [x] **Step 1: Run all new tests** — `pnpm test --testPathPattern=filterableDatabase` (**71 passed** after Phase 4)

- [x] **Step 2: Update parent submodule pointer** — initial pointer committed; review-fix pointer update in parent pending

> Tasks 1–12 complete. Continue with **Phase 2** below.

---

No placeholders. Export data source explicitly deferred.

---

## Phase 2: Integration, UI polish, and bugfixes

> Added after initial implementation. Captures conversation history so context overflow does not lose work.

### Task 13: Settings config pattern (SS-8997 style) — DONE

**Problem:** `database` in `appBuilderOverride` / wrong component path did not match App Builder theme conventions.

**Solution:**
- Test fixture `public/SS-9717.json` uses **SS-8997 session** (`sdr8euc1`) and pattern:

```json
"themeOverrides": {
  "components": {
    "ParameterSelectComponent": {
      "defaultProps": {
        "componentSettings": {
          "TenCards": {
            "type": "fullwidthcards",
            "height": "400px",
            "searchable": true,
            "database": { ... }
          }
        }
      }
    }
  }
}
```

- `database` added to `ISelectParameterSettings` (not only `IStringParameterSelectSettings`).
- `ParameterSelectComponent` passes `database={settings.database}` to `SelectComponent`.
- `ParameterStringComponent`: optional `componentSettings` theme merge (for future String params); render branch extended to show `SelectComponent` when `selectSettings.database` is set (not only `items` / `source`).

**Key:** `componentSettings` key must match parameter **name** in the model (`TenCards`, not `RhinoVersion`).

---

### Task 14: Theme validation for `componentSettings` — DONE

**Problem:** App failed to load with:

```
Unrecognized keys: "height", "searchable", "database"
→ at themeOverrides.components.ParameterSelectComponent.defaultProps.componentSettings.TenCards
```

**Solution:**
- Extended `selectComponentOverridesSchema` in `selectComponent.theme.types.ts` with `height`, `searchable`, `limit`, `source`, `database`.
- Extracted `filterableDatabaseSettingsSchema` to `entities/parameter/lib/filterableDatabase/filterableDatabaseSettingsSchema.ts` to avoid **circular import** (`appbuildertypecheck` → theme registry → `selectComponent.theme.types` → `appbuildertypecheck`).

---

### Task 15: Zod fixes — DONE

| Fix | Detail |
|-----|--------|
| Relative `href` | Accept absolute URL **or** root-relative path (`/textile-database-sample.csv`) |
| `safeExtend` | `IStringParameterSelectSettingsSchema` uses `ISelectParameterSettingsSchema.safeExtend({ items, source })` — avoids refinement overwrite error |
| `database` on select settings | `ISelectParameterSettingsSchema` includes `database: filterableDatabaseSettingsSchema.optional()` |

**Note:** `filterableDatabaseSettings.test.ts` fixed in Task 21 (Jest mocks for `@shapediver/viewer.session` / `viewer.shared.types`).

---

### Task 16: Filter UI refactor (separate components) — DONE

**Problem:** Raw Mantine `Tree` — no styling, `Checkbox.Indicator` not clickable, no visual grouping, no active-filter tags in search area.

**Architecture** (`entities/parameter/ui/filterableDatabase/`):

| Component | Role |
|-----------|------|
| `FilterableDatabaseFilters` | `Stack` + `Accordion` (`variant="separated"`) |
| `FilterableDatabaseFilterGroup` | One accordion panel per filter definition |
| `FilterableDatabaseFilterOption` | Full `Checkbox` row + optional `ColorSwatch` |
| `FilterableDatabaseActiveFilterTags` | Removable `Pill` tags (`"Filter 2: Red"`) |

`FilterableSelectComponent.tsx` is a thin orchestrator (~70 lines): hook + filters + `SelectComponentAsync`.

**UX details:**
- Active filter pills via `SelectComponentAsync.prependTopSection` (above cards, below search input).
- `buildActiveFilterTags(selection, filterGroups)` in lib + unit test.
- `resolveFilterColor.ts` — map common color names to hex; skip invalid values (avoids THREE.js warnings for names like `Gray`).
- Accordion **collapsed by default** (`defaultValue={[]}`); overridable via theme `accordionProps.defaultValue`.
- Accordion item gap: `margin-top: var(--mantine-spacing-sm)` on sibling items in `FilterableDatabaseFilters.module.css` (Mantine `--accordion-spacing` on root does **not** affect item margin in v8.3 — must target `.mantine-Accordion-item + .mantine-Accordion-item`).

**Deferred:** Register filter component `ThemeProps` in `useCustomTheme.ts` / theme registry (factories exist, not wired).

---

### Task 17: React re-render bugs (filters + search) — DONE

**Root cause:** `useSelectAsync` memoized `items` / `itemsData` only by `scrollingApi` **reference**. `createScrollingApi` mutates `api.items` in place; React did not re-render.

| Trigger | Fix |
|---------|-----|
| Filter selection | `updateSelection` → `bumpResetState()`; hook calls `setScrollingApi({...api})` after `updateSelection` |
| Search input | `setSearchTerms` → `applyPaging()` + `bumpResetState()`; `useSelectAsync` increments `searchRevision` after debounce; `syncScrollingApiState()` in `useFilterableDatabase` mirrors filter sync |
| Initial filter fix | `useMemo` deps include `scrollingApi?.resetState` |

**Files:** `createScrollingApi.ts`, `useSelectAsync.ts`, `useFilterableDatabase.ts`, `SelectComponentAsync.tsx` (`onSyncScrollingApiState` prop).

**Test added:** `setSearchTerms bumps resetState so consumers can re-render` in `createScrollingApi.test.ts`.

---

### Task 18: Other bugfixes — DONE

| Bug | Fix |
|-----|-----|
| `Maximum update depth exceeded` in filter tree | Removed `tree` from `useEffect` deps when syncing checkbox state (obsolete after Accordion refactor; tree removed entirely in Task 16) |
| `props.database` empty — String param branch | `ParameterStringComponent` checks `selectSettings.database` |
| Checkbox only worked on label text | Replaced `Checkbox.Indicator` with full `Checkbox` + row click handler (Task 16) |

---

### Task 19: Manual verification checklist — PENDING QA

**URL:** `http://localhost:3000/?g=SS-9717.json` → **TenCards** (or `:3001` if port busy)

| # | Check | Expected |
|---|-------|----------|
| 1 | Filter dropdown | Click **Filters** → dropdown opens; accordion groups for Category / Color / Materials |
| 2 | Inline Name filter | **Name** text field visible at top of dropdown **without** expanding accordion |
| 3 | Text filter | Type in Name field → focus works; tag `Name: …` appears; cards narrow by substring |
| 4 | Checkbox / label click | Toggles selection; dropdown stays open |
| 5 | Select-all | Master checkbox in **accordion header** (left of group label), no "All" label; does not toggle accordion |
| 6 | Child option indent | Multi-select options indented under header checkbox; vertical `gap` between rows |
| 7 | Active pills | Inside filter input; removable |
| 8 | Filter logic | Combined filters AND across groups; Red + Category etc. |
| 9 | Search (cards) | Card search does not clear selection when item still in filtered list |
| 10 | Console | No `Maximum update depth exceeded` |
| 11 | SevenCards | Grid variant without Name filter; href JSON sample |
| 12 | JSON href (optional) | `href: "/textile-database-sample.json"` + `format: "json"` |
| 13 | Export source (optional) | `export: { name, sessionId }` on live session |

**Automated:**

```bash
pnpm test -- src/shared/entities/parameter/lib/filterableDatabase filterableDatabaseSettings.test.ts
cd src/shared && pnpm exec tsc --noEmit
```

---

### Task 21: Code review fixes — DONE

Post-implementation review (`fdf3cb2..a82481e` + follow-up commit `3cf9008`).

| Issue | Fix |
|-------|-----|
| Load-time `onChange(null)` | Removed redundant `setSelection({})` after CSV parse; `isSelectionEqual` guard in `updateSelection` skips no-op `bumpResetState` |
| CSV header as data | `csvEngine.parse` — `rows.shift()` (v1: always skip first row); test `"skips first row as header"` |
| Unconditional reset on search/filter | `SelectComponentAsync` — `isValueInAvailableItems()`; `onChange(null)` only when value absent (item key or JSON `data` match) |
| String param value not shown | `ParameterStringComponent` — `value={value \|\| undefined}`; `resolveItemKeyForValue` + `displayValue` in `SelectComponentAsync` for card highlight |
| Jest ESM crash | `filterableDatabaseSettings.test.ts` — viewer mocks (same pattern as `validateSettingsJsonFile.test.ts`) |

**Tests after fixes:** 6 suites, 35 tests — all PASS.

---

### Known limitations / follow-up

| Item | Status | Notes |
|------|--------|-------|
| CSV header row | **Done** (Task 21) | First row always skipped; v2 could add `hasHeaderRow` setting |
| `SelectComponentAsync` reset effect | **Done** (Task 21) | Clears only when value ∉ filtered items |
| Jest ESM | **Done** (Task 21) | Viewer mocks in settings test |
| String param value display | **Done** (Task 21 + Task 40 `emitValue`) |
| **Card/grid flicker on execute** | **Done** (Task 39 — local `busy`; see failures F1, F4) |
| **Filter grid remount flicker** | **Done** (Task 38 `useCustomHeight`; failure F3) |
| **CSV reload on commit flicker** | **Done** (Task 41 stable deps; failure F5) |
| **Search scope** | Open | `matchesSearchTerms` only checks `item` + `displayname` — not `description` / `data` columns |
| **Fetch error UX** | Open | Inline `Text c="red"` only; spec also mentions notification |
| **Theme registry** | Open | `FilterableSelectComponentThemeProps` not registered in `useCustomTheme.ts` |
| **`FilterableDatabaseFilterGroup.multiple`** | **Done** (Task 26) | Passed to `FilterOption`; Radio vs Checkbox |
| **Inline filter (`inline`)** | **Done** (Task 30) | Per-filter flat layout in dropdown |
| **Text filter (`type: "text"`)** | **Done** (Task 28) | Substring match + `TextInput` UI |
| **`ParameterStringComponent` TS** | Open | `componentSettings` + `useProps` typing — verify clean `tsc` |
| **`dataSource.export`** | **Done** (Task 22) | `exportEngine` + `resolveDataSource`; Zod `href OR export`; commit `a4e192a` |
| **`jsonEngine`** | **Done** (Task 23) | `jsonEngine` + `resolveEngine` + `format`; commit `ff5f016` |
| **Export session timing** | Open | No retry if export store not ready on first mount (Task 22 review) |
| **Export-only JSON** | Open | Requires explicit `dataSource.format: "json"` (no href suffix to infer) |
| **Production config** | Deferred | Southern Sewing production parameter name / live export name |

---

## Phase 3 (v2): Additional data sources — DONE

> Completed 2026-06-23. Builds on v1 `FilterableDatabaseEngine` + shared `filterLogic` / `itemMapping` / `createScrollingApi`. UI unchanged — only load/parse path extended.

**Load path (current):**

```
resolveDataSource.fetchRawText(settings)
  ├─ href → engine.fetch(href)
  └─ export → exportEngine.fetch({ name, sessionId })
resolveFilterableDatabaseEngine(settings).parse(raw) → DatabaseTable
```

### Task 22: `dataSource.export` (ShapeDiver export) — DONE

**Goal:** Load database rows from a **session export** (Grasshopper-generated CSV) instead of a public `href`.

**Motivation:** Production Southern Sewing data may live behind ShapeDiver session exports, not a static public URL. Types already document this in `IFilterableDatabaseSettings.dataSource.export`; v1 Zod explicitly rejects export-only configs.

**Commit:** `a4e192a` — `SS-9717: Add filterable database export data source`

**Implemented state:**

| Layer | Status |
|-------|--------|
| `exportEngine.ts` | `getExport(sessionId, name)` → `actions.request()` → `content[0].href` → `actions.fetch().text()` (JWT-aware; fallback `fetchText`) |
| `resolveDataSource.ts` | `hasDataSource()`, `fetchRawText()` — href takes precedence when both set |
| `filterableDatabaseSettingsSchema.ts` | `.refine((ds) => !!ds.href \|\| !!ds.export)` |
| `useFilterableDatabase.ts` | Loads via `fetchRawText`; effect deps on `dataSource` fields |
| Tests | `exportEngine`, `resolveDataSource`, settings accept export-only |

**Target architecture:**

```
dataSource.export ──► exportEngine.fetch({ name, sessionId })
                           │
                           ▼
                      raw CSV string ──► csvEngine.parse() ──► DatabaseTable
                           │
              (same filterLogic → itemMapping → scrolling API)
```

**Files (planned):**

| File | Action |
|------|--------|
| `entities/parameter/lib/filterableDatabase/exportEngine.ts` | Create — resolve export URL / download via existing session/export APIs |
| `entities/parameter/lib/filterableDatabase/resolveDataSource.ts` | Create — pick `href` vs `export`, single `fetchTable(settings)` entry |
| `entities/parameter/lib/filterableDatabase/filterableDatabaseSettingsSchema.ts` | Modify — `href` **or** `export` required (not both mandatory); keep href precedence when both set |
| `entities/parameter/model/filterableDatabase/useFilterableDatabase.ts` | Use `resolveDataSource` instead of direct `csvEngine.fetch(href)` |
| `entities/parameter/lib/filterableDatabase/__tests__/exportEngine.test.ts` | Mock session/export API |
| `features/appbuilder/config/__tests__/filterableDatabaseSettings.test.ts` | Accept export-only; reject neither href nor export |

**Implementation steps:**

- [x] **Step 1:** Research existing export download path in App Builder (session store / `@shapediver/viewer` export API — same patterns as other export downloads).
- [x] **Step 2:** Implement `exportEngine.fetch(exportRef): Promise<string>` returning raw CSV text.
- [x] **Step 3:** Relax Zod: `(ds.href || ds.export)` with clear error message; update tests.
- [x] **Step 4:** Wire `useFilterableDatabase` — if `href` set, use current path; else `exportEngine.fetch` + `csvEngine.parse`.
- [ ] **Step 5:** Manual test with session that exposes a CSV export (fixture or Southern Sewing model).
- [x] **Step 6:** Commit submodule `SS-9717: Add filterable database export data source`.

**Code review (Task 22):** Ready to merge. Follow-ups: session readiness retry, export-only needs explicit `format` for JSON, `lib` → `model` coupling in `exportEngine`.

**Open questions (manual QA — Step 5 still open):**

- Auth / ticket: confirm `sessionId` maps to loaded App Builder session namespace.
- Caching: re-fetch on every mount vs cache until session commit.
- Error UX: reuse notification backlog (inline + toast).

---

### Task 23: `jsonEngine` — DONE

**Commit:** `ff5f016` — `SS-9717: Add filterable database jsonEngine`

**Goal:** Support **JSON** database files via the same `FilterableDatabaseEngine` extension point (not only CSV).

**Motivation:** Datasets may ship as JSON (pre-structured rows). Implemented alongside Task 22; `csvEngine` remains default.

**Target architecture:**

```
dataSource.href ──fetch──► jsonEngine.fetch(href)
                                │
                                ▼
                         jsonEngine.parse(raw) ──► DatabaseTable { rows: string[][] }
                                │
              (shared filterLogic → itemMapping → scrolling API — unchanged)
```

**JSON format (Option A — implemented):**

```json
{
  "columns": ["id", "name", "category", "color"],
  "rows": [
    ["1", "Red Cotton", "Fabric", "Red"]
  ]
}
```

`columns` is optional metadata (ignored at parse; only `rows` stored in `DatabaseTable`).

Option B — array of objects mapped via `itemDataDefinition` keys — **deferred**.

**Files (implemented):**

| File | Action |
|------|--------|
| `entities/parameter/lib/filterableDatabase/jsonEngine.ts` | Create — `fetch` (reuse `csvEngine.fetch` or shared `fetchText`) + `parse` |
| `entities/parameter/lib/filterableDatabase/resolveEngine.ts` | Create — select `csvEngine` vs `jsonEngine` by `dataSource.format?: "csv" \| "json"` or file extension |
| `entities/parameter/lib/filterableDatabase/types.ts` | Optional — `dataSource.format` on settings type + Zod |
| `entities/parameter/lib/filterableDatabase/__tests__/jsonEngine.test.ts` | Parse fixtures, edge cases |
| `public/textile-database-sample.json` | Parent repo — sample fixture (optional) |

**Implementation steps:**

- [x] **Step 1:** JSON schema — Option A adopted (`{ columns?, rows: string[][] }`).
- [x] **Step 2:** TDD `jsonEngine.parse` → `DatabaseTable`.
- [x] **Step 3:** `dataSource.format` + suffix inference; default `csv`.
- [x] **Step 4:** Wire `resolveEngine` in `useFilterableDatabase` (via `fetchRawText` after Task 22).
- [x] **Step 5:** Zod + settings test for `format: "json"`.
- [x] **Step 6:** Commit submodule `SS-9717: Add filterable database jsonEngine`.

**Code review (Task 23):** Proceed to Task 22 — no blockers. Minor: document `columns` ignored at parse; Zod negative test for invalid `format`.

**Relationship to Task 22:** `exportEngine` returns raw text; `resolveFilterableDatabaseEngine` chooses parser **after** fetch regardless of href vs export.

**Out of scope for Task 23:** Arbitrary nested JSON without tabular mapping; server-side JSON via e-commerce `source` API.

---

### Task 24: Jest / test TypeScript paths — DONE

**Problem:** Test files under `src/shared/` using `@AppBuilderLib/` failed IDE type-check (`tsconfig.json` excludes `**/*.test.ts`; paths not applied).

**Solution:**

1. **`tsconfig.jest.json` (parent repo)** — standalone config (does not `extends` root) with `baseUrl` + `paths` for `@AppBuilderLib/*`, `include` only `src/**/*.test.ts(x)` and `src/**/*.spec.ts(x)`, `module: "esnext"` (transitive `import.meta` in app code).
2. **`tsconfig.json`** — `"references": [{ "path": "./tsconfig.jest.json" }]` so IDE loads the test project alongside the app project.
3. **Jest runtime** — unchanged: `jest.config.mjs` `moduleNameMapper` + `ts-jest` with `tsconfig: "tsconfig.jest.json"`.

**Test import convention:** prefer relative imports + `Parameters<typeof fn>` for types where possible (`resolveEngine.test.ts`). When mocking modules imported by SUT via `@AppBuilderLib/`, keep the same alias in `jest.mock()` and `import` — paths come from `tsconfig.jest.json`.

After config change: reload TypeScript server in IDE if `@AppBuilderLib` errors persist.

---

### Task 20: Custom filter labels — DONE

Optional `label` on each entry in `database.filters[]`:

```json
{ "column": 3, "label": "Category", "multiple": true }
```

- Type: `IFilterableDatabaseSettings.filters[].label?: string` in `appbuilder.ts`
- Zod: `filterableDatabaseSettingsSchema` — `label: z.string().min(1).optional()`
- UI: `useFilterableDatabase` → `filter.label?.trim() || \`Filter ${n}\`` (accordion title + active pills)
- Fixture: `public/SS-9717.json` — Category / Color / Materials; TenCards Name (`type: "text"`, `inline: true`)

---

### Commit guidance

**Submodule (`src/shared`) — done:**

| Commit | Message |
|--------|---------|
| `3cf9008` | Review fixes |
| `ff5f016` | jsonEngine |
| `a4e192a` | export data source |

**Parent repo — pending:**

```bash
git add public/SS-9717.json public/textile-database-sample.json \
  docs/superpowers/plans/2026-06-23-ss-9717-filterable-database.md \
  tsconfig.jest.json src/shared
git commit -m "SS-9717: Phase 3 data sources, plan, jest paths, submodule pointer"
```

Omit unrelated parent changes (`package.json`, `scripts/build-appbuilder.sh`) unless part of this task.

---

## Plan self-review (updated)

| Spec requirement | Task |
|------------------|------|
| CSV via href only | Task 4, Zod refine Task 2, 15 |
| csvEngine + future jsonEngine interface | Task 3–4 |
| Shared filter logic | Task 5 |
| IScrollingApi adapter | Task 7, 17 |
| SelectComponentAsync reuse | Task 9–10, 16–17 |
| Filter UI (client-approved; Accordion replaced Tree in practice) | Task 16 |
| Type definitions PR 318 | Task 1 |
| Zod validation | Task 2, 14–15 |
| Theme `componentSettings` pattern | Task 13–14 |
| Unit tests | Tasks 2, 4–7, 16 (`buildActiveFilterTags`), 21, 22–23, 25–31, 40 (**79** total) |
| Manual fixture | Task 11, 13 |
| Search + filter pills | Task 16–17 |
| Code review blockers | Task 21 |
| Selection lifecycle (load/search/filter) | Task 21 |
| Export data source (`dataSource.export`) | Task 22 — **Done** |
| JSON data source (`jsonEngine`) | Task 23 — **Done** |
| Jest test path aliases | Task 24 — **Done** |
| Filters in Select dropdown + tags inside input | Task 25 — **Done** |
| Filter `multiple` UI (radio vs checkbox) | Task 26 — **Done** |
| Filter group “select all” checkbox | Task 27 — **Done** |
| Text filter (`type: "text"`) | Task 28 — **Done** |
| Combobox focus / dropdown interaction fixes | Task 29 — **Done** |
| Inline filter (`inline: true`) | Task 30 — **Done** |
| Flicker + value serialization | Phase 6 Tasks 38–42 — **Done** (uncommitted) |
| Manual QA (Phase 6) | Task 37 items 14–21 — **Pending** |

---

## Phase 4: Filter UX — dropdown + multiple

> Added 2026-06-23. Replaces accordion-above-cards layout with Mantine combobox/select pattern.

### Task 25: Filters as Select dropdown; tags inside select — DONE

**Goal:** Filter UI opens in a Mantine dropdown when the user clicks the filter select control. Active filter pills render **inside** the select input (not in `prependTopSection` above cards).

**Current layout (remove):**

```
Stack
  FilterableDatabaseFilters (Accordion above cards)
  SelectComponentAsync
    prependTopSection → FilterableDatabaseActiveFilterTags
```

**Target layout:**

```
Stack
  FilterableDatabaseFilterSelect (Mantine Combobox / Select)
    input area → active filter Pills (removable)
    dropdown → FilterableDatabaseFilters (Accordion panels)
  SelectComponentAsync (no filter prependTopSection)
```

**Requirements:**

- Use Mantine v8 (`Combobox`, `Select`, or `Popover` + `Input` — pick the pattern that supports custom dropdown content + inline pills).
- Style props via `defaultStyleProps` on `FilterableSelectComponent` — no hardcoded visual props (see `.cursor/rules/use-props.mdc`).
- Preserve existing filter logic (`useFilterableDatabase`, `toggleFilterValue`, `removeFilterValue`, `activeFilterTags`).
- Dropdown should not close when toggling a filter checkbox (click inside dropdown).
- **Focus pattern (Task 29):** `preventDefault` on `mousedown` only on interactive filter rows (`FilterOption`, multi `Stack`, `Radio.Group`, select-all wrapper) — **not** on entire `Combobox.Dropdown` and **not** on `TextInput`.
- Placeholder / label when no filters active (e.g. "Filters" or count).

**Files (expected):**

| File | Action |
|------|--------|
| `ui/filterableDatabase/FilterableDatabaseFilterSelect.tsx` | **Create** — combobox shell + pills in input |
| `ui/select/FilterableSelectComponent.tsx` | **Modify** — wire new component, remove accordion stack + prepend tags |
| `ui/filterableDatabase/FilterableDatabaseFilters.tsx` | **Modify** — optional `inDropdown` layout tweaks if needed |
| `FilterableDatabaseFilters.module.css` | **Modify** — dropdown max-height / scroll |

**Manual QA:** `http://localhost:3000/?g=SS-9717.json` — TenCards: click filter select → accordion in dropdown; pills inside input; cards below unchanged.

**Tests (required):**

| Test file | Coverage |
|-----------|----------|
| `lib/filterableDatabase/__tests__/buildFilterSelectPlaceholder.test.ts` | Placeholder when 0 / 1 / N active tags |
| `ui/filterableDatabase/__tests__/FilterableDatabaseFilterSelect.test.ts` | Optional: only if pure helpers extracted; UI uses `jsdom` only if project adds it |

`FilterableDatabaseFilterSelect` must use `buildFilterSelectPlaceholder` from lib (already tested).

---

### Task 26: Filter `multiple` support in UI — DONE

**Goal:** Honor `filters[n].multiple` from settings JSON in the filter option UI.

**Current state:**

- Zod + `useFilterableDatabase.toggleFilterValue` already branch on `filter.multiple` (multi toggle vs single replace).
- `FilterableDatabaseFilterGroup` receives `multiple` prop but **does not pass it** to options; all options render as `Checkbox`.

**Requirements:**

| `multiple` | UI control | Toggle behavior (already in hook) |
|------------|------------|-----------------------------------|
| `true` (default) | `Checkbox` | Add/remove value in group |
| `false` | `Radio` (same `Radio.Group` per filter group) | Single value; click again clears |

- Add `radioProps` style bag alongside `checkboxProps` in style props chain (`FilterableSelectComponent` → `Filters` → `FilterGroup` → `FilterOption`).
- Default props pattern — no hardcoded `size` / `fw` on Radio.
- Unit test: `toggleFilterValue` with `multiple: false` (if not covered); optional component test for Radio rendering.

**Files (expected):**

| File | Action |
|------|--------|
| `ui/filterableDatabase/FilterableDatabaseFilterOption.tsx` | **Modify** — Checkbox vs Radio by `multiple` |
| `ui/filterableDatabase/FilterableDatabaseFilterGroup.tsx` | **Modify** — pass `multiple`, `radioProps` |
| `ui/filterableDatabase/FilterableDatabaseFilters.tsx` | **Modify** — thread `radioProps` |
| `ui/select/FilterableSelectComponent.tsx` | **Modify** — `defaultStyleProps.radioProps` |
| `model/filterableDatabase/__tests__/` or lib tests | **Modify** — cover single-select toggle |

**Fixture:** Add one filter with `"multiple": false` in `public/SS-9717.json` (e.g. Category) for manual QA.

**Tests (required):**

| Test file | Coverage |
|-----------|----------|
| `lib/filterableDatabase/__tests__/filterLogic.test.ts` | `toggleFilterSelection` — multi default, add/remove, single replace, clear on re-toggle |
| `lib/filterableDatabase/__tests__/filterLogic.test.ts` | `rowMatchesFilter` / `applyFilters` with mixed `multiple` groups |

Hook `useFilterableDatabase` delegates to `toggleFilterSelection` (no separate hook test — Jest env is `node`).

UI (Radio vs Checkbox): manual QA on Category (`multiple: false`); no RTL in repo unless `testEnvironment` extended.

---

### Task 27: Select-all checkbox per filter group — DONE

**Goal:** Multi-select tag groups show a master checkbox by default (no JSON flag).

**Behavior:** When `multiple !== false` and `type !== "text"`, show master checkbox in **accordion header** (left of group label) — checked / unchecked / indeterminate; toggles full `group.nodes` list. Click on select-all must **not** toggle accordion expand/collapse. No separate "All" label in panel.

**Settings:** No `selectAll` field — only `multiple` and `type` matter.

**Logic:** `getSelectAllState`, `applySelectAll`, `toggleSelectAll` in `filterLogic.ts` + hook + tests.

**Layout:** Child options use `filterOptionChildren` left indent; options in `Stack` (not wrapper `div`) for vertical `gap`.

**Fixture:** TenCards Category / Color / Materials → `"multiple": true`.

**Manual QA:** TenCards → Category + Color → header checkbox per multi-select group.

---

### Task 28: Text filter (`type: "text"`) — DONE

**Goal:** Free-text substring filter on a column (case-insensitive), combinable with tag filters.

**Settings:**

```json
{"column": 1, "label": "Name", "type": "text", "inline": true}
```

**Logic:** `rowMatchesFilter` — empty selection passes; non-empty uses `selected[0]` substring match on column cells (`filterLogic.test.ts`).

**UI:** `TextInput` in filter panel (accordion or inline); value synced via `setFilterText` in hook (trimmed); active tag uses group label + value.

**Files:** `filterLogic.ts`, `useFilterableDatabase.ts`, `FilterableDatabaseFilterGroup.tsx` (`FilterableDatabaseFilterGroupBody`), Zod `type: z.enum(["color", "text"])`.

**Fixture:** TenCards Name filter on column 1 (`displayname`).

---

### Task 29: Combobox dropdown focus fixes — DONE

**Problem:** Global `onMouseDown` + `preventDefault` on `Combobox.Dropdown` blocked `TextInput` focus in Name filter.

**Solution (inverted logic):** Remove dropdown-level handler. Call `preventDefault` only where combobox must keep focus:

| Location | Handler |
|----------|---------|
| `FilterableDatabaseFilterOption` `.filterOption` | `onMouseDown` → `preventDefault` |
| `FilterableDatabaseFilterGroup` multi `Stack` | `onMouseDown` → `preventDefault` |
| `FilterableDatabaseFilterGroup` `Radio.Group` | `onMouseDown` → `preventDefault` |
| Select-all wrapper | `stopPropagation` + `preventDefault` |

**Regression:** Dropdown re-open after pills (no `stopPropagation` on pill container); `handlePillsInputClick` ignores button targets.

---

### Task 30: Inline filter (`inline: true`) — DONE

**Goal:** Render a filter **without** Mantine Accordion (no Control/Panel) — content visible directly in combobox dropdown.

**Settings:**

```json
{"column": 1, "label": "Name", "type": "text", "inline": true}
```

- `inline: true` — flat block in dropdown (label + body).
- Default `false` — accordion item (current behavior).
- Works for all filter types (text, checkbox, color, radio).

**Order:** `buildFilterRenderSegments(filterGroups, filters)` batches consecutive accordion groups and flushes when an inline filter appears — preserves `filters[]` order.

**Files:**

| File | Role |
|------|------|
| `buildFilterRenderSegments.ts` | Segment batching pure function |
| `FilterableDatabaseInlineFilter` | Flat layout (in `FilterableDatabaseFilterGroup.tsx`) |
| `FilterableDatabaseFilters.tsx` | Renders `inline` segments + accordion segments |
| `appbuilder.ts` + Zod | `inline?: boolean` |

**Tests:** `buildFilterRenderSegments.test.ts`, `filterableDatabaseSettings.test.ts` accepts `inline: true`.

**UX (inline non-text):** Multi-select shows label + select-all row + indented options (same semantics as accordion header/panel).

---

### Task 31: Filter option layout polish — DONE

**Problems fixed during Phase 4 QA:**

| Issue | Fix |
|-------|-----|
| Checkbox vertical gap lost | Wrap options in `Stack` with `filterGroupStackProps` instead of bare `div` |
| Child indent under select-all | `filterOptionChildren` — `padding-left: calc(gap + checkbox-size)` |
| Redundant nested `Stack` in panel | Single `Stack` per panel branch |

---

### Task 25 + 26 integration notes

- Task 25 owns layout/orchestration; Task 26 owns `FilterOption` control type.
- If both touch `FilterableSelectComponent.tsx`, merge `defaultStyleProps` (filter select props + `radioProps`).
- Run after Phase 4: `pnpm test --testPathPattern=filterableDatabase` (**79 tests** as of 2026-06-30)

---

## Phase 5: Jira compliance review + fixture hardening (2026-06-29)

**Trigger:** Jira SS-9717 canonical test case + full CSV attachment (`TextileDatabase - databaseFULL.csv`, ~302 kB).

**Reference settings (must not break default case):**

```json
{
  "selectSettings": {
    "type": "grid",
    "source": "graphics",
    "searchable": true,
    "limit": 5,
    "height": "400px"
  }
}
```

**Canonical database adaptation:**

```json
{
  "selectSettings": {
    "type": "grid",
    "source": "graphics",
    "searchable": true,
    "limit": 5,
    "height": "400px",
    "database": {
      "dataSource": { "href": "/textile-database-full.csv" },
      "itemDataDefinition": {
        "value": 0,
        "displayname": 1,
        "imageUrl": 2,
        "data": { "category": 3, "color": 4, "materials": 5 }
      },
      "filters": [
        { "column": 1, "label": "Name", "type": "text", "inline": true },
        { "column": 3, "label": "Category", "multiple": true, "inline": true },
        { "column": 4, "label": "Color", "type": "color", "multiple": true },
        { "column": 5, "label": "Materials", "multivalued": true, "multiple": true }
      ]
    }
  }
}
```

**JSON row format:** top-level `value`, `displayname`, `imageUrl`; custom fields under `"data"` (keys match `itemDataDefinition.data`).

### Compliance review summary (code-reviewer subagent, 2026-06-29 — superseded)

> See **Phase 6 compliance table** (2026-06-30) for current status.

| Area | Status |
|------|--------|
| Database block (`itemDataDefinition`, filters) | ✅ TenCards + GridCards |
| `jsonEngine` object rows + nested `data` | ✅ Done |
| Unit tests | ✅ **79** passed |
| Canonical `grid` + `limit: 5` in fixture | ✅ GridCards (Task 34) |
| Full Jira CSV in repo | ⚠️ 150-row generated |
| `limit` → database paging | ✅ Task 32 |
| Flicker / `emitValue` | ✅ Phase 6 Tasks 38–40 |

### Task 32: Wire `selectSettings.limit` to database paging — DONE

**Files:** `useFilterableDatabase.ts`, `FilterableSelectComponent.tsx`, `createScrollingApi.test.ts`

- [x] Pass `limit` from `SelectComponentProps` into `useFilterableDatabase(database, { pageSize: limit })`
- [x] `createFilterableDatabaseScrollingApi({ pageSize: limit ?? 20 })`
- [x] Test: initial `api.items.length` respects `pageSize: 5`

### Task 33: Debounce text filters (`type: "text"`) — DONE

**Files:** `useFilterableDatabase.ts`, `FilterableDatabaseFilterGroup.tsx`

- [x] Debounce `setFilterText` (~300ms) before `setSelection` to reduce card flicker during Name filter typing
- [x] Checkbox/color filters remain immediate
- [x] **Phase 6:** Local draft in `FilterableDatabaseTextFilterField` so input shows keystrokes before debounce fires
- [x] Clear pending timer when text filter pill removed

### Task 34: Canonical regression fixture + full CSV — DONE (generated)

**Files:** `public/SS-9717.json`, `public/textile-database-full.csv`, `public/textile-database-full.json`

- [x] **GridCards** with canonical `selectSettings` (`grid`, `source: "graphics"`, `limit: 5`)
- [x] TenCards / GridCards href → `/textile-database-full.csv`
- [x] `textile-database-sample.csv` regenerated from `textile-database-sample.json` via `scripts/textile-database-json-to-csv.mjs`
- [x] Full dataset: **150 rows** in `textile-database-full.json` + `.csv` via `scripts/generate-textile-database-full.mjs` (same schema: top-level + `data.*`)
- [ ] Replace with Jira `TextileDatabase - databaseFULL.csv` when available (~302 kB production file)

### Task 35: Reduce redundant re-renders (flicker follow-up) — DONE

- [x] `applySelection` in `useFilterableDatabase` — no `setScrollingApi({...api})` per selection
- [x] Removed redundant `onSyncScrollingApiState` after search (`searchRevision` + `resetState` sufficient)
- [x] **Phase 6:** Stable `useFilterableDatabase` effect deps; `selectionRef` on reload (see failures F5)

### Task 36: Pass `source` when database absent — DONE

- [x] `source={settings.source}` on `ParameterSelectComponent` → `SelectComponent`

### Task 37: Manual QA — see Phase 6

> Full checklist: **Phase 6 → Task 37** (items 14–21). Combobox UX items 1–13: **Task 19**.

- [ ] Run Phase 6 manual QA on `http://localhost:3001/?g=SS-9717.json`
- [ ] Commit submodule + parent fixture when QA passes

---

## Phase 6: Flicker fixes + value serialization (2026-06-30)

**Trigger:** Manual QA — visible flicker on filter checkbox change and **double flicker** on card click (filterable database grid).

**Goal:** Stable card grid during filter/search/execute; correct String-parameter value per SS-9717 spec (`JSON.stringify(itemData.data)` when `itemDataDefinition.data` is set).

### Failures & dead ends — do not repeat

| # | What we tried | Why it failed | Correct approach |
|---|---------------|---------------|------------------|
| F1 | **`interactionDisabled` in `useParameterComponentCommons`** — split `disabled` vs `executing` globally | Touches every parameter component; unrelated inputs regressed; user rejected global hook change | Keep hook `disabled` unchanged; fix **only** filterable-database card path |
| F2 | **`emitValue="itemKey"` for all `database` / `source`** on String params | Stopped flicker briefly but **violates Jira/spec** — Southern Sewing expects `JSON.stringify(data)` in String value when `itemDataDefinition.data` is configured | `resolveStringSelectEmitValue`: `itemData` for `database`; `itemKey` only for `source` without `database`; StringList always `itemKey` |
| F3 | **`useCustomHeight` memo on `[children, height]`** | New wrapper identity on every filter update → **full remount** of scroll area + cards (image flash) | Do **not** memoize wrapper with `children` in deps; reconcile in place |
| F4 | **`suppressDisabledStyleWhileBusy` without `executing` prop** | Cards showed **no** disabled/busy feedback during session execute — looked broken | Pass `executing` from parent **only when `database`**; compute `busy` state in `SelectComponentAsync` |
| F5 | **`settings` object in `useFilterableDatabase` effect deps** | New object reference after session commit → **full CSV reload** + Loader flash | Stable deps: `href`, export fields, `format`, `JSON.stringify(filters)`, `JSON.stringify(itemDataDefinition)`, `pageSize`; read latest settings via ref |
| F6 | **`setScrollingApi({...api})` on every filter change** (early Phase 5) | Extra React state clone + full subtree re-render | `applySelection` mutates `scrollingApiRef` in place; consumers watch `resetState` only |
| F7 | **Assuming filters appear from CSV `href` alone** | Filters UI requires `selectSettings.database` with `filters[]` — not inferred from file | Document: GH Settings / theme `componentSettings` must include full `database` block |
| F8 | **Settings textarea on `SS-9717--2.json` without model round-trip** | Pasting JSON in Settings param does not instantly reconfigure TextInput until GH commits | Use `SS-9717.json` themeOverrides for QA, or commit Settings and wait for session |

### Task 38: `useCustomHeight` remount fix — DONE

**File:** `entities/parameter/model/useCustomHeight.tsx`

- [x] Remove `useMemo` on scroll wrapper that depended on `children`
- [x] Wrapper reconciles in place when card list updates (filter/search)

### Task 39: Local busy state during session execute — DONE (simplified 2026-06-30)

**Problem:** Global `disabled` during `execute` applies `cardDisabled` (`opacity: 0.6`) per card → **two** visible flashes (enable → disable → enable) on each card click.

**Solution (filterable database only — KISS):**

| Layer | Change |
|-------|--------|
| `useParameterComponentCommons` | Export `executing` only (no change to `disabled` formula) |
| `ParameterStringComponent` / `ParameterSelectComponent` | Pass `executing` to `SelectComponent` **only when `settings.database`** |
| `SelectComponent` | `executing?:` on `SelectComponentProps` (plumbs signal; undefined for e-commerce path) |
| `SelectComponentAsync` | `busy = Boolean(executing)`; `cardDisabled = busy ? false : interactionBlocked` |
| `SelectGridComponent` / `SelectFullWidthCards` | `busy` → Stack `opacity: 0.88`, `cursor: wait`, `pointer-events: none`, `aria-busy` (single container overlay; clicks blocked at DOM level) |

**Simplification (2026-06-30):** Removed the redundant `suppressDisabledStyleWhileBusy` prop (the e-commerce path never passes `executing`, so `Boolean(executing)` alone is the trigger) and the `blockInteraction` prop on grid/fullwidth cards (the `busy` container `pointer-events: none` already blocks clicks/search, so the per-component guard was duplicate logic). `busy` no longer ANDs `disabled` because `executing` always implies `disabled` via the commons formula.

**Do not** reintroduce global `interactionDisabled` — use this path instead.

### Task 40: String value serialization (`emitValue`) — DONE

**Files:** `lib/select/resolveStringSelectEmitValue.ts`, `ParameterStringComponent.tsx`, `FilterableSelectComponent.tsx`, `SelectComponentAsync.tsx`

- [x] `database` → `emitValue="itemData"` (JSON of `itemDataDefinition.data`)
- [x] `source` without `database` → `emitValue="itemKey"`
- [x] `FilterableSelectComponent` does **not** override parent `emitValue`
- [x] No-op `onChange` when value unchanged (card re-click, JSON match)
- [x] Tests: `resolveStringSelectEmitValue.test.ts` (3 cases)

### Task 41: Text filter UX + stability — DONE

**Files:** `FilterableDatabaseFilterGroup.tsx` (`FilterableDatabaseTextFilterField`), `useFilterableDatabase.ts`

- [x] Local draft state for Name `TextInput` (characters visible immediately; 300ms debounce to apply)
- [x] Clear debounce timer on `removeFilterValue` for `type: "text"` (avoid stale filter after pill remove)
- [x] `useFilterableDatabase` stable load deps + `selectionRef` preserved on reload

### Task 42: Card render stability — DONE

**Files:** `ButtonImageCard.tsx` (`React.memo`), `SelectComponentAsync.tsx`, `ParameterStringComponent.tsx`, `ParameterSelectComponent.tsx`

- [x] `memo(ButtonImageCard)` — fewer image re-renders when parent updates
- [x] Skip `handleChange` when serialized value unchanged
- [x] `ParameterSelectComponent`: skip re-select when index unchanged

### Task 37: Manual QA (updated checklist) — PENDING

**URLs:** `http://localhost:3001/?g=SS-9717.json` and/or `SS-9717--2.json` + Settings textarea

| # | Check | Expected |
|---|-------|----------|
| 14 | **GridCards canonical** | `grid`, `source: "graphics"`, `limit: 5` — only 5 cards initially; Load more via scroll |
| 15 | **Full CSV** | Filters show realistic cardinality on `textile-database-full.csv` |
| 16 | **Filter flicker** | Toggling Category/Color/Materials does not remount entire grid |
| 17 | **Card click** | Single card select: **no double flash**; brief busy state (`wait` cursor, slight dim) during execute OK |
| 18 | **Name filter** | Typing shows characters immediately; debounced filter apply |
| 19 | **String value** | String param with `database` + `data` stores JSON (`category`, `color`, `materials`), not raw item key |
| 20 | **Default case** | StringList with `source: "graphics"` without `database` still works (`emitValue=itemKey`) |
| 21 | **Hard disabled** | When param disabled by another interaction param — cards still show `cardDisabled` (0.6), not just busy |

**Automated:** `pnpm test --testPathPattern="filterableDatabase|resolveStringSelectEmitValue"` (**79 tests**)

### Phase 6 file map

| File | Action | Status |
|------|--------|--------|
| `model/useCustomHeight.tsx` | No child memo on scroll wrapper | Done |
| `model/useParameterComponentCommons.ts` | Export `executing` only | Done |
| `lib/select/resolveStringSelectEmitValue.ts` | String `emitValue` helper | Done |
| `lib/select/__tests__/resolveStringSelectEmitValue.test.ts` | Unit tests | Done |
| `ui/ParameterStringComponent.tsx` | `executing` + `emitValue` for database | Done |
| `ui/ParameterSelectComponent.tsx` | `executing` when `database` | Done |
| `ui/select/SelectComponent.tsx` | `executing?:` on props | Done |
| `ui/select/FilterableSelectComponent.tsx` | Passes `executing` via spread (no extra prop) | Done |
| `ui/select/SelectComponentAsync.tsx` | `busy` / no-op guards (no `suppressDisabledStyleWhileBusy`) | Done |
| `ui/select/SelectGridComponent.tsx` | `busy` only (no `blockInteraction`) | Done |
| `ui/select/SelectFullWidthCards.tsx` | `busy` only (no `blockInteraction`) | Done |
| `ui/select/ButtonImageCard.tsx` | `memo` | Done |
| `model/filterableDatabase/useFilterableDatabase.ts` | Stable deps, text debounce clear | Done |
| `ui/filterableDatabase/FilterableDatabaseFilterGroup.tsx` | Text filter draft field | Done |
| `lib/filterableDatabase/jsonEngine.ts` | Object rows + nested `data` | Done (Phase 5) |

### Compliance review summary (updated 2026-06-30)

| Area | Status |
|------|--------|
| Database block (`itemDataDefinition`, filters) | ✅ GridCards + TenCards in fixture |
| `jsonEngine` object rows + nested `data` | ✅ Done |
| `limit` → database paging | ✅ Done (Task 32) |
| String param JSON serialization | ✅ Task 40 (`emitValue=itemData` for database) |
| Flicker on filter change | ✅ Task 38 (`useCustomHeight`) |
| Flicker on card click | ✅ Task 39 (`busy` — not global `interactionDisabled`) |
| Unit tests | ✅ **79** passed |
| Uncommitted working tree | ❌ Submodule + parent fixture need commit |
| Full Jira CSV | ❌ 150-row generated; replace when Jira attachment available |
| Task 37 manual QA | ❌ Pending |

---

### Task 37 (legacy pointer)

Legacy combobox checklist items 1–13: **Task 19**. Phase 6 QA items 14–21: section **Task 37** above.

**Automated (legacy):**

```bash
pnpm test --testPathPattern=filterableDatabase
```

---

## Phase 7: Lazy-scroll fixes + production CSV fixture (2026-06-25)

**Trigger:** Manual QA on `http://localhost:3000/?g=/SS-9717.json` — filterable database shows values but **infinite scroll / lazy loading broken**; after partial fix, scroll required **end-then-back** gesture; **burst page loads** (many cards at once).

**Goal:** Reliable client-side paging for `createFilterableDatabaseScrollingApi` → `useSelectAsync` → `SelectComponentAsync` → grid/fullwidth cards inside fixed `height` scroll panel.

**Scope:** Scrolling / paging path only — **not** filter value extraction (filters still load all unique values from full CSV in memory; **not** virtual list windowing).

### Task 43: Wire `public/database-full.csv` in parent fixture — DONE

**Files:** `public/SS-9717.json`, `public/database-full.csv` (763 rows, Jira production schema)

- [x] **GridCards** + **TenCards** `database.dataSource.href` → `/database-full.csv` (was `/textile-database-full.csv`)
- [x] **`itemDataDefinition`** remapped to 10-column CSV:

| Col | Field | Maps to |
|-----|-------|---------|
| 0 | id | `value` |
| 1 | slug name | `displayname` |
| 2 | brand | `data.materials` |
| 3 | color name | `data.color` |
| 4 | hex | `data.colorHex` |
| 5 | pattern | `data.category` |
| 7 | thumbnail 128px | `imageUrl` |
| 8 | usage (`;`) | `data.usage` |
| 9 | tags (`;`) | `data.tags` |

- [x] **Filters:** Name (text), Materials, Category, Color (`type: "color"` on hex col 4), Usage + Tags (`multivalued`)
- [ ] **SevenCards** still uses `/textile-database-sample.json` (small JSON fixture) — intentional

**Preview URL:** `http://localhost:3000/?g=/SS-9717.json&redirect=0` — use **`/SS-9717.json`** (leading slash), not `g=SS-9717.json`.

### Failures & root causes — lazy scroll (do not repeat)

| # | Symptom | Root cause | Fix |
|---|---------|------------|-----|
| L1 | Scroll does nothing; cards never grow | `loadMore` mutates `api.items` in place but **did not** `bumpResetState()` → `useSelectAsync` `useMemo` cached stale `items` | `bumpResetState()` at end of `loadMore` |
| L2 | Must scroll to bottom **and back** to trigger load | `useCustomHeight` **memoized** scroll wrapper on `[children]` → remounted scroll div + sentinel; IO observer reset | Remove `useMemo` on scroll wrapper; stable `overflowY: auto` div |
| L3 | IO never fires on inner scroll | `useInfiniteScroll` without **`rootRef`** — observer used **viewport**, not 400px panel | Pass `rootRef` from hook → `scrollRootRef` → `useCustomHeight` scroll div |
| L4 | Loads **many pages at once** | `rootMargin: "0px 0px 400px 0px"` inside ~400px panel → sentinel always intersecting; `scrollingApi.loading` always `false` for filterable API | `rootMargin: "0px 0px 48px 0px"`; `loadingMore` state + ref in `useSelectAsync`; `delayInMs: 150` |
| L5 | User expects cards above fold to **unmount** | **By design:** `IScrollingApi` uses **append paging** (`slice(0, loadedCount)`), not virtual windowing — all loaded cards stay in DOM | Document; virtual list is out of v1 scope |

### Task 44: `createScrollingApi` — `loadMore` re-render signal — DONE

**File:** `entities/parameter/lib/filterableDatabase/createScrollingApi.ts`

- [x] `loadMore` calls `bumpResetState()` after updating `api.items` / `api.hasNextPage`
- [x] Guard `if (!api.hasNextPage || api.loading) return` (sync `loading` flip — see review nit)
- [x] Test: `loadMore bumps resetState so consumers can re-render`

### Task 45: `useSelectAsync` — IO root + burst guard — DONE

**File:** `entities/parameter/model/select/useSelectAsync.ts`

- [x] `const [infiniteRef, { rootRef }] = useInfiniteScroll(...)`
- [x] Return `scrollRootRef: rootRef`
- [x] `loading: scrollingApi?.loading || loadingMore`
- [x] `handleLoadMore`: `loadingMoreRef` + `setLoadingMore(true)`; unlock in `finally`
- [x] **Double `requestAnimationFrame`** before unlock — heuristic: wait for layout/paint so sentinel moves down before `loading` goes false (prevents chained `loadMore` when sentinel still intersecting)
- [x] `rootMargin` 400px → **48px**; `delayInMs: 150`

**Alternatives considered (if burst returns after QA):**

| Approach | Trade-off |
|----------|-----------|
| Single `rAF` | Simpler; may be enough after L2–L4 fixes |
| No `rAF`, only `loadingMore` | Try after QA; may cascade if sentinel stays visible |
| Edge-trigger (reload only after sentinel leaves viewport) | Most correct; more code |
| `delayInMs` only | Debounces every load; does not fix instant re-fire |
| Virtual list (`@tanstack/react-virtual`) | Scales DOM; separate feature |

### Task 46: Scroll container wiring — DONE

| File | Change |
|------|--------|
| `model/useCustomHeight.tsx` | Optional `scrollRootRef` on scroll div; **no** `useMemo` wrapping `children` |
| `ui/select/SelectComponentAsync.tsx` | Destructure `scrollRootRef` from `useSelectAsync`; pass `scrollRootRef={scrollRootRef}` to grid/fullwidth (**minimal diff** — no change to public props API) |
| `ui/select/SelectGridComponent.tsx` | `SelectGridComponentProps` type; destructure `scrollRootRef`; `useCustomHeight(..., scrollRootRef)`; `multiselect ?? false` |
| `ui/select/SelectFullWidthCards.tsx` | Same as grid |
| `ui/select/SelectComponent.tsx` | `scrollRootRef?: React.Ref<HTMLDivElement>` on `SelectComponentProps` |

**Call-site note:** `SelectComponentAsync` is used only from `SelectComponent.tsx` (ecommerce `source` + shared async path). Filterable database uses `FilterableSelectComponent` → same `SelectComponentAsync` internally. **No new external API** — `scrollRootRef` is internal plumbing.

### Task 47: TypeScript errors — FIXED

| Error | Cause | Fix |
|-------|-------|-----|
| `Property 'scrollRootRef' does not exist` on `SelectComponentAsync` JSX | `UniversalMultiSelectComponentProps` union + `Partial<StyleProps>` did not surface `scrollRootRef` to IDE/tsc in inline JSX | Export `SelectGridComponentProps` / `SelectFullWidthCardsComponentProps` with explicit `scrollRootRef?`; add to `SelectComponentProps` |
| `Type 'true' is not assignable to type 'false'` (transient) | Narrowed props to `multiselect?: false` only — broke `MultiSelectComponent` | Revert to `UniversalMultiSelectComponentProps & … & { scrollRootRef? }` |
| `multiselect` possibly `undefined` | Stricter props | `multiselect ?? false` in `parameterMultiSelect` |

**Verify:** `pnpm exec tsc --noEmit` — exit 0.

### Code review (scrollingApi scope only) — 2026-06-25

**Verdict:** Approve with nits.

| Severity | Finding | Action |
|----------|---------|--------|
| Important | `bottomSection` hides sentinel when `scrollingApi.loading` — bad for ecommerce async path (sentinel remounts) | [ ] Consider: render sentinel whenever `hasNextPage` (drop `!loading` guard) |
| Important | `resetState` on every `loadMore` re-runs selection-clear effect in `SelectComponentAsync` | OK today (`isValueInAvailableItems`); fragile — future: separate `itemsVersion` vs `resetState` |
| Minor | Sync `api.loading` in filterable `loadMore` does not block concurrent calls | Real guard is `loadingMoreRef` |
| Minor | `setPageSize` still no `bumpResetState` | Pre-existing; follow-up |
| Test gap | No `useSelectAsync` tests (burst guard, `scrollRootRef`, item refresh) | [ ] Optional follow-up |

### Phase 7 file map

| File | Action | Status |
|------|--------|--------|
| `lib/filterableDatabase/createScrollingApi.ts` | `bumpResetState` in `loadMore`; loading guard | Done |
| `lib/filterableDatabase/__tests__/createScrollingApi.test.ts` | `loadMore` resetState test | Done |
| `model/select/useSelectAsync.ts` | `rootRef`, `loadingMore`, `rootMargin`, double rAF | Done |
| `model/useCustomHeight.tsx` | Stable scroll wrapper + `scrollRootRef` | Done |
| `ui/select/SelectComponentAsync.tsx` | Pass `scrollRootRef` (2 lines) | Done |
| `ui/select/SelectGridComponent.tsx` | Props type + `scrollRootRef` plumbing | Done |
| `ui/select/SelectFullWidthCards.tsx` | Same | Done |
| `ui/select/SelectComponent.tsx` | `scrollRootRef?` on props | Done |
| `public/SS-9717.json` | `/database-full.csv` + column/filter mapping | Done (parent repo) |

### Task 37: Manual QA — update after Phase 7

Re-run items **14–15** with new URL and CSV:

| # | Check | Expected |
|---|-------|----------|
| 14 | **GridCards lazy scroll** | Initial **5** cards (`limit: 5`); scroll **inside** 400px panel loads **5 more** per gesture; no burst |
| 15 | **Full CSV** | **763** rows in `/database-full.csv`; filters show realistic cardinality (Materials, Category, Color, Usage, Tags) |
| 22 | **URL shape** | `?g=/SS-9717.json` loads theme; `g=SS-9717.json` (no slash) may resolve incorrectly |
| 23 | **Ecommerce `source` path** | `SelectComponent` → `SelectComponentAsync` with Zustand scrolling API still paginates (no regression) |

**Automated:**

```bash
pnpm test -- --testPathPattern="filterableDatabase|createScrollingApi"
pnpm exec tsc --noEmit
```

### Phase 7 compliance summary

| Area | Status |
|------|--------|
| Lazy scroll (filterable database) | ✅ Fixed in working tree (L1–L4) |
| Production CSV in fixture | ✅ `database-full.csv` wired |
| `SelectComponentAsync` API surface | ✅ Unchanged for callers |
| Virtual list / DOM unmount above fold | ❌ Out of scope (append paging by design) |
| Code review nits (sentinel `loading` guard) | ❌ Optional follow-up |
| `useSelectAsync` unit tests | ❌ Optional follow-up |
| Task 37 manual QA | ❌ Pending re-run |
