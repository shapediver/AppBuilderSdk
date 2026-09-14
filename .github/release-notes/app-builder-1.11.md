# App Builder 1.11

This release adds agent tooling (work in progress) for App Builder, more flexible interaction parameters, and new ways to control containers, parameter resets, and saved-state screenshots.

New features:

- Connect an AI agent to App Builder (work in progress). Agents can list and change parameters, trigger actions, move the camera, capture screenshots, and read metrics through WebMCP and the Tools API. Open an agent window with the `agentUrl` query parameter or settings, and configure which tools are available (including from the App Builder theme). Note that agent tooling is still a work in progress (WIP) and subject to change.
- Keep selection, gumball, rectangle-transform, and drawing tools always active, optionally from the viewport toolbar.
- Add the `resetValue` parameter setting to automatically reset parameters to a configured value after each execution (useful e.g. for one-shot triggers or interaction parameters).
- Update additional related parameters from a single control using parameter delegates.
- Open, close, or toggle App Builder containers with a `setContainerVisibility` action.
- Show an optional reset button on parameter controls.
- Choose whether string text inputs debounce changes or validate before committing them to the session.
- Control camera, resolution, and quality of screenshots used for model states and saved-state previews.
- Toolbar buttons can display text labels and custom icons, including image URLs and inline Iconify icons.
- Authenticate App Builder sessions with a `jwtToken` URL query parameter.

Improvements:

- Strengthen the default pulse hover and selection effects for interaction tools.
- Improve App Builder configuration documentation for authors and LLM-assisted setup.
- Load Vite environment variables correctly in deployed apps.
- WebMCP no longer requires cross-origin isolation.

Bug fixes:

- Honor `redirect=0` when a saved state exists, avoid extra saved-state API calls, and keep `modelStateId` in the URL.
- Fix search in the filterable database component.
- Fix drawing-tools settings conversion and occlusion by scene geometry.
- Close the icons submenu after selecting an icon, and fix dialogs that did not close correctly.
- Restore vertical layout in the bottom container when using tabs.
- Fix attribute-visualization selection, duplicated selection parameters, and 2D/3D anchor rerenders.
- Fix races around dynamic parameters, interaction ownership, selection pruning, and model recomputation.
- Fix material pass-through and container width when opening or closing panels.
