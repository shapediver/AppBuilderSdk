# App Builder 1.10

This release adds more flexible interface-building options, improves model-state handling, and updates App Builder's component foundation.

New features:

- Add configurable toolbar containers, including built-in controls for viewport actions, exports, model states, and custom actions.
- Add a filterable database option for string parameters. Data can be sourced from CSV, JSON, or exports and filtered, searched, and loaded progressively.
- Image widgets can now display PDF files.
- Customize the success message shown after an **Add to cart** action.
- Protect unsaved parameter changes when loading or creating model states. This behaviour can be configured through the App Builder theme or `VITE_STATE_PROTECTION` environment variable.

Improvements:

- Upgrade the UI foundation to Mantine v9, with compatibility support for existing v8 themes.
- Add GitHub Actions workflows for automated App Builder deployments.

Bug fixes:

- Fix empty Button Flex string-list parameters so their layout can be configured correctly.
- Resolve Content Security Policy failures caused by scripts loaded from `eval:`.
- Fix distance labels in drawing tools.
- Fix stacks nested in tabs so they open correctly.
- Fix screenshots captured while creating a model state.
- Fix authentication failures in the Saved States widget.
- Ensure Stargate `GET_DATA` requests use the correct session/parameter namespace for the current model.
