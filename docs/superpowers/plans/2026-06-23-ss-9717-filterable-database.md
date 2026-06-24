# SS-9717 Filterable Database Component Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a `FilterableSelectComponent` that loads CSV from a public URL, filters rows via Mantine filter UI (Accordion + checkboxes), and displays results through the existing `SelectComponentAsync` infinite-scroll path.

**Architecture:** `FilterableDatabaseEngine` (`csvEngine` | `jsonEngine`) + `resolveDataSource` (`href` | `export`) → shared `filterLogic` / `itemMapping` → client-side `IScrollingApi` adapter → `SelectComponentAsync`. Types from commit `fdc188b` merged into `appbuilder.ts` with Zod validation.

**Tech Stack:** React 19, TypeScript, Mantine v8 (Accordion, Checkbox, Pill), Zustand (existing scrolling store bypassed — local adapter), Jest, Zod.

**Status (2026-06-23):** Tasks 1–12, Phase 2, and Phase 3 (Tasks 22–23) complete in submodule. Commits: `3cf9008` (review fixes), `ff5f016` (jsonEngine), `a4e192a` (export). **58 tests** in `lib/filterableDatabase` + settings. Parent repo: submodule pointer, plan, `textile-database-sample.json` commit pending. Manual QA (`SS-9717.json` href + export path) recommended before PR.

**Spec:** `docs/superpowers/specs/2026-06-23-ss-9717-filterable-database-design.md`

**Branch:** `task/SS-9717-Filterable-database-component` (parent + `src/shared` submodule)

**Manual test URL:** `http://localhost:3000/?g=SS-9717.json` (parameter **TenCards**, session SS-8997 / `sdr8euc1`)

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
| `src/shared/entities/parameter/lib/filterableDatabase/__tests__/*.test.ts` | Create | Done (58 tests in lib + settings) |
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

- [x] **Step 1: Run all new tests** — `pnpm test -- src/shared/entities/parameter/lib/filterableDatabase filterableDatabaseSettings.test.ts` (**58 passed** after Phase 3)

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

**URL:** `http://localhost:3000/?g=SS-9717.json` → **TenCards**

| # | Check | Expected |
|---|-------|----------|
| 1 | Filter panels | 3 collapsed accordion groups: **Category**, **Color**, **Materials** |
| 2 | Checkbox / label click | Toggles selection |
| 3 | Active pills | Appear above cards (prepend section); removable |
| 4 | Filter logic | No spurious header values in filters; Red → fabric cards; combined filters narrow results |
| 5 | Search | Typing does **not** clear selected card if still in filtered list |
| 6 | Selection persistence | Card stays selected after filter change when item still visible |
| 7 | Console | No `Maximum update depth exceeded` |
| 8 | JSON href (optional) | `href: "/textile-database-sample.json"` + `format: "json"` loads same data as CSV |
| 9 | Export source (optional) | Replace `href` with `export: { name, sessionId }` on live session — Task 22 Step 5 |

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
| String param value display | **Done** (Task 21) | JSON value resolved to item key for UI |
| **Search scope** | Open | `matchesSearchTerms` only checks `item` + `displayname` — not `description` / `data` columns |
| **Fetch error UX** | Open | Inline `Text c="red"` only; spec also mentions notification |
| **Theme registry** | Open | `FilterableSelectComponentThemeProps` not registered in `useCustomTheme.ts` |
| **`FilterableDatabaseFilterGroup.multiple`** | Open | Prop passed but unused; hook handles toggle logic |
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
- Fixture: `public/SS-9717.json` — Category / Color / Materials

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
| Unit tests | Tasks 2, 4–7, 16 (`buildActiveFilterTags`), 21, 22–23 (**58** total) |
| Manual fixture | Task 11, 13 |
| Search + filter pills | Task 16–17 |
| Code review blockers | Task 21 |
| Selection lifecycle (load/search/filter) | Task 21 |
| Export data source (`dataSource.export`) | Task 22 — **Done** |
| JSON data source (`jsonEngine`) | Task 23 — **Done** |
| Jest test path aliases | Task 24 — **Done** |
| Filters in Select dropdown + tags inside input | Task 25 — **Done** |
| Filter `multiple` UI (radio vs checkbox) | Task 26 — **Done** |

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

### Task 25 + 26 integration notes

- Task 25 owns layout/orchestration; Task 26 owns `FilterOption` control type.
- If both touch `FilterableSelectComponent.tsx`, merge `defaultStyleProps` (filter select props + `radioProps`).
- Run after both: `pnpm test --testPathPattern=filterableDatabase` (**target: ≥68 tests** after Task 25–26)
