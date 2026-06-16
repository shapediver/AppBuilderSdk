# SS-9298 Config docs generation — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extend the TypeDoc plugin so it emits `public/doc-flat.json` (deduplicated flat array with `configPath`) and `public/doc-nested.json` (nested mirror), matching [`docs/superpowers/specs/2026-05-04-ss-9298-llm-config-docs-design.md`](../specs/2026-05-04-ss-9298-llm-config-docs-design.md).

**Architecture:** Keep reflection walking in `typedoc-plugin-config-filter/index.js` (the entry TypeDoc loads). Extract pure helpers into `buildArtifacts.js` for flat deduplication and nested `set`-by-path so behavior is unit-tested without running TypeDoc. Emit both JSON files from the same resolved item list.

**Tech Stack:** TypeDoc 0.28.x, Node `fs`/`path`, Jest + ts-jest (existing `package.json` test setup).

---

## File map

| File | Role |
|------|------|
| `typedoc/typedoc-plugin-config-filter/buildArtifacts.js` | Pure: dedupe flat by `configPath` with duplicate callback; build nested tree from flat entries. |
| `typedoc/typedoc-plugin-config-filter/buildArtifacts.test.ts` | Jest tests for dedupe + nesting. |
| `typedoc/typedoc-plugin-config-filter/index.js` | TypeDoc plugin entry: collect `@docAttached` rows, skip missing `@configPath` with warn, map to flat schema, call helpers, write both outputs. |
| `typedoc/typedoc-plugin-config-filter/index.ts` | Keep in sync with `index.js` (same behavior) for editors/type-checking if present; repository currently duplicates logic here. |
| `src/shared/pages/templates/AppBuilderAppShellTemplatePage.tsx` | Fix stray `/**y` → `/**` on `StyleProps` so summary parses cleanly. |
| `typedoc.json` | Already lists custom `blockTags`; no change unless new tags are added. |
| `.cursor/rules/custom-component.mdc` | §6: правила `@docAttached` / `export` / уникальные имена типов при barrel re-export. |

---

## Implementation status (living)

| Phase | Status |
|-------|--------|
| Tasks 1–3 (plugin, tests, golden sample JSDoc) | Done |
| Task 4 Rollout (`@docAttached` на custom components из `useCustomTheme`) | Done |

### Task 4: Rollout — помечаем theme props для `doc-flat.json`

**Цель:** каждый настраиваемый через `themeOverrides.components.<Name>.defaultProps` компонент из [`useCustomTheme.ts`](../../src/shared/shared/ui/theme/useCustomTheme.ts) получает экспортируемый тип стилей с блоком:

```text
@docAttached
@configPath themeOverrides.components.<ComponentName>.defaultProps
@displayName <ComponentName>
```

`<ComponentName>` **обязан** совпадать с строкой в `useProps("<ComponentName>", …)` **и** с ключом в `components` темы.

**Ограничения TypeDoc (обязательные):**

1. Тип с `@docAttached` должен быть **`export`**, иначе символ не попадает в проект и плагин его не видит.
2. Если несколько модулей реэкспортируются через один `export * from` и оба экспортируют одно имя (например `StyleProps`), сборка падает с **TS2308** — используй уникальные имена (`ExportButtonComponentStyleProps`, …).
3. Команда генерации: **`pnpm run docs`** (не bare `pnpm docs` — коллизия с npm в этой среде).
4. После изменений в подмодуле `src/shared`: коммит там → обновить указатель подмодуля в родителе → при необходимости закоммитить обновлённые `public/doc-flat.json` и `public/doc-nested.json`.

**Уже покрыто докой (проверка):** запустить `pnpm run docs`, затем `node -e "console.log(require('./public/doc-flat.json').map(e=>e.name).sort())"`.

**Чеклист rollout** (отмечайте по мере добавления):

- [x] Шаблоны / контейнеры / loader / экспорт / картинка: AppShell, Grid, TemplateSelector, Horizontal, Vertical, LoaderPage, ExportButton, ExportLabel, AppBuilderImage
- [x] Shared UI: TooltipWrapper, Hint, Icon, MarkdownWidgetComponent, ModalBase
- [x] Notifications: NotificationWrapper (`NotificationStyleProps`)
- [x] Actions / output / parameters (партия 2): AppBuilderActionComponent, OutputChunkLabelComponent, OutputStargateComponent, ParameterLabelComponent, MultiSelectCheckboxes, SelectGridComponent, SelectCarouselComponent
- [x] Viewport + overlay + accept/reject + stargate input + parameter color + text widget: ViewportComponent, ViewportBranding, ViewportIcons, ViewportIconButton (merged theme type), ViewportIconButtonDropdown (**исправлен `useProps` id**), ViewportOverlayWrapper, ViewportAcceptRejectButtons, StargateInput, ParameterColorComponent, AppBuilderTextWidgetComponent
- [x] Остальные ключи из `useCustomTheme` → `components` (формы, accordion widgets, desktop panel, параметры взаимодействия, контейнеры, agent, charts, session/hooks и т.д.). Динамические ключи (`NumberAttribute`, `StringAttribute`, `ViewportAnchor2d` / `ViewportAnchor3d`, зависящие от `componentContext`) намеренно без отдельной строки в `doc-flat`.

---

### Task 1: Pure artifact builders + tests (TDD)

**Files:**

- Create: `typedoc/typedoc-plugin-config-filter/buildArtifacts.js`
- Create: `typedoc/typedoc-plugin-config-filter/buildArtifacts.test.ts`

- [ ] **Step 1: Write the failing test**

Create `typedoc/typedoc-plugin-config-filter/buildArtifacts.test.ts`:

```typescript
import {
	buildNestedDocRoot,
	dedupeFlatEntriesByConfigPath,
} from "./buildArtifacts.js";

type DocFlatEntry = {
	configPath: string;
	name: string;
	summary: string;
	source: string;
	properties?: Array<{
		name: string;
		description: string;
		type: string;
	}>;
};

describe("dedupeFlatEntriesByConfigPath", () => {
	it("keeps last entry and notifies on duplicate configPath", () => {
		const duplicatePaths: string[] = [];
		const entries: DocFlatEntry[] = [
			{
				configPath: "themeOverrides.components.X.defaultProps",
				name: "First",
				summary: "",
				source: "a.ts",
				properties: [
					{name: "n", description: "", type: "string"},
				],
			},
			{
				configPath: "themeOverrides.components.X.defaultProps",
				name: "Second",
				summary: "",
				source: "b.ts",
				properties: [],
			},
		];
		const out = dedupeFlatEntriesByConfigPath(entries, (path) => {
			duplicatePaths.push(path);
		});
		expect(duplicatePaths).toEqual([
			"themeOverrides.components.X.defaultProps",
		]);
		expect(out).toHaveLength(1);
		expect(out[0].name).toBe("Second");
	});
});

describe("buildNestedDocRoot", () => {
	it("places properties at nested path from configPath", () => {
		const entries: DocFlatEntry[] = [
			{
				configPath: "themeOverrides.components.Foo.defaultProps",
				name: "Foo",
				summary: "About Foo",
				source: "Foo.tsx",
				properties: [
					{name: "bar", description: "desc", type: "number"},
				],
			},
		];
		const nested = buildNestedDocRoot(entries) as Record<
			string,
			unknown
		>;
		const leaf = (
			nested as {
				themeOverrides: {
					components: {
						Foo: {"defaultProps": {properties: unknown[]}};
					};
				};
			}
		).themeOverrides.components.Foo.defaultProps;
		expect(leaf.properties).toEqual([
			{name: "bar", description: "desc", type: "number"},
		]);
	});
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
cd /path/to/AppBuilderSdk && pnpm exec jest typedoc/typedoc-plugin-config-filter/buildArtifacts.test.ts --no-cache
```

Expected: **FAIL** with `Cannot find module './buildArtifacts.js'` or missing export.

- [ ] **Step 3: Implement `buildArtifacts.js`**

Create `typedoc/typedoc-plugin-config-filter/buildArtifacts.js`:

```javascript
/**
 * @typedef {Object} DocProperty
 * @property {string} name
 * @property {string} description
 * @property {string} type
 * @property {string} [default]
 * @property {string} [minimum]
 * @property {string} [maximum]
 * @property {string} [example]
 */

/**
 * @typedef {Object} DocFlatEntry
 * @property {string} configPath
 * @property {string} name
 * @property {string} summary
 * @property {string} source
 * @property {DocProperty[]} [properties]
 */

/**
 * Last occurrence wins; duplicate configPath triggers onDuplicate before overwrite.
 * @param {DocFlatEntry[]} entries
 * @param {(configPath: string) => void} onDuplicate
 * @returns {DocFlatEntry[]}
 */
export function dedupeFlatEntriesByConfigPath(entries, onDuplicate) {
	/** @type {Map<string, DocFlatEntry>} */
	const map = new Map();
	for (const entry of entries) {
		if (map.has(entry.configPath)) {
			onDuplicate(entry.configPath);
		}
		map.set(entry.configPath, entry);
	}
	return [...map.values()];
}

/**
 * @param {Record<string, unknown>} obj
 * @param {string} dotPath
 * @param {unknown} value
 */
function setAtPath(obj, dotPath, value) {
	const keys = dotPath.split(".");
	let current = obj;
	for (let i = 0; i < keys.length - 1; i++) {
		const key = keys[i];
		const next = current[key];
		if (!next || typeof next !== "object") {
			current[key] = {};
		}
		current = /** @type {Record<string, unknown>} */ (current[key]);
	}
	current[keys[keys.length - 1]] = value;
}

/**
 * @param {DocFlatEntry[]} entries
 * @returns {Record<string, unknown>}
 */
export function buildNestedDocRoot(entries) {
	/** @type {Record<string, unknown>} */
	const root = {};
	for (const entry of entries) {
		setAtPath(root, entry.configPath, {
			properties: entry.properties ?? [],
		});
	}
	return root;
}
```

- [ ] **Step 4: Run tests — expect PASS**

Run:

```bash
pnpm exec jest typedoc/typedoc-plugin-config-filter/buildArtifacts.test.ts --no-cache
```

Expected: **PASS** (2 tests).

- [ ] **Step 5: Commit**

```bash
git add typedoc/typedoc-plugin-config-filter/buildArtifacts.js typedoc/typedoc-plugin-config-filter/buildArtifacts.test.ts
git commit -m "SS-9298: add buildArtifacts helpers and tests for config docs"
```

---

### Task 2: Wire TypeDoc plugin — dual JSON emit + schema alignment

**Files:**

- Modify: `typedoc/typedoc-plugin-config-filter/index.js`
- Modify: `typedoc/typedoc-plugin-config-filter/index.ts` (mirror behavior)

- [ ] **Step 1: Update `index.js`**

1. Add near top: `import {buildNestedDocRoot, dedupeFlatEntriesByConfigPath} from "./buildArtifacts.js";`
2. When building each `configItem` from a `@docAttached` reflection:
   - Use **`summary`** (not `comment`) for the text from `getText(reflection.comment.summary)`.
   - **Remove** `kind` from the object that will be written to JSON (spec flat schema has no `kind`).
   - If `configPath` is missing after trim: `console.warn("[typedoc-plugin-config-filter] @docAttached without @configPath:", reflection.name);` and **`continue`** (do not push to the collection).
3. After the loop, from the collected array `withPaths`:
   - `const flat = dedupeFlatEntriesByConfigPath(withPaths, (p) => console.warn("[typedoc-plugin-config-filter] duplicate configPath:", p));`
   - `const nested = buildNestedDocRoot(flat);`
4. Write **`public/doc-flat.json`** with `JSON.stringify(flat, null, 2)` and **`public/doc-nested.json`** with `JSON.stringify(nested, null, 2)`.
5. Fix the stale comment that says `llm-ui-config.json`; both filenames must read `doc-flat.json` / `doc-nested.json`.

Illustrative core snippet (integrate into existing helpers — do not duplicate `getText` / `processTagValue`):

```javascript
import fs from "fs";
import path from "path";
import {Converter} from "typedoc";
import {buildNestedDocRoot, dedupeFlatEntriesByConfigPath} from "./buildArtifacts.js";

// inside RESOLVE_END, after defining getText / processTagValue:
const rawWithPath = [];

for (const reflection of Object.values(project.reflections)) {
	const blockTags = reflection.comment?.blockTags;
	if (!blockTags?.length) continue;
	const tagMap = new Map(blockTags.map((tag) => [tag.tag, tag]));
	if (!tagMap.has("@docAttached")) continue;

	const displayNameTag = tagMap.get("@displayName");
	const configPathTag = tagMap.get("@configPath");
	const configPath = configPathTag
		? getText(configPathTag.content).trim()
		: "";

	if (!configPath) {
		console.warn(
			"[typedoc-plugin-config-filter] @docAttached without @configPath:",
			reflection.name,
		);
		continue;
	}

	const entry = {
		configPath,
		name: displayNameTag
			? getText(displayNameTag.content).trim()
			: reflection.name,
		summary: getText(reflection.comment.summary),
		source: reflection.sources?.[0]?.fileName || "unknown",
	};

	if (reflection.children?.length) {
		entry.properties = reflection.children.map((child) => {
			const prop = {
				name: child.name,
				description: getText(child.comment?.summary),
				type: child.type?.toString() || "unknown",
			};
			const childTags = child.comment?.blockTags;
			if (childTags) {
				for (const tag of childTags) {
					const tagName = tag.tag;
					if (
						tagName === "@default" ||
						tagName === "@minimum" ||
						tagName === "@maximum" ||
						tagName === "@example"
					) {
						const key = tagName.substring(1);
						prop[key] = processTagValue(getText(tag.content));
					}
				}
			}
			return prop;
		});
	}

	rawWithPath.push(entry);
}

const flat = dedupeFlatEntriesByConfigPath(rawWithPath, (p) =>
	console.warn("[typedoc-plugin-config-filter] duplicate configPath:", p),
);
const structuredConfig = buildNestedDocRoot(flat);

const publicDir = "./public";
if (!fs.existsSync(publicDir)) {
	fs.mkdirSync(publicDir, {recursive: true});
}

fs.writeFileSync(
	path.join(publicDir, "doc-flat.json"),
	JSON.stringify(flat, null, 2),
);
fs.writeFileSync(
	path.join(publicDir, "doc-nested.json"),
	JSON.stringify(structuredConfig, null, 2),
);
console.log(
	`Successfully generated doc-flat.json and doc-nested.json (${flat.length} entries)`,
);
```

- [ ] **Step 2: Mirror changes in `index.ts`**

Apply the same logic and imports (`buildArtifacts.js` from the same directory). Match types loosely with `any` where TypeDoc types are awkward — priority is behavioral parity with `index.js`.

- [ ] **Step 3: Run TypeDoc**

Run:

```bash
pnpm run docs
```

Expected: Console shows plugin loading / executing without throwing; **no** unhandled plugin error.

- [ ] **Step 4: Validate output shape**

Run:

```bash
node -e "const f=require('fs');const flat=JSON.parse(f.readFileSync('public/doc-flat.json','utf8'));const n=JSON.parse(f.readFileSync('public/doc-nested.json','utf8')); if(!Array.isArray(flat)) throw new Error('doc-flat must be array'); if(typeof n!=='object'||n===null||Array.isArray(n)) throw new Error('doc-nested must be object'); const e=flat[0]; const need=['configPath','name','summary','source']; for(const k of need){if(!(k in e)) throw new Error('flat entry missing '+k)} console.log('ok', flat.length, 'entries');"
```

Expected: prints `ok 1 entries` (or more if other `@docAttached` symbols exist).

- [ ] **Step 5: Commit**

```bash
git add typedoc/typedoc-plugin-config-filter/index.js typedoc/typedoc-plugin-config-filter/index.ts public/doc-flat.json public/doc-nested.json
git commit -m "SS-9298: emit doc-flat and doc-nested from TypeDoc plugin"
```

Omit `public/*.json` from the commit if your team does not version generated artifacts — then commit only plugin files.

---

### Task 3: Fix `StyleProps` JSDoc typo (golden sample)

**Files:**

- Modify: `src/shared/pages/templates/AppBuilderAppShellTemplatePage.tsx` (around the `StyleProps` interface opening comment)

- [ ] **Step 1: Replace `/**y` with `/**`**

- [ ] **Step 2: Commit**

```bash
git add src/shared/pages/templates/AppBuilderAppShellTemplatePage.tsx
git commit -m "SS-9298: fix StyleProps JSDoc opener"
```

---

## Spec coverage checklist (plan author self-review)

| Spec requirement | Task |
|------------------|------|
| `doc-flat.json` flat array, `configPath` on each row | Task 2 |
| `doc-nested.json` nested by path, leaf `{ properties }` | Task 2 + Task 1 `buildNestedDocRoot` |
| Skip `@docAttached` without `@configPath`, warn | Task 2 |
| Duplicate `configPath`: warn + dedupe flat + consistent nested | Task 1 + Task 2 |
| Flat fields: `name`, `summary`, `source`, `properties` (no `kind`) | Task 2 |
| Extensible tags (future) | No code change — follow spec doc when adding tags |

---

**Plan file:** `docs/superpowers/plans/2026-05-04-ss-9298-config-docs-generation.md`. Tasks 1–3 выполнены; дальнейшая работа ведётся по **Task 4 (rollout)** выше.
