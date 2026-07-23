# SS-9879 Stacks in Tabs Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix stack UI so forward buttons inside tab panels open stack content with correct slide animation and per-tab navigation state.

**Architecture:** Extract `AppBuilderWidgetsWithStackShell` (per-scope `useStackContext` + Provider + shell). Use it inside each tab panel and for container-level widgets. Remove the broken container-level shell that only saw `container.widgets`.

**Tech Stack:** React 19, TypeScript, Zustand (unchanged), Jest, existing stack UI components in `src/shared` submodule.

**Spec:** `docs/superpowers/specs/2026-07-15-ss-9879-stacks-in-tabs-design.md`

**Branch:** `task/SS-9879` (parent + `src/shared` submodule commits)

## Global Constraints

- Submodule code lives in `src/shared/` — commit there with `SS-9879: …` messages.
- No changes to `useStackContext` API unless strictly necessary (not needed for B1).
- Follow FSD import alias `@AppBuilderLib/`.
- Do not add `useProps` / theme registration.
- Fix linter issues only on changed files.

---

## File map

| File | Action |
|------|--------|
| `src/shared/widgets/appbuilder/ui/AppBuilderWidgetsWithStackShell.tsx` | Create |
| `src/shared/widgets/appbuilder/ui/AppBuilderTabsComponent.tsx` | Modify |
| `src/shared/widgets/appbuilder/ui/AppBuilderContainerComponent.tsx` | Modify |
| `src/shared/features/appbuilder/config/__tests__/validateAppBuilderSettingsJson.appBuilderOverride.test.ts` | Modify — stack-in-tabs fixture |
| `public/SS-9879.json` | Modify — add layout with stack in tab (keep existing sessions) |

---

### Task 1: `AppBuilderWidgetsWithStackShell`

**Files:**
- Create: `src/shared/widgets/appbuilder/ui/AppBuilderWidgetsWithStackShell.tsx`

**Interfaces:**
- Produces: default export `AppBuilderWidgetsWithStackShell({ namespace, widgets, fallbackScrolls? })`

- [ ] **Step 1: Create component**

```tsx
import {IAppBuilderWidget} from "@AppBuilderLib/features/appbuilder/config/appbuilder";
import {AppBuilderStackContext} from "@AppBuilderLib/features/appbuilder/lib/StackContext";
import {useStackContext} from "@AppBuilderLib/features/appbuilder/model/useStackContext";
import AppBuilderStackUiWidgetComponent from "@AppBuilderLib/widgets/appbuilder/ui/AppBuilderStackUiWidget/AppBuilderStackUiWidgetComponent";
import AppBuilderWidgetsComponent from "@AppBuilderLib/widgets/appbuilder/ui/AppBuilderWidgetsComponent";

interface Props {
	namespace: string;
	widgets: IAppBuilderWidget[] | undefined;
	fallbackScrolls?: boolean;
}

export default function AppBuilderWidgetsWithStackShell({
	namespace,
	widgets,
	fallbackScrolls = false,
}: Props) {
	const {stackPath, context} = useStackContext(300);

	return (
		<AppBuilderStackContext.Provider value={context}>
			<AppBuilderStackUiWidgetComponent
				namespace={namespace}
				stackPath={stackPath}
				liveWidgets={widgets}
				fallbackScrolls={fallbackScrolls}
			>
				<AppBuilderWidgetsComponent
					namespace={namespace}
					widgets={widgets}
				/>
			</AppBuilderStackUiWidgetComponent>
		</AppBuilderStackContext.Provider>
	);
}
```

- [ ] **Step 2: Typecheck**

Run: `pnpm exec tsc --noEmit`
Expected: PASS

---

### Task 2: Wire tabs

**Files:**
- Modify: `src/shared/widgets/appbuilder/ui/AppBuilderTabsComponent.tsx`

**Interfaces:**
- Consumes: `AppBuilderWidgetsWithStackShell` from Task 1

- [ ] **Step 1: Replace bare `AppBuilderWidgetsComponent` in tab children**

In `tabProps` `tabs.map`, change children from:

```tsx
<AppBuilderWidgetsComponent
  key={0}
  namespace={namespace}
  widgets={tab.widgets}
/>,
```

to:

```tsx
<AppBuilderWidgetsWithStackShell
  key={0}
  namespace={namespace}
  widgets={tab.widgets}
/>,
```

- [ ] **Step 2: Update imports**

Remove direct `AppBuilderWidgetsComponent` import if unused; add `AppBuilderWidgetsWithStackShell`.

- [ ] **Step 3: Typecheck**

Run: `pnpm exec tsc --noEmit`
Expected: PASS

---

### Task 3: Refactor container

**Files:**
- Modify: `src/shared/widgets/appbuilder/ui/AppBuilderContainerComponent.tsx`

**Interfaces:**
- Consumes: `AppBuilderWidgetsWithStackShell` from Task 1

- [ ] **Step 1: Replace container body**

```tsx
import {IAppBuilderContainer} from "@AppBuilderLib/features/appbuilder/config/appbuilder";
import AppBuilderWidgetsWithStackShell from "@AppBuilderLib/widgets/appbuilder/ui/AppBuilderWidgetsWithStackShell";
import AppBuilderTabsComponent from "./AppBuilderTabsComponent";

interface Props extends IAppBuilderContainer {
	namespace: string;
}

export default function AppBuilderContainerComponent({
	namespace,
	widgets,
	tabs,
	name,
}: Props) {
	const hasTabs = Boolean(tabs?.length);

	return (
		<>
			<AppBuilderTabsComponent
				namespace={namespace}
				tabs={tabs}
				containerName={name}
			/>
			{!hasTabs && (
				<AppBuilderWidgetsWithStackShell
					namespace={namespace}
					widgets={widgets}
				/>
			)}
			{hasTabs && Boolean(widgets?.length) && (
				<AppBuilderWidgetsWithStackShell
					namespace={namespace}
					widgets={widgets}
				/>
			)}
		</>
	);
}
```

- [ ] **Step 2: Remove unused imports**

Drop `AppBuilderStackContext`, `useStackContext`, `AppBuilderStackUiWidgetComponent`, `AppBuilderWidgetsComponent`.

- [ ] **Step 3: Typecheck**

Run: `pnpm exec tsc --noEmit`
Expected: PASS

---

### Task 4: Validation test

**Files:**
- Modify: `src/shared/features/appbuilder/config/__tests__/validateAppBuilderSettingsJson.appBuilderOverride.test.ts`

- [ ] **Step 1: Add accept case for stackUi inside tab**

Add inline fixture (do not read `public/*.json`):

```typescript
it("accepts stackUi inside container tabs", () => {
	const settings = {
		version: "1.0",
		sessions: [{id: "default", ticket: "t", modelViewUrl: "https://example.com"}],
		layout: {
			containers: {
				right: {
					tabs: [
						{
							name: "Tab 01",
							widgets: [
								{
									type: "stackUi",
									props: {
										name: "Settings",
										widgets: [
											{
												type: "text",
												props: {text: "Inside stack"},
											},
										],
									},
								},
							],
						},
					],
				},
			},
		},
	};
	expect(validateAppBuilderSettingsJson(settings).success).toBe(true);
});
```

Adjust fixture shape to match existing test helpers / minimal valid settings in that file.

- [ ] **Step 2: Run test**

Run: `pnpm test -- validateAppBuilderSettingsJson.appBuilderOverride`
Expected: PASS

---

### Task 5: Manual fixture

**Files:**
- Modify: `public/SS-9879.json`

- [ ] **Step 1: Add layout with stack in tab**

Keep existing `sessions` block. Add `layout` matching repro (right container, tab with `stackUi` + child widgets). Use same session ticket/modelViewUrl already in file.

- [ ] **Step 2: Manual QA**

Run dev server if not up: `pnpm run start`

Open: `http://localhost:3000/?g=/SS-9879.json&redirect=0`

Verify:
- Stack button in tab opens stack
- Back closes stack
- Tab switch: other tab not showing open stack
- Return to first tab: stack still open if was open before switch

- [ ] **Step 3: Regression**

Open: `http://localhost:3000/?g=/SS-9463.json&redirect=0`

Verify container-level stack still works.

---

### Task 6: Final verification

- [ ] **Step 1: Full test suite**

Run: `pnpm test`
Expected: PASS

- [ ] **Step 2: Typecheck**

Run: `pnpm exec tsc --noEmit`
Expected: PASS

- [ ] **Step 3: Commit submodule**

```bash
cd src/shared
git add widgets/appbuilder/ui/AppBuilderWidgetsWithStackShell.tsx \
  widgets/appbuilder/ui/AppBuilderTabsComponent.tsx \
  widgets/appbuilder/ui/AppBuilderContainerComponent.tsx \
  features/appbuilder/config/__tests__/validateAppBuilderSettingsJson.appBuilderOverride.test.ts
git commit -m "SS-9879: Fix stack UI inside tab panels"
```

- [ ] **Step 4: Commit parent**

```bash
cd ../..
git add src/shared public/SS-9879.json docs/superpowers/
git commit -m "SS-9879: Fix stacks inside tabs"
```

---

## Spec self-review

| Requirement | Task |
|-------------|------|
| Per-tab stack state (B1) | Tasks 1–3 |
| Container widgets without tabs | Task 3 `!hasTabs` branch |
| Tabs + container.widgets | Task 3 second branch |
| Nested stacks unchanged | No changes to ContentComponent |
| Validation test | Task 4 |
| Manual repro fixture | Task 5 |
| SS-9463 regression | Task 5 step 3 |

No placeholders. All file paths concrete.
