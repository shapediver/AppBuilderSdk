# SS-9717 Filterable Database Component Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a `FilterableSelectComponent` that loads CSV from a public URL, filters rows via Mantine TreeSelect UI, and displays results through the existing `SelectComponentAsync` infinite-scroll path.

**Architecture:** `csvEngine` implements `FilterableDatabaseEngine` (fetch + parse). Shared `filterLogic` and `itemMapping` operate on a normalized `DatabaseTable`. A client-side `IScrollingApi` adapter feeds `SelectComponentAsync`. Types from commit `fdc188b` merged into `appbuilder.ts` with Zod validation.

**Tech Stack:** React 19, TypeScript, Mantine v8 (Tree), Zustand (existing scrolling store bypassed — local adapter), Jest, Zod.

**Spec:** `docs/superpowers/specs/2026-06-23-ss-9717-filterable-database-design.md`

**Branch:** `task/SS-9717-Filterable-database-component` (parent + `src/shared` submodule)

---

## File map

| File | Action |
|------|--------|
| `src/shared/features/appbuilder/config/appbuilder.ts` | Add `IFilterableDatabaseSettings`, `database` field |
| `src/shared/features/appbuilder/config/appbuildertypecheck.ts` | Zod schemas + href-required refinement |
| `src/shared/entities/parameter/lib/filterableDatabase/types.ts` | Create |
| `src/shared/entities/parameter/lib/filterableDatabase/csvEngine.ts` | Create |
| `src/shared/entities/parameter/lib/filterableDatabase/filterLogic.ts` | Create |
| `src/shared/entities/parameter/lib/filterableDatabase/itemMapping.ts` | Create |
| `src/shared/entities/parameter/lib/filterableDatabase/createScrollingApi.ts` | Create |
| `src/shared/entities/parameter/lib/filterableDatabase/__tests__/*.test.ts` | Create |
| `src/shared/entities/parameter/model/filterableDatabase/useFilterableDatabase.ts` | Create |
| `src/shared/entities/parameter/ui/select/FilterableSelectComponent.tsx` | Create |
| `src/shared/entities/parameter/ui/select/SelectComponent.tsx` | Wire `database` branch |
| `public/SS-9717.json` | Test fixture (parent repo) |
| `public/textile-database-sample.csv` | Trimmed CSV sample (parent repo) |

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
			["a", "b"],
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

- [ ] **Step 1: Run all new tests**

```bash
pnpm test -- filterableDatabase
pnpm test -- filterableDatabaseSettings
```

- [ ] **Step 2: Update parent submodule pointer**

```bash
cd d:/projects/ShapeDiverCreateReactAppExample
git add src/shared
git commit -m "SS-9717: Update AppBuilderShared submodule for filterable database"
```

---

## Plan self-review

| Spec requirement | Task |
|------------------|------|
| CSV via href only | Task 4, Zod refine Task 2 |
| csvEngine + future jsonEngine interface | Task 3–4 |
| Shared filter logic | Task 5 |
| IScrollingApi adapter | Task 7 |
| SelectComponentAsync reuse | Task 9–10 |
| TreeSelect filters + color swatch | Task 9 |
| Type definitions PR 318 | Task 1 |
| Zod validation | Task 2 |
| Unit tests | Tasks 2, 4–7 |
| Manual fixture | Task 11 |

No placeholders. Export data source explicitly deferred.
