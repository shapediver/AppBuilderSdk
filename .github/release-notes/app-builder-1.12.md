# App Builder 1.12

This release introduces action slots for event-driven automation, embeds the AI agent directly in the App Builder layout, lets Grasshopper define additional sessions and author-specific agent tools, and refines toolbars, e-commerce integration, and mobile layouts.

New features:

- Add action slots: widgets, tabs, containers, controls, toolbar items, and the root node can define `actionSlots` that run App Builder actions in response to events. Supported events include UI events (click, context menu, pointer enter/leave/down/up), application events (app ready, computation and export start/end/error), scene events (selection and hover on/off, filtered by `nameFilter`), and custom events dispatched from host code. Action slots are validated by the configuration schema and documented in the shared library.
- Add the `executeActions` action to run a sequence of actions, including nested sequences, from a toolbar button or an action slot. Actions that open dialogs (file import, model state import) wait for the user before the sequence continues.
- Embed the agent UI in the App Builder layout with the new `hostedAgent` widget, backed by a generic `iframe` widget. The agent UI can be configured through the `agentUi` theme defaults (`mode`, `showThreadHistory`, `createThreadOnLoad`), the App Builder theme can be passed through to the agent, and the connection is kept open instead of reloading. Agent tooling is still a work in progress (WIP) and subject to change.
- Define author-specific agent tools with `specificTools`: each tool exposes its own input schema to the agent and maps the input values to hidden App Builder actions, so agents can call e.g. "set shelf width" instead of generic parameter tools.
- Add the `get_camera`, `import_model_state`, and `create_model_state` agent tools, and a `getTheme` call to the Tools API. The screenshot tool now accepts `contentType`, `quality`, and `resolution` and can return an `image_url`. The `set_camera_position` tool was renamed to `set_camera`.
- Create additional full sessions from the App Builder data output using the new `sessions` property. Their parameters and exports are registered in the interface, and parameter value sources are resolved in the session of the target parameter.
- Add a Net Promoter Score (NPS) survey component. Message, score options, captions, opening delay, and the re-survey schedule after an answer or dismissal are configured through the `NetPromoterScore` theme defaults, and scores are tracked as metrics.
- Toolbar containers can be opened exclusively (`exclusiveContainers`), opened by default (`defaultOpen`), and are now positioned automatically so toolbars on adjacent sides no longer overlap at the corners.
- Show accept/reject buttons inline next to a parameter instead of globally with the `acceptRejectModePresentation` parameter setting.
- Control how `setParameterValues` handles invalid values with the `updateMode` property: `partial` (default) writes the valid values, `complete` leaves every value unchanged.
- Add the `mobileFallback` property to standard containers and viewport anchors, with unified mobile behaviour across all container types.
- Extend the e-commerce integration: the e-commerce API gains `triggerAction` and `getOutput`, `addToCart` and `createModelState` accept custom line-item `properties`, add-to-cart replies return the `modelStateId` and `cartItemId`, and cart plugins can provide a custom `successMessage` (with `{modelStateId}` substitution) or throw an `Error` to show their own error message.
- Agents can be configured with an optional `profileName`, agent definitions can be overridden through the theme, and the `agentUrl` query parameter has a sensible default behaviour.
- Add the `columnLabel` option to the filterable database component.
- The interaction toolbar (selection, dragging, drawing, rectangle transform) can now be themed.

Improvements:

- Improve toolbar performance and stop toolbar buttons from jumping on the viewport. Toolbar popovers and viewport anchors share the same panel spacing defaults.
- Toolbar buttons can optionally be clicked while a computation is running.
- Image widgets hide their label and description when empty strings are passed and use the full width in that case.
- Adjust the camera after secondary sessions have been loaded when `initialAutoAdjust` is set, so geometry provided by secondary sessions only is in view.
- Warn about parameter value sources of unknown type and about re-used session ids instead of failing silently.
- Replace `react-router-dom` with native navigation.
- Update WebMCP types for Chrome 155, where the tool input is an optional object.
- Separate the `parameterValues` schema and refine the toolbar label and icon schema definitions.
- Update the ShapeDiver viewer to version 3.22.0.
- Add Playwright test suites for the Tools API, the e-commerce API, and mobile layouts.

Bug fixes:

- Fix an infinite effect loop and repeated downloads when resolving sdTF parameter value sources.
- Fix sessions being recreated when other sessions were added or removed, keep additional sessions open when the list changes, and fix leftover instances.
- Fix instances taking the spot of the current model.
- Fix text input debounce issues.
- Fix accept/reject mode when used together with toolbars.
- Fix the selection confirmation controls on mobile devices.
- Fix toolbar container visibility when using `executeActions` and `setContainerVisibility` with exclusive containers, and stop later actions from aborting the current sequence.
- Allow containers to be clicked while camera actions are running.
- Respect the `hidden` flag of `itemData` for string parameters rendered as select inputs.
- Fix the resize limits of the floating agent window inside the viewport.
- Fix the usage of agent tool descriptions and the viewport dependency of agent tools.
- Fix inconsistent toolbar labels and toolbar icon theming.
