# SS-9879: Stacks inside tabs

## Motivation

[Jira SS-9879](https://shapediver.atlassian.net/browse/SS-9879) — **Stacks don't open if they are inside tabs**.

Repro model: [stack-tab-bug-5](https://dev-wwwcdn.us-east-1.shapediver.com/app/m/stack-tab-bug-5). Clicking a stack forward button inside a tab panel does nothing visible.

Fix version: **AppBuilder 1.10**.

## Root cause

Stack UI is a **two-part** pattern:

| Part | Component | Role |
|------|-----------|------|
| Button | `AppBuilderStackUiWidgetButtonComponent` | `stackContext.push(name)` |
| Shell | `AppBuilderStackUiWidgetComponent` | Slide animation + `findStackUiWidgetByPath(liveWidgets, stackPath)` |

`AppBuilderContainerComponent` renders tabs and a single container-level shell:

```
Provider (one stackPath)
├── AppBuilderTabsComponent → tab widgets (buttons only, no shell)
└── AppBuilderStackUiWidgetComponent(liveWidgets=container.widgets)
```

When a container uses tabs, `stackUi` widgets live in `tabs[n].widgets`, while the shell resolves `container.widgets` (often `[]`). `push()` updates `stackPath`, but `findStackUiWidgetByPath([], path)` returns `undefined` — no slide, no content.

Nested stacks work because `AppBuilderStackUiWidgetContentComponent` co-locates shell + `liveWidgets` with the button tree.

## Chosen approach: B1 — per-tab Provider

Each tab panel (and optional container-level widgets) gets its **own** `useStackContext()` + `AppBuilderStackContext.Provider` + `AppBuilderStackUiWidgetComponent` with `liveWidgets` matching that panel's widget list.

### Tab-switch behaviour

- Each tab remembers its own `stackPath` while its panel stays mounted.
- `TabsComponent` keeps visited panels in DOM via `activeTabsHistory` — returning to a tab restores open stack state.
- Unvisited tabs start with `stackPath = []`.

### Render tree (after fix)

```
AppBuilderContainerComponent
├── AppBuilderTabsComponent
│   ├── Tab A panel
│   │   └── AppBuilderWidgetsWithStackShell(liveWidgets=tabA.widgets)
│   └── Tab B panel
│       └── AppBuilderWidgetsWithStackShell(liveWidgets=tabB.widgets)
└── [optional] AppBuilderWidgetsWithStackShell(liveWidgets=container.widgets)
    when container.widgets is non-empty
```

No container-level `AppBuilderStackContext.Provider` — each scope is independent.

### Containers without tabs

Unchanged UX: one `AppBuilderWidgetsWithStackShell` wrapping `container.widgets`.

## New component

**`AppBuilderWidgetsWithStackShell`** (`widgets/appbuilder/ui/`)

Encapsulates the pattern already used in `AppBuilderContainerComponent` and nested stacks:

```typescript
function AppBuilderWidgetsWithStackShell({
  namespace,
  widgets,
  fallbackScrolls = false,
}: {
  namespace: string;
  widgets: IAppBuilderWidget[] | undefined;
  fallbackScrolls?: boolean;
}) {
  const { stackPath, context } = useStackContext(300);
  return (
    <AppBuilderStackContext.Provider value={context}>
      <AppBuilderStackUiWidgetComponent
        namespace={namespace}
        stackPath={stackPath}
        liveWidgets={widgets}
        fallbackScrolls={fallbackScrolls}
      >
        <AppBuilderWidgetsComponent namespace={namespace} widgets={widgets} />
      </AppBuilderStackUiWidgetComponent>
    </AppBuilderStackContext.Provider>
  );
}
```

## File changes

| File | Change |
|------|--------|
| `widgets/appbuilder/ui/AppBuilderWidgetsWithStackShell.tsx` | **Create** — shared stack scope |
| `widgets/appbuilder/ui/AppBuilderTabsComponent.tsx` | Wrap each tab's children in `AppBuilderWidgetsWithStackShell` |
| `widgets/appbuilder/ui/AppBuilderContainerComponent.tsx` | Remove container-level Provider/shell; delegate to `AppBuilderWidgetsWithStackShell` when no tabs or when `container.widgets` non-empty |

No changes to `useStackContext`, `findStackUiWidgetByPath`, or stack animation components.

## Edge cases

| Case | Expected behaviour |
|------|-------------------|
| Stack only in tabs | Each tab shell resolves its own widgets |
| Stack only in `container.widgets` (no tabs) | Single shell, same as today |
| Tabs + non-empty `container.widgets` | Per-tab shells + separate shell below tabs for direct widgets |
| Nested stack inside tab stack | Existing child `useStackContext` in `AppBuilderStackUiWidgetContentComponent` — unchanged |
| Dynamic widgets merged into active tab | Existing store behaviour; stack re-resolves via `liveWidgets` on render (SS-9698) |

## Testing

1. **Settings validation** — Jest fixture: `stackUi` inside `tabs[n].widgets` accepted by `validateAppBuilderSettingsJson`.
2. **Manual QA** — fixture `public/SS-9879.json` extended with layout reproducing stack-in-tabs (session creds from ticket); verify click opens stack, tab switch preserves per-tab state, back button works.
3. **Regression** — `public/SS-9463.json` container-level stack still works.

No new RTL component tests in v1 (project has no `@testing-library/react` setup).

## Success criteria

- Stack forward button inside a tab opens stack content with slide animation.
- Back button closes stack inside tab.
- Switching tabs does not show another tab's open stack.
- Returning to a previously visited tab restores that tab's open stack.
- Container-level stacks (no tabs) unchanged.
- `pnpm test` and `pnpm exec tsc --noEmit` pass.

## Out of scope

- Changing tab-switch to reset stack (option A).
- Centralized `stackPathsByTab` map (option B2).
- E2E Playwright against live repro model.
