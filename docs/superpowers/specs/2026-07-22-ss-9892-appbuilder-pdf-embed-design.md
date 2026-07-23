# SS-9892: AppBuilder PDF embed

## Motivation

[Jira SS-9892](https://shapediver.atlassian.net/browse/SS-9892) — **Extend AppBuilderImage component to support PDFs**.

Forum request: PDF→bitmap on ShapeDiver ([Discourse](https://discourse.mcneel.com/t/pdf-to-bitmap-on-shapediver-request-for-pymupdf-or-alternative/221004/4)). Product decision: render PDFs in the App Builder **image** widget instead of server-side rasterization.

Fix version: **AppBuilder 1.10**.

Reference: Nutrient blog [method 4](https://www.nutrient.io/blog/open-pdf-in-your-web-app/) — combine `<object>` + nested `<iframe>` + download fallback for native PDF viewing without JavaScript libraries.

## Decisions

| Topic | Choice |
|-------|--------|
| Detection | **Auto** — like SVG: `contentType`, `data:application/pdf…`, `.pdf` URL |
| Sizing | Same container orientation / `fit` / `mah` / `maw` rules as images |
| Anchor | **Ignore** `anchor`/`target` for PDF (viewer needs clicks) |
| Structure | **Split** `AppBuilderPdfEmbed` — do not add PDF branch inside `AppBuilderImage` |
| Theme | Own `useProps("AppBuilderPdfEmbed")` + theme registration + Zod schema |
| Viewer | Native HTML only — no PDF.js / Google Docs viewer |

## Architecture

```
image widget (type: "image")
  ├─ href
  │    ├─ isPdfSrc(href) → AppBuilderPdfEmbed
  │    └─ else → AppBuilderImage (+ optional Anchor)
  └─ export
       └─ object URL + contentType
            ├─ application/pdf → AppBuilderPdfEmbed
            └─ else → AppBuilderImage
```

`AppBuilderImage` stays image/SVG only.

## Components

### `isPdfSrc(href?, contentType?)`

Shared helper under `widgets/appbuilder/lib/`.

Order:

1. `contentType === "application/pdf"`
2. else `href` starts with `data:application/pdf`
3. else URL pathname / string ends with `.pdf` (strip query/hash before check)

### `AppBuilderPdfEmbed`

Presentational embed:

```html
<object data={src} type="application/pdf" …>
  <iframe src={src} …>
    <p>… <a href={src}>Download the PDF</a></p>
  </iframe>
</object>
```

- **Style props** (via `useProps`): `radius`, `mah`, `maw`, `fit` (`contain` | `scale-down`), `withBorder` — same semantics as `AppBuilderImage` for fill vs max constraints via `AppBuilderContainerContext`.
- **Functional props:** `src`, optional `alt` (map to `title` / `aria-label` where useful).
- **No** `anchor` / `target`.
- CSS module for border + border-radius on the embed surface.
- Register in `useCustomTheme.ts` and `themeComponentDefaultPropsRegistry.ts`.
- `@docAttached` + `pnpm run docs`.

### Call sites

- `AppBuilderImageWidgetComponent` — route PDF `href` to PdfEmbed; keep SVG auto-detect for images.
- `AppBuilderImageExportWidgetComponent` — route `application/pdf` to PdfEmbed (object URL already created).

## Out of scope

- New JSON widget type (remain `type: "image"`)
- Explicit `isPdf` schema prop
- PDF.js / commercial viewers
- Changing `AppBuilderImage` internals for PDF

## Acceptance

- PDF via `href` and via export MIME render with object+iframe+download fallback
- Non-PDF images and SVGs unchanged
- PDF ignores `anchor`/`target`
- Theme: `themeOverrides.components.AppBuilderPdfEmbed.defaultProps`
- Unit tests for `isPdfSrc`
- Manual smoke: several PDFs × major browsers (Chrome, Firefox, Safari, Edge)

## Testing

| Layer | What |
|-------|------|
| Unit | `isPdfSrc` cases (MIME, data URL, `.pdf`, query string, false negatives) |
| Manual | Real PDFs in App Builder layout containers (horizontal/vertical) |
| Docs | `pnpm run docs` after theme props |
