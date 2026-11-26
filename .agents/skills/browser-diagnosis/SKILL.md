---
name: browser-diagnosis
description: Reproduce and diagnose App Builder behavior in a browser — dev server and slugs, throwaway Playwright drivers, window.SDV, counting PUT computations, finding who committed a value. Use when debugging UI, selection or interaction.
---

# Browser diagnosis (App Builder)

## Dev server and models

- `BROWSER=none pnpm exec vite --host 127.0.0.1 --port 8080 --strictPort` → `http://127.0.0.1:8080/?slug=<slug>`. Port 3000 is the e2e cross-window fixture server. Slug data is in `modelstorage.local.ts`.
- The platform token expires **hourly**; run `pnpm run convert-slug-data` when a session fails to load.
- Testing-account models do **not** whitelist localhost — use the deployed URL.
- Settings/theme: `?g=<file>` from `public/`.

## Throwaway Playwright

Write drivers as `.mjs` under `test-results/scratch` (wiped by e2e; keep copies in the scratchpad). Run **from the project directory** so `@playwright/test` resolves. Viewport **1280x720**. Use Write/Edit for driver files (Python `"\n"` escapes have produced literal newlines inside string literals).

## In-page (`window.SDV`)

- `Object.values(SDV.sessions)[0]` — `parameters`, `outputs`, `customize`
- `SDV.viewports` — `busy` for idle detection
- `SDV.EVENTTYPE_INTERACTION` + `SDV.addListener` — `SELECT_ON/OFF`, `HOVER_ON`, `MULTI_SELECT_*`
- Node `InteractionData`: `restrictedManagers`, `interactionTypes` (capability), `interactionStates` (current)

Count computations with `page.on("request")` filtered to `PUT` and `/output`; diff the body's parameter values against the previous request.

Pulse highlight effects make **pixel counting unreliable**; use events, parameter values, or a solid-color settings file for snapshots.

## Who committed? (async stacks)

Debounce in `handleChange` breaks stacks. Temporary `console.log("[diag] ...", new Error().stack)` in `useParameterComponentCommons.handleChange`, the custom parameter executor, and `batchParameterValueUpdate`; capture `page.on("console")`; then `git checkout HEAD --` the instrumented files.

Stop every dev server and browser you started before finishing.
