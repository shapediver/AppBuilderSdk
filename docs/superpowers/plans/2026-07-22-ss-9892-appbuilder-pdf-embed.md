# SS-9892 AppBuilder PDF Embed Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let App Builder `image` widgets display PDFs via a dedicated native `<object>`+`<iframe>` embed, with auto-detection and separate theme props.

**Architecture:** Add `isPdfSrc` helper + `AppBuilderPdfEmbed` (own `useProps`). Route PDF from `AppBuilderImageWidgetComponent` and `AppBuilderImageExportWidgetComponent`. Keep `AppBuilderImage` image/SVG-only.

**Tech Stack:** React 19, TypeScript, Mantine v8 `useProps`, Zod theme schemas, Jest, CSS modules.

**Spec:** `docs/superpowers/specs/2026-07-22-ss-9892-appbuilder-pdf-embed-design.md`

**Branch:** `task/SS-9892` (parent). Submodule: create/checkout `task/SS-9892-pdf-embed` from current `src/shared` HEAD before code commits.

## Global Constraints

- Submodule code lives in `src/shared/` — commit there with `SS-9892: …` messages.
- Parent repo: docs/plans only with `SS-9892: …` unless bumping submodule pointer.
- Follow FSD alias `@AppBuilderLib/`; no bare `src/shared/…` imports.
- No PDF.js / Google Docs viewer — native HTML method 4 only.
- Auto-detect PDF only — no new `isPdf` JSON schema field.
- PDF path ignores `anchor`/`target`.
- Do not put PDF rendering inside `AppBuilderImage.tsx`.
- `AppBuilderPdfEmbed` owns `useProps("AppBuilderPdfEmbed")` + theme + Zod registry.
- Fix linter issues only on changed files.
- After theme/`@docAttached` changes: run `pnpm run docs` and commit updated `public/doc-flat.json` in the repo that owns it (parent if generated there).

---

## File map

| File | Action |
|------|--------|
| `src/shared/widgets/appbuilder/lib/isPdfSrc.ts` | Create |
| `src/shared/widgets/appbuilder/lib/__tests__/isPdfSrc.test.ts` | Create |
| `src/shared/widgets/appbuilder/ui/AppBuilderPdfEmbed.tsx` | Create |
| `src/shared/widgets/appbuilder/ui/AppBuilderPdfEmbed.module.css` | Create |
| `src/shared/widgets/appbuilder/config/AppBuilderPdfEmbed.theme.types.ts` | Create |
| `src/shared/shared/ui/theme/useCustomTheme.ts` | Modify — register PdfEmbed |
| `src/shared/features/appbuilder/config/themeComponentDefaultPropsRegistry.ts` | Modify — register schema |
| `src/shared/widgets/appbuilder/ui/AppBuilderImageWidgetComponent.tsx` | Modify — route PDF href |
| `src/shared/widgets/appbuilder/ui/AppBuilderImageExportWidgetComponent.tsx` | Modify — route PDF MIME |
| `public/doc-flat.json` (and related docs artifacts) | Regenerate via `pnpm run docs` |

---

### Task 1: `isPdfSrc` helper (TDD)

**Files:**
- Create: `src/shared/widgets/appbuilder/lib/isPdfSrc.ts`
- Test: `src/shared/widgets/appbuilder/lib/__tests__/isPdfSrc.test.ts`

**Interfaces:**
- Produces: `export function isPdfSrc(href?: string, contentType?: string): boolean`

- [ ] **Step 1: Write the failing test**

```ts
import {isPdfSrc} from "../isPdfSrc";

describe("isPdfSrc", () => {
	it("returns true for application/pdf contentType", () => {
		expect(isPdfSrc(undefined, "application/pdf")).toBe(true);
		expect(isPdfSrc("https://x/a.png", "application/pdf")).toBe(true);
	});

	it("returns true for data:application/pdf URLs", () => {
		expect(isPdfSrc("data:application/pdf;base64,AAA")).toBe(true);
	});

	it("returns true for .pdf paths, including query/hash", () => {
		expect(isPdfSrc("https://cdn.example.com/file.pdf")).toBe(true);
		expect(isPdfSrc("https://cdn.example.com/file.pdf?token=1")).toBe(true);
		expect(isPdfSrc("https://cdn.example.com/file.pdf#page=2")).toBe(true);
		expect(isPdfSrc("/relative/doc.PDF")).toBe(true);
	});

	it("returns false for images and unrelated types", () => {
		expect(isPdfSrc("https://cdn.example.com/file.png")).toBe(false);
		expect(isPdfSrc("data:image/png;base64,AAA")).toBe(false);
		expect(isPdfSrc(undefined, "image/png")).toBe(false);
		expect(isPdfSrc(undefined, undefined)).toBe(false);
		expect(isPdfSrc("https://cdn.example.com/file.pdf.png")).toBe(false);
	});
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test -- src/shared/widgets/appbuilder/lib/__tests__/isPdfSrc.test.ts`

Expected: FAIL (module / `isPdfSrc` not found)

- [ ] **Step 3: Write minimal implementation**

```ts
/**
 * Detect whether a source should be rendered as a PDF embed.
 * Prefers MIME type, then data URLs, then .pdf path (query/hash stripped).
 */
export function isPdfSrc(href?: string, contentType?: string): boolean {
	if (contentType === "application/pdf") {
		return true;
	}
	if (!href) {
		return false;
	}
	if (href.startsWith("data:application/pdf")) {
		return true;
	}
	const path = href.split(/[?#]/, 1)[0] ?? href;
	return path.toLowerCase().endsWith(".pdf");
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test -- src/shared/widgets/appbuilder/lib/__tests__/isPdfSrc.test.ts`

Expected: PASS

- [ ] **Step 5: Ensure submodule branch + commit**

```bash
cd src/shared
git checkout -B task/SS-9892-pdf-embed
git add widgets/appbuilder/lib/isPdfSrc.ts widgets/appbuilder/lib/__tests__/isPdfSrc.test.ts
git commit -m "$(cat <<'EOF'
SS-9892: add isPdfSrc helper for image widget PDF detection

EOF
)"
```

---

### Task 2: `AppBuilderPdfEmbed` + theme registration

**Files:**
- Create: `src/shared/widgets/appbuilder/ui/AppBuilderPdfEmbed.tsx`
- Create: `src/shared/widgets/appbuilder/ui/AppBuilderPdfEmbed.module.css`
- Create: `src/shared/widgets/appbuilder/config/AppBuilderPdfEmbed.theme.types.ts`
- Modify: `src/shared/shared/ui/theme/useCustomTheme.ts` — import + `components.AppBuilderPdfEmbed`
- Modify: `src/shared/features/appbuilder/config/themeComponentDefaultPropsRegistry.ts` — import + registry key

**Interfaces:**
- Consumes: `AppBuilderContainerContext` (same as `AppBuilderImage`)
- Produces: default export `AppBuilderPdfEmbed`, `AppBuilderPdfEmbedThemeProps`, style type `AppBuilderPdfEmbedStyleProps`

- [ ] **Step 1: Theme Zod schema**

Create `src/shared/widgets/appbuilder/config/AppBuilderPdfEmbed.theme.types.ts` (mirror image schema):

```ts
import {z} from "@AppBuilderLib/shared/lib/zod";
import {mantineCssLengthSchema} from "@AppBuilderLib/shared/mantine-props/primitives.zod";
import {mantineSpacingSchema} from "@AppBuilderLib/shared/mantine-props/spacing.zod";

/** Theme `defaultProps` for `useProps("AppBuilderPdfEmbed", …)`. */
export const AppBuilderPdfEmbedThemeDefaultPropsSchema = z.strictObject({
	radius: mantineSpacingSchema.optional(),
	mah: mantineCssLengthSchema.optional(),
	maw: mantineCssLengthSchema.optional(),
	fit: z.enum(["contain", "scale-down"]).optional(),
	withBorder: z.boolean().optional(),
});

export type AppBuilderPdfEmbedThemeDefaultProps = z.infer<
	typeof AppBuilderPdfEmbedThemeDefaultPropsSchema
>;
```

- [ ] **Step 2: CSS module**

Create `src/shared/widgets/appbuilder/ui/AppBuilderPdfEmbed.module.css`:

```css
.root {
	display: block;
	border: 0;
}

.withBorder {
	border: calc(0.0625rem * var(--mantine-scale)) solid
		var(--mantine-color-default-border);
}

.embed {
	display: block;
	width: 100%;
	height: 100%;
	border: 0;
}
```

- [ ] **Step 3: Component**

Create `src/shared/widgets/appbuilder/ui/AppBuilderPdfEmbed.tsx` modeled on `AppBuilderImage` sizing logic:

```tsx
import {AppBuilderContainerContext} from "@AppBuilderLib/features/appbuilder/lib/AppBuilderContext";
import {
	MantineThemeComponent,
	useProps,
} from "@mantine/core";
import {useContext} from "react";
import classes from "./AppBuilderPdfEmbed.module.css";

/**
 * @docAttached
 * @category widget
 * @configPath themeOverrides.components.AppBuilderPdfEmbed.defaultProps
 * @displayName AppBuilderPdfEmbed
 */
export type AppBuilderPdfEmbedStyleProps = {
	/**
	 * Object-fit-like sizing for the embed box.
	 * @default "contain"
	 */
	fit?: "contain" | "scale-down";
	/**
	 * When true, applies bordered embed styling.
	 * @default false
	 */
	withBorder?: boolean;
	radius?: string | number;
	mah?: string | number;
	maw?: string | number;
};

type PdfEmbedNonStyleProps = {
	src: string;
	alt?: string;
};

const defaultStyleProps: Partial<AppBuilderPdfEmbedStyleProps> = {
	radius: "md",
	fit: "contain",
	withBorder: false,
};

type AppBuilderPdfEmbedThemePropsType = Partial<AppBuilderPdfEmbedStyleProps>;

export function AppBuilderPdfEmbedThemeProps(
	props: AppBuilderPdfEmbedThemePropsType,
): MantineThemeComponent {
	return {
		defaultProps: props,
	};
}

export default function AppBuilderPdfEmbed(
	props: PdfEmbedNonStyleProps & AppBuilderPdfEmbedStyleProps,
) {
	const {src, alt, ...rest} = props;
	const {radius, fit, withBorder, mah, maw} = useProps(
		"AppBuilderPdfEmbed",
		defaultStyleProps,
		rest,
	);

	const context = useContext(AppBuilderContainerContext);
	const orientation = context.orientation;
	const contain = fit === "contain";
	const sizeStyle: React.CSSProperties = {
		borderRadius:
			typeof radius === "number" ? radius : undefined,
		height: contain && orientation === "horizontal" ? "100%" : undefined,
		width: contain && orientation === "vertical" ? "100%" : undefined,
		maxHeight:
			!contain && orientation === "horizontal"
				? (mah ?? "100%")
				: undefined,
		maxWidth:
			!contain && orientation === "vertical"
				? (maw ?? "100%")
				: undefined,
	};

	// Prefer Mantine radius tokens via CSS variable when string
	if (typeof radius === "string") {
		sizeStyle.borderRadius = `var(--mantine-radius-${radius})`;
	}

	const className = [
		classes.root,
		withBorder ? classes.withBorder : undefined,
	]
		.filter(Boolean)
		.join(" ");

	const title = alt;

	return (
		<div className={className} style={sizeStyle}>
			<object
				className={classes.embed}
				data={src}
				type="application/pdf"
				title={title}
				aria-label={title}
				style={{height: "100%", width: "100%"}}
			>
				<iframe
					className={classes.embed}
					src={src}
					title={title}
					style={{border: "none", height: "100%", width: "100%"}}
				>
					<p>
						Your browser does not support PDF viewing.{" "}
						<a href={src}>Download the PDF</a>.
					</p>
				</iframe>
			</object>
		</div>
	);
}
```

Notes for implementer:

- Match project Prettier/ESLint; prefer existing radius handling patterns if `AppBuilderImage` / Mantine already map radius differently — stay consistent with nearby CSS modules.
- Import `CSSProperties` from `react` instead of `React.CSSProperties` if the file does not use a React namespace import.
- Ensure `useProps` id is exactly `"AppBuilderPdfEmbed"`.

- [ ] **Step 4: Register theme**

In `useCustomTheme.ts`:

1. Add import next to `AppBuilderImageThemeProps`:

```ts
import {AppBuilderPdfEmbedThemeProps} from "@AppBuilderLib/widgets/appbuilder/ui/AppBuilderPdfEmbed";
```

2. Add next to `AppBuilderImage` in root `components` (same block ~line 650):

```ts
/**
 * AppBuilderPdfEmbed
 *
 * Native PDF embed for AppBuilder image widgets (object + iframe fallback).
 */
AppBuilderPdfEmbed: AppBuilderPdfEmbedThemeProps({
	// radius: "md",
	// fit: "contain",
	// withBorder: false,
}),
```

Optional: mirror `AppBuilderImage` overrides inside template container theme blocks only if those blocks already customize images and PDF should match — default is register once at root.

In `themeComponentDefaultPropsRegistry.ts`:

```ts
import {AppBuilderPdfEmbedThemeDefaultPropsSchema} from "@AppBuilderLib/widgets/appbuilder/config/AppBuilderPdfEmbed.theme.types";
```

Add alphabetically near `AppBuilderImage`:

```ts
AppBuilderPdfEmbed: AppBuilderPdfEmbedThemeDefaultPropsSchema,
```

- [ ] **Step 5: Typecheck**

Run: `pnpm exec tsc --noEmit`

Expected: PASS (or only pre-existing errors unrelated to these files)

- [ ] **Step 6: Commit (submodule)**

```bash
cd src/shared
git add widgets/appbuilder/ui/AppBuilderPdfEmbed.tsx \
  widgets/appbuilder/ui/AppBuilderPdfEmbed.module.css \
  widgets/appbuilder/config/AppBuilderPdfEmbed.theme.types.ts \
  shared/ui/theme/useCustomTheme.ts \
  features/appbuilder/config/themeComponentDefaultPropsRegistry.ts
git commit -m "$(cat <<'EOF'
SS-9892: add AppBuilderPdfEmbed with theme registration

EOF
)"
```

---

### Task 3: Wire image widget + export widget

**Files:**
- Modify: `src/shared/widgets/appbuilder/ui/AppBuilderImageWidgetComponent.tsx`
- Modify: `src/shared/widgets/appbuilder/ui/AppBuilderImageExportWidgetComponent.tsx`

**Interfaces:**
- Consumes: `isPdfSrc`, `AppBuilderPdfEmbed`

- [ ] **Step 1: Update `AppBuilderImageWidgetComponent`**

```tsx
import {IAppBuilderWidgetPropsImage} from "@AppBuilderLib/features/appbuilder/config/appbuilder";
import {isPdfSrc} from "@AppBuilderLib/widgets/appbuilder/lib/isPdfSrc";
import AppBuilderImage from "./AppBuilderImage";
import AppBuilderImageExportWidgetComponent from "./AppBuilderImageExportWidgetComponent";
import AppBuilderPdfEmbed from "./AppBuilderPdfEmbed";

interface Props extends IAppBuilderWidgetPropsImage {
	namespace: string;
	isSvg?: boolean;
}

export default function AppBuilderImageWidgetComponent(props: Props) {
	const {
		alt,
		target,
		anchor,
		href,
		export: exportRef,
		namespace,
		isSvg,
	} = props;

	const propsCommon = {
		anchor,
		alt,
		target,
	};

	if (href) {
		if (isPdfSrc(href)) {
			return <AppBuilderPdfEmbed src={href} alt={alt} />;
		}
		return (
			<AppBuilderImage
				src={href}
				isSvg={
					isSvg ??
					(href?.endsWith(".svg") ||
						href?.startsWith("data:image/svg+xml"))
				}
				{...propsCommon}
			/>
		);
	} else if (exportRef) {
		return (
			<AppBuilderImageExportWidgetComponent
				namespace={namespace}
				exportId={exportRef.name}
				{...propsCommon}
			/>
		);
	}

	return <></>;
}
```

- [ ] **Step 2: Update `AppBuilderImageExportWidgetComponent`**

Keep existing fetch/object-URL logic. Change the render branch:

```tsx
import {isPdfSrc} from "@AppBuilderLib/widgets/appbuilder/lib/isPdfSrc";
import AppBuilderImage from "./AppBuilderImage";
import AppBuilderPdfEmbed from "./AppBuilderPdfEmbed";

// ... existing hooks unchanged ...

if (imageSrc) {
	if (isPdfSrc(imageSrc, contentType)) {
		return <AppBuilderPdfEmbed src={imageSrc} {...rest} />;
	}
	return (
		<AppBuilderImage
			src={imageSrc}
			isSvg={contentType === "image/svg+xml"}
			{...rest}
		/>
	);
}
return <></>;
```

Important: `rest` may still contain `anchor`/`target` from the parent. PdfEmbed must not accept/spread them into DOM. Destructure in export component before spreading:

```tsx
const {namespace, exportId, anchor: _anchor, target: _target, ...rest} = props;
```

Or only pass `alt` into PdfEmbed. Prefer explicit:

```tsx
return <AppBuilderPdfEmbed src={imageSrc} alt={rest.alt} />;
```

Inspect current `Props` of the export widget — today it only documents `namespace`/`exportId` but spreads `...rest` from parent (anchor/alt/target). Preserve `alt` for PdfEmbed; drop anchor/target for PDF.

- [ ] **Step 3: Typecheck + focused tests**

Run:

```bash
pnpm test -- src/shared/widgets/appbuilder/lib/__tests__/isPdfSrc.test.ts
pnpm exec tsc --noEmit
```

Expected: PASS

- [ ] **Step 4: Commit (submodule)**

```bash
cd src/shared
git add widgets/appbuilder/ui/AppBuilderImageWidgetComponent.tsx \
  widgets/appbuilder/ui/AppBuilderImageExportWidgetComponent.tsx
git commit -m "$(cat <<'EOF'
SS-9892: route PDF href and export MIME to AppBuilderPdfEmbed

EOF
)"
```

---

### Task 4: Regenerate theme docs + parent submodule pointer

**Files:**
- Run: `pnpm run docs` (updates `public/doc-flat.json` and related artifacts)
- Parent: update `src/shared` submodule gitlink after submodule commits

- [ ] **Step 1: Docs**

Run from repo root: `pnpm run docs`

Expected: exit 0; `AppBuilderPdfEmbed` appears in `public/doc-flat.json` under theme components.

- [ ] **Step 2: Commit docs artifacts**

If `public/doc-flat.json` (and siblings) changed in parent:

```bash
git add public/doc-flat.json
# add any other files pnpm run docs modified
git commit -m "$(cat <<'EOF'
SS-9892: regenerate doc-flat for AppBuilderPdfEmbed

EOF
)"
```

If docs output lives only in submodule, commit there instead with same message style.

- [ ] **Step 3: Parent submodule pointer**

```bash
cd /path/to/SS-9892
git add src/shared
git commit -m "$(cat <<'EOF'
SS-9892: bump AppBuilderShared for PDF image embed

EOF
)"
```

- [ ] **Step 4: Manual smoke checklist (no automation)**

Record in task report (do not block commit if browsers unavailable in CI agent):

- [ ] Sample PDF via `href` in horizontal container
- [ ] Sample PDF via `href` in vertical container
- [ ] Non-PDF image still works
- [ ] SVG still works
- [ ] Export with `application/pdf` if a test model is available
- [ ] Chrome / Firefox / Edge (Safari if available)

---

## Spec coverage (self-review)

| Spec requirement | Task |
|------------------|------|
| Auto-detect PDF | 1, 3 |
| object+iframe+download fallback | 2 |
| Split PdfEmbed; Image unchanged for PDF | 2, 3 |
| Own useProps + theme + Zod | 2 |
| Ignore anchor for PDF | 3 |
| Same sizing semantics | 2 |
| Unit tests isPdfSrc | 1 |
| pnpm run docs | 4 |
| Manual multi-browser | 4 checklist |

No placeholders remaining. Types/names consistent: `isPdfSrc`, `AppBuilderPdfEmbed`, `AppBuilderPdfEmbedThemeProps`, `AppBuilderPdfEmbedThemeDefaultPropsSchema`.
