---
paths:
  - "**/shared/ui/icon/**"
  - "**/isIconImageUrl.ts"
---

# Icons

`IAppBuilderIcon` and `iconType` accept:

- an Iconify name
- an image URL (`http`, `https`, data URI, or path; SVG and common rasters)
- an inline Iconify object

Detection and `<img>` rendering live in `shared/ui/icon/isIconImageUrl.ts` and `Icon.tsx`.

A toolbar button must render a URL as an icon. It must not fall back to text.
