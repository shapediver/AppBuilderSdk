---
paths:
  - "**/appBuilderActionSlots.ts"
  - "**/appbuilderActionSlots.ts"
  - "**/AppBuilderActionSlots.tsx"
  - "**/AppBuilderApplicationActionSlots.tsx"
  - "**/AppBuilderInteractionSlotListeners.tsx"
  - "**/actionSlots*"
---

# App Builder action slots

Node-level `actionSlots` call the same `runAppBuilderAction` catalog, including nested `executeActions`. The AR QR modal and the import-model-state dialog stay mounted on `AppBuilderPage`.

- UI wrapper: `features/appbuilder/ui/AppBuilderActionSlots.tsx` (pointer and `click` only; no viewer viewport import).
- Application listeners: `features/appbuilder/ui/AppBuilderApplicationActionSlots.tsx`.

## Host registration

Scene select/hover is host-registered, same as `ar`, `camera`, `fullscreen`, and `waitUntilReady`.

- Prop: `IComponentContext.interactionSlotListeners` (`AppBuilderInteractionSlotListenersProps` in `ComponentContext.types.ts`).
- ShapeDiver registers `{ component: AppBuilderInteractionSlotListeners }` from `src/AppBuilderRoot.tsx` (`useSelection` + `viewer.viewport`).
- iJewel omits the key (warns when JSON has `selecton`, `selectoff`, `hoveron`, or `hoveroff`), registers `{}` to suppress both, or supplies a native `component` that calls `handlersRef` via `actionSlotHandlerKey`.
- A host entry with no `component` does not fall through to ShapeDiver.
- Do not import `AppBuilderInteractionSlotListeners` from shared application-slot wiring.

## Allowlists

`APP_BUILDER_SLOT_EVENTS` in `features/appbuilder/lib/appBuilderActionSlots.ts`.

- Widget, tab, container, control, toolbar, and viewport alias `APP_BUILDER_UI_EVENTS`.
- `application` is `APP_BUILDER_APPLICATION_EVENTS`.
- Ignored names on the root are logged against `root` (union of application and UI events).
- Call sites pass `allowedEvents={APP_BUILDER_SLOT_EVENTS.<kind>}`.
- Zod does not restrict which events a node may use.

## Slot values

- A slot value is one object or an array of objects (same event, different `eventProps`, such as several root `selecton` name filters).
- An incompatible `eventProps.type` is warned and skipped. It is not treated as unfiltered.
- `selecton`, `selectoff`, `hoveron`, and `hoveroff` require a non-empty `eventProps.props.nameFilter`. Zod rejects a missing or empty filter, and the runner skips it. There is no `*` match-all.

## custom events

- The runner registers valid `custom:*` kebab-case names. Invalid names are warned and skipped.
- UI nodes, including tab panels, dispatch locally via `useDispatchAppBuilderCustomEvent`. A miss bubbles to the parent node, then to the application bus.
- Root `custom:*` uses `registerAppBuilderCustomActionSlot`, scoped by session `namespace`, and `dispatchAppBuilderCustomEvent`.
- Tabs cannot wrap `Tabs.Tab`, so their dispatcher wraps panel children. It does not use the global bus.
- Viewport wrap sets `includeCustomEvents={false}` so a root `custom:*` is not registered twice.

## DOM registration

- Pointer, `click`, and `contextmenu` use `uiSlotDomProps` on the wrap `Box` (widgets, containers, controls, toolbar items, viewport host). `contextmenu` calls `preventDefault`.
- Tab controls cannot wrap `Tabs.Tab` (`Tabs.List` requires it as a direct child), so they put `uiSlotDomProps` on `controlProps`. That type is `ButtonHTMLAttributes`, so a new UI event does not need a tab-type edit.

## Application events

Registered on `AppBuilderPage` via `AppBuilderApplicationActionSlots`.

- `appready` waits with no timeout: `waitForAppBuilderViewport` → `viewportAccessFunctions.waitUntilReady`.
- A customization that opens a process manager (`beginComputationSpan`) runs `computationstart` when that span opens, before `TASK_START`, and `computationend` when the last manager of that span is gone, after `TASK_END` and after instances from that computation are registered. Further managers of the same session that appear while the span is open, such as the instance rebuild, belong to it. A customization with no span, including default exports, keeps `TASK_START` / `TASK_END`.
- `computationerror` is `TASK_CANCEL` with status `"Session customization failed"` (local session id on the task payload). A superseded customize cancels with a different status.
- Export slots are `TASK_START` / `TASK_END` / `TASK_CANCEL` for `EXPORT_REQUEST` (`data.sessionId`, `exportId`, `name`, `displayname`). Same path as widgets and export parameter value sources.

## Parameter control computation slots

A control of `type: "parameter"` may use `computationstart`, `computationend`, and `computationerror` (`APP_BUILDER_SLOT_EVENTS.parameterControl`, schema `IAppBuilderParameterControlActionSlots`). They sit on the control, not in `props.overrides`, and take no `eventProps` (the control's name and session identify the parameter). Export, output, action controls, and toolbar items do not gain them.

- One listener for root and parameter controls: `useComputationSlotListeners` in `AppBuilderApplicationActionSlots.tsx`. The root passes no filter. `AppBuilderParameterComputationSlots` (same file) passes `createParameterComputationTaskFilter` (`appBuilderActionSlots.ts`). The executor is unchanged.
- The viewer task only carries the session id. The executor sets `session.parameters[id].value` before `customize` / `requestExports`, and the viewer emits `TASK_START` synchronously. The filter includes the parameter iff `value !== lastComputedValue` (initialised at mount). On `TASK_END` it becomes the task's start value, unless a newer task already ended. Not the live value: on the export path the executor sets the next value and awaits file uploads before `TASK_START`. Exception: a `File` start value is read live at the end (`customize` replaces it by its upload id). Do not compare with `sessionValue`: `requestExports` never updates it.
- A failed `TASK_CANCEL` runs `computationerror`; a superseded one is forgotten silently (the newer start still sees the changed value). `customize_parallel` tasks (instances) are ignored. With a filter, all three task events are listened to whenever the control has any computation slot.
- `AppBuilderControlsWidgetComponent` renders `AppBuilderParameterComputationSlots` per parameter control (also for hidden parameters). It warns about unsupported slots; the DOM wrapper gets `warnUnsupported={false}` and `allowedEvents` `control`, so it neither runs nor warns about the computation events.
- Accept/reject needs no code: the executor runs only when the accepted change is computed.
- Custom (App Builder) parameters are not computed by a session, so their slots never run.

## Viewer interaction

Slot names are `selecton`, `selectoff`, `hoveron`, and `hoveroff`. Viewer `interaction.multiSelect.*` maps onto the select slots.

The ShapeDiver listener enables hover and select the way an anchor `selectionProperties` does: `useSelection`, a passive interaction request, hover default true, min 0, max 1, `deselectOnEmpty`. Groups use the full effective selection config. Conflicting colors, max, or hover on the same name filter and viewport warn and run as separate groups.

After computation it restores selection silently and fires `selecton` / `selectoff` only when the selected name set changed. `processActive` is scoped to this session `namespace`. The listener runs the matching slot when that viewer event fires on this group's manager. Pair with `setContainerVisibility` to replace `selectionProperties`.

## waitUntilReady

- ShapeDiver registers it from `useViewport` (`waitForViewportScene`): bounding box settled and containing geometry, or an empty box when there is none. Viewer `calculateZoomTo` no-ops on an empty box.
- iJewel and WebGi register their own `waitUntilReady` for host visibility.
- A host with no viewport skips the wait.
