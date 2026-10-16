# SS-10258 alternate: toolbar button owns nested anchor docking

Mockup only. This is not the staged implementation.

The staged version adds `AppBuilderToolbarAnchorActionHost` and mounts it around a toolbar action when `toolbarActionNeedsAnchorHost` is true. This alternate deletes that component. The same behavior lives in `AppBuilderToolbarActionButton`, behind the same gate. A toolbar menu action uses one shared hook so the two call sites do not copy the effect.

`executeActions` stays a generic runner. A direct `setContainerVisibility` button is unchanged and still docks and closes siblings itself.

## What stays

- `collectSetContainerVisibilityTargets`, `collectOpeningAnchorIds`, `collectAnchor2dTriggerIds`, `targetsAnchorContainer`
- `closeSiblingToolbarContainers` accepting one id or several
- `ToolbarContainerExclusivityContext` from `AppBuilderToolbar`
- `AppBuilderActionSetContainerVisibilityComponent` for a direct toolbar action

## What goes away

- `AppBuilderToolbarAnchorActionHost.tsx`
- `toolbarActionNeedsAnchorHost` as a reason to mount a wrapper component
- The `display: contents` span

## Shape

```tsx
// features/appbuilder/ui/useToolbarNestedAnchorButton.ts

export function toolbarActionNeedsNestedAnchor(
	definition: IAppBuilderActionDefinition,
): boolean {
	return (
		definition.type === AppBuilderActionType.ExecuteActions &&
		targetsAnchorContainer(definition.props.actions)
	);
}

/**
 * Dock and exclusive-close for setContainerVisibility nested in executeActions.
 * No-op unless `enabled` is true, so a normal toolbar button pays only the hook calls.
 */
export function useToolbarNestedAnchorButton(
	definition: IAppBuilderActionDefinition,
	enabled: boolean,
	viewportId: string | undefined,
): {
	buttonRef?: (node: HTMLButtonElement | null) => void;
	onClickCapture?: () => void;
} {
	const actions =
		enabled && definition.type === AppBuilderActionType.ExecuteActions
			? definition.props.actions
			: undefined;
	const anchor2dIds = useMemo(
		() => (actions ? collectAnchor2dTriggerIds(actions) : []),
		[actions],
	);
	const {viewportId: defaultViewportId} = useViewportId();
	const resolvedViewportId = viewportId ?? defaultViewportId;
	const {exclusiveContainers, siblingAnchorIds} = useContext(
		ToolbarContainerExclusivityContext,
	);
	const setTrigger = useViewportAnchorTriggerRegistry((state) => state.setTrigger);

	const buttonRef = useCallback(
		(node: HTMLButtonElement | null) => {
			for (const id of anchor2dIds) setTrigger(id, node);
		},
		[anchor2dIds, setTrigger],
	);

	useLayoutEffect(() => {
		return () => {
			for (const id of anchor2dIds) setTrigger(id, null);
		};
	}, [anchor2dIds, setTrigger]);

	if (!actions) return {};

	const onClickCapture = () => {
		if (!exclusiveContainers) return;
		const anchors =
			useShapeDiverStoreViewportAnchors.getState().anchors[
				resolvedViewportId
			] ?? [];
		const openingIds = collectOpeningAnchorIds(actions, (id, name) =>
			anchors.some(
				(anchor) =>
					anchor.id === id &&
					anchor.type === name &&
					anchor.showContent,
			),
		);
		if (openingIds.length === 0) return;
		closeSiblingToolbarContainers(
			resolvedViewportId,
			openingIds,
			siblingAnchorIds,
		);
	};

	return {buttonRef, onClickCapture};
}
```

The toolbar icon button does not wrap the action. It passes the ref and the capture handler into the action render props, and only when the definition needs them.

```tsx
// AppBuilderToolbarActionButton

const needsNestedAnchor = toolbarActionNeedsNestedAnchor(item.props.definition);
const {buttonRef, onClickCapture} = useToolbarNestedAnchorButton(
	item.props.definition,
	needsNestedAnchor,
	buttonRenderContext.viewportId,
);

return AppBuilderActionFromType(
	item.props,
	buttonRenderContext.namespace,
	item.id,
	componentContext,
	{
		presentation: "toolbarIcon",
		toolbarButtonProps: buttonThemeProps,
		labelSide: item.props.labelSide,
		labelAlign: item.props.labelAlign,
		viewportId: buttonRenderContext.viewportId,
		fullscreenId: buttonRenderContext.fullscreenId,
		disabled,
		buttonRef,
		onClickCapture,
	},
);
```

`AppBuilderActionBase` already accepts `buttonRef`. `onClickCapture` is the new prop. Both are optional. A direct `setContainerVisibility` ignores them and keeps its own ref and click handler. `executeActions` forwards them onto its single button and does not interpret them:

```tsx
// AppBuilderActionExecuteActionsComponent — forward only

<AppBuilderActionBase
	presentation={presentation}
	label={label}
	icon={icon}
	tooltip={tooltip}
	onClick={onClick}
	onClickCapture={onClickCapture}
	buttonRef={buttonRef}
	loading={loading}
	disabled={resolvedDisabled || loading}
	toolbarButtonProps={toolbarButtonProps}
/>
```

`AppBuilderActionBase` puts `onClickCapture` on the same `<button>` as `onClick`. Capture on the button runs before that button's bubble `onClick`, so siblings close before `runAppBuilderActions` opens the panel. No ancestor span.

The menu row in `AppBuilderToolbarPopoverContent` calls the same hook and passes the same two options into `AppBuilderActionFromType`. It does not grow a second wrapper.

## Why this is not "setContainerVisibility looks at its parent"

A nested `setContainerVisibility` is not a React child of `executeActions`. The runner calls `runAppBuilderActionSetContainerVisibility`. The visibility component never mounts, so it cannot see a parent, a button, or `ToolbarContainerExclusivityContext`.

Giving the headless run an origin element and a sibling list would push toolbar data through `runAppBuilderActions` for every caller (slots, API, agent tools) and would still need the toolbar button to register and unregister that element. The hook above keeps that registration on the button that rendered the action.

## Cost

- Every `AppBuilderToolbarActionButton` calls the hook. When `enabled` is false the hook subscribes to the trigger registry and the exclusivity context and then returns `{}`. That is the Rules-of-Hooks price of not mounting a child. It is still less tree than a host component on every button.
- `executeActions` grows two optional render props. It does not import anchors, toolbars, or the trigger registry.
- `AppBuilderActionFromType` must pass `buttonRef` and `onClickCapture` through. Today it does not.

## Open choice

If forwarding `onClickCapture` through every action component is too wide, only `executeActions` reads it. `AppBuilderActionFromType` passes it only when `definition.type === "executeActions"`. Direct actions never see the prop.
