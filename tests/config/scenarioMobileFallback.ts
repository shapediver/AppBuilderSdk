/**
 * SS-10042 mobileFallback e2e.
 *
 * AppShell: public/example-mobileFallback.json
 * Grid: public/example-mobileFallback-grid.json (`template: "grid"`; same
 * containers and mobileFallbacks).
 * Theme is the general default (`AppBuilderTemplateSelector`, including
 * `mobileBreakpoint: "md"` so landscape 900px is below the threshold).
 * JSON overlays defined fields per container/anchor. ViewportAnchor2d
 * also sets `mobileBreakpoint: "md"` so anchors match the fixture.
 *
 * AppShell snapshots: desktop visual; closed-navbar `*-layout` (viewport +
 * leftover `right`); open-navbar `*-portrait` / `*-landscape` (drawer).
 * Grid snapshots: desktop visual; mobile portrait/landscape (no burger).
 * Grid example sets `bottomFullWidth` so leftover bottom widgets are not
 * clipped by full-height left/right columns.
 *
 * Unique labels in those files:
 *   MF-LEFT-CHAIN      left original — theme moves to right (JSON only sets position)
 *   MF-RIGHT-THEME     right original — theme moves to bottom
 *   MF-BOTTOM-NATIVE   bottom original — stays
 *   MF-TOP-DISABLED    top original — theme would move to bottom; JSON disabled hides
 *   MF-ANCHOR-THEME    2d anchor — theme ViewportAnchor2d → bottom
 *   MF-ANCHOR-JSON-LEFT 2d anchor — JSON overlays container to left
 *   MF-ANCHOR-JSON-HIDE 2d anchor — JSON overlays disabled
 *
 * Additional slugs:
 *   example-mobileFallback-tabs — tabbed source (left→right) and tabbed
 *     target (right extras land in bottom’s active tab).
 *   example-mobileFallback-anchors — ViewportAnchor3d unset still goes to
 *     right; JSON 3d overlays to bottom; 2d theme does not leak to 3d;
 *     closed 2d swaps previewIcon on mobile.
 *   example-mobileFallback-keepBottom — AppShell keepBottomInGrid so leftover
 *     bottom stays in the main grid below md.
 */
import {expect, Page} from "@playwright/test";
import {
	APP_BUILDER_E2E_VIEWPORT_MOBILE_LANDSCAPE,
	APP_BUILDER_E2E_VIEWPORT_MOBILE_PORTRAIT,
	clickTabInStandardContainer,
	expectAppShellNavbarCollapsed,
	expectTabInStandardContainer,
	expectTextInStandardContainer,
	expectTextNotInStandardContainer,
	getAppShellBurger,
	getPreviewIconImg,
	getStandardContainer,
	openAppShellNavbar,
	setViewportBelowMobileBreakpoint,
	setViewportBelowNavbarBreakpoint,
} from "../helpers/appBuilderContainers";
import {takeSnapshot} from "../helpers/takeSnapshot";
import type {ScenarioNamedAction} from "./scenarioActions";

const LABELS = {
	leftChain: "MF-LEFT-CHAIN",
	rightTheme: "MF-RIGHT-THEME",
	bottomNative: "MF-BOTTOM-NATIVE",
	topDisabled: "MF-TOP-DISABLED",
	anchorTheme: "MF-ANCHOR-THEME",
	anchorJsonLeft: "MF-ANCHOR-JSON-LEFT",
	anchorJsonHide: "MF-ANCHOR-JSON-HIDE",
} as const;

async function expectDesktopSlots(page: Page): Promise<void> {
	await expectTextInStandardContainer(page, "left", LABELS.leftChain);
	await expectTextInStandardContainer(page, "right", LABELS.rightTheme);
	await expectTextInStandardContainer(page, "bottom", LABELS.bottomNative);
	await expectTextInStandardContainer(page, "top", LABELS.topDisabled);
	await expect(page.getByText(LABELS.anchorTheme)).toBeVisible();
	await expect(page.getByText(LABELS.anchorJsonLeft)).toBeVisible();
	await expect(page.getByText(LABELS.anchorJsonHide)).toBeVisible();

	await expectTextNotInStandardContainer(page, "bottom", LABELS.rightTheme);
	await expectTextNotInStandardContainer(page, "right", LABELS.leftChain);
	await expectTextNotInStandardContainer(page, "bottom", LABELS.topDisabled);
}

async function expectOneHopChainInRight(page: Page): Promise<void> {
	await expectTextInStandardContainer(page, "right", LABELS.leftChain);
	await expectTextNotInStandardContainer(page, "left", LABELS.leftChain);
	await expectTextNotInStandardContainer(page, "bottom", LABELS.leftChain);
}

/**
 * Closed burger: leftover `right` (one-hop chain) stays in the main grid.
 * Left/bottom fallbacks live in the AppShell navbar (open-navbar tests).
 */
async function expectMobileLayoutNavbarClosed(page: Page): Promise<void> {
	await expectAppShellNavbarCollapsed(page);
	await expect(page.locator("canvas").first()).toBeVisible();
	await expectOneHopChainInRight(page);
	await expect(page.getByText(LABELS.topDisabled)).toHaveCount(0);
	await expect(page.getByText(LABELS.anchorJsonHide)).toHaveCount(0);
}

async function expectMobileFallbacksNavbarOpen(page: Page): Promise<void> {
	await openAppShellNavbar(page);

	await expectOneHopChainInRight(page);

	await expectTextInStandardContainer(page, "bottom", LABELS.rightTheme);
	await expectTextNotInStandardContainer(page, "right", LABELS.rightTheme);

	await expectTextInStandardContainer(page, "bottom", LABELS.bottomNative);

	await expect(page.getByText(LABELS.topDisabled)).toHaveCount(0);
	await expectTextNotInStandardContainer(page, "bottom", LABELS.topDisabled);

	await expectTextInStandardContainer(page, "bottom", LABELS.anchorTheme);
	await expectTextInStandardContainer(page, "left", LABELS.anchorJsonLeft);
	await expect(page.getByText(LABELS.anchorJsonHide)).toHaveCount(0);
}

export const exampleMobileFallbackNamedActions: ScenarioNamedAction[] = [
	{
		name: "desktop keeps original slots",
		run: async (page) => {
			await expectDesktopSlots(page);
		},
	},
	{
		name: "mobile portrait layout keeps one-hop chain under the viewport",
		run: async (page, slug) => {
			await setViewportBelowNavbarBreakpoint(
				page,
				APP_BUILDER_E2E_VIEWPORT_MOBILE_PORTRAIT,
			);
			await expectMobileLayoutNavbarClosed(page);
			await takeSnapshot(page, `${slug}-mobile-portrait-layout`);
		},
	},
	{
		name: "mobile landscape layout keeps one-hop chain in the grid",
		run: async (page, slug) => {
			await setViewportBelowNavbarBreakpoint(
				page,
				APP_BUILDER_E2E_VIEWPORT_MOBILE_LANDSCAPE,
			);
			await expectMobileLayoutNavbarClosed(page);
			await takeSnapshot(page, `${slug}-mobile-landscape-layout`);
		},
	},
	{
		name: "mobile portrait navbar shows theme, JSON overlay, and one-hop chain",
		run: async (page, slug) => {
			await setViewportBelowNavbarBreakpoint(
				page,
				APP_BUILDER_E2E_VIEWPORT_MOBILE_PORTRAIT,
			);
			await expectMobileFallbacksNavbarOpen(page);
			await takeSnapshot(page, `${slug}-mobile-portrait`);
		},
	},
	{
		name: "mobile landscape navbar shows theme, JSON overlay, and one-hop chain",
		run: async (page, slug) => {
			await setViewportBelowNavbarBreakpoint(
				page,
				APP_BUILDER_E2E_VIEWPORT_MOBILE_LANDSCAPE,
			);
			await expectMobileFallbacksNavbarOpen(page);
			await takeSnapshot(page, `${slug}-mobile-landscape`);
		},
	},
];

/**
 * Grid has no burger: leftover left (JSON anchor), right (one-hop chain),
 * and bottom (native + theme extras) stay on screen. The grid example uses
 * `bottomFullWidth` so bottom labels are not clipped by side columns.
 */
async function expectMobileFallbacksOnGrid(page: Page): Promise<void> {
	await expect(page.locator(".mantine-AppShell-root")).toHaveCount(0);
	await expect(getAppShellBurger(page)).toHaveCount(0);
	await expect(page.locator("canvas").first()).toBeVisible();

	await expectOneHopChainInRight(page);

	await expectTextInStandardContainer(page, "bottom", LABELS.rightTheme);
	await expectTextNotInStandardContainer(page, "right", LABELS.rightTheme);

	await expectTextInStandardContainer(page, "bottom", LABELS.bottomNative);
	await expectTextInStandardContainer(page, "bottom", LABELS.anchorTheme);
	await expectTextInStandardContainer(page, "left", LABELS.anchorJsonLeft);

	await expect(page.getByText(LABELS.topDisabled)).toHaveCount(0);
	await expectTextNotInStandardContainer(page, "bottom", LABELS.topDisabled);
	await expect(getStandardContainer(page, "top")).toHaveCount(0);
	await expect(page.getByText(LABELS.anchorJsonHide)).toHaveCount(0);
}

export const exampleMobileFallbackGridNamedActions: ScenarioNamedAction[] = [
	{
		name: "desktop keeps original slots",
		run: async (page) => {
			await expect(page.locator(".mantine-AppShell-root")).toHaveCount(0);
			await expectDesktopSlots(page);
		},
	},
	{
		name: "mobile portrait shows remapped containers without a burger",
		run: async (page, slug) => {
			await setViewportBelowMobileBreakpoint(
				page,
				APP_BUILDER_E2E_VIEWPORT_MOBILE_PORTRAIT,
			);
			await expectMobileFallbacksOnGrid(page);
			await takeSnapshot(page, `${slug}-mobile-portrait`);
		},
	},
	{
		name: "mobile landscape shows remapped containers without a burger",
		run: async (page, slug) => {
			await setViewportBelowMobileBreakpoint(
				page,
				APP_BUILDER_E2E_VIEWPORT_MOBILE_LANDSCAPE,
			);
			await expectMobileFallbacksOnGrid(page);
			await takeSnapshot(page, `${slug}-mobile-landscape`);
		},
	},
];

const TAB_LABELS = {
	srcA: "MF-TAB-SRC-A",
	srcABody: "MF-TAB-SRC-A-BODY",
	srcB: "MF-TAB-SRC-B",
	srcBBody: "MF-TAB-SRC-B-BODY",
	inject: "MF-TAB-INJECT",
	tgtA: "MF-TAB-TGT-A",
	tgtABody: "MF-TAB-TGT-A-BODY",
	tgtB: "MF-TAB-TGT-B",
	tgtBBody: "MF-TAB-TGT-B-BODY",
} as const;

async function expectDesktopTabs(page: Page): Promise<void> {
	await expectTabInStandardContainer(page, "left", TAB_LABELS.srcA);
	await expectTabInStandardContainer(page, "left", TAB_LABELS.srcB);
	await expectTextInStandardContainer(page, "left", TAB_LABELS.srcABody);
	await expectTextInStandardContainer(page, "right", TAB_LABELS.inject);
	await expectTabInStandardContainer(page, "bottom", TAB_LABELS.tgtA);
	await expectTabInStandardContainer(page, "bottom", TAB_LABELS.tgtB);
	await expectTextInStandardContainer(page, "bottom", TAB_LABELS.tgtABody);
	await expectTextNotInStandardContainer(page, "right", TAB_LABELS.srcABody);
	await expectTextNotInStandardContainer(page, "bottom", TAB_LABELS.inject);
}

async function expectMobileFallbacksNavbarOpenForTabs(
	page: Page,
): Promise<void> {
	await openAppShellNavbar(page);

	await expectTabInStandardContainer(page, "right", TAB_LABELS.srcA);
	await expectTextInStandardContainer(page, "right", TAB_LABELS.srcABody);

	await expectTabInStandardContainer(page, "bottom", TAB_LABELS.tgtA);
	await expectTabInStandardContainer(page, "bottom", TAB_LABELS.tgtB);
	await expectTextInStandardContainer(page, "bottom", TAB_LABELS.tgtABody);
	await expectTextInStandardContainer(page, "bottom", TAB_LABELS.inject);
	await expect(
		getStandardContainer(page, "bottom").getByText(TAB_LABELS.tgtBBody),
	).toBeHidden();

	await clickTabInStandardContainer(page, "bottom", TAB_LABELS.tgtB);
	await expectTextInStandardContainer(page, "bottom", TAB_LABELS.tgtBBody);
	await expectTextInStandardContainer(page, "bottom", TAB_LABELS.inject);
	await expect(
		getStandardContainer(page, "bottom").getByText(TAB_LABELS.tgtABody),
	).toBeHidden();
}

export const exampleMobileFallbackTabsNamedActions: ScenarioNamedAction[] = [
	{
		name: "desktop keeps tabbed source and target in original slots",
		run: async (page) => {
			await expectDesktopTabs(page);
		},
	},
	{
		name: "mobile portrait layout moves tabbed source to right",
		run: async (page, slug) => {
			await setViewportBelowNavbarBreakpoint(
				page,
				APP_BUILDER_E2E_VIEWPORT_MOBILE_PORTRAIT,
			);
			await expectAppShellNavbarCollapsed(page);
			await expectTabInStandardContainer(page, "right", TAB_LABELS.srcA);
			await expectTabInStandardContainer(page, "right", TAB_LABELS.srcB);
			await expectTextInStandardContainer(
				page,
				"right",
				TAB_LABELS.srcABody,
			);
			await expectTextNotInStandardContainer(
				page,
				"right",
				TAB_LABELS.inject,
			);
			await expectTextNotInStandardContainer(
				page,
				"right",
				TAB_LABELS.tgtABody,
			);
			await takeSnapshot(page, `${slug}-mobile-portrait-layout`);
		},
	},
	{
		name: "mobile portrait navbar puts extras in the active target tab",
		run: async (page, slug) => {
			await setViewportBelowNavbarBreakpoint(
				page,
				APP_BUILDER_E2E_VIEWPORT_MOBILE_PORTRAIT,
			);
			await expectMobileFallbacksNavbarOpenForTabs(page);
			await takeSnapshot(page, `${slug}-mobile-portrait`);
		},
	},
];

const ANCHOR_LABELS = {
	a3dDefault: "MF-A3D-DEFAULT",
	a3dJsonBottom: "MF-A3D-JSON-BOTTOM",
	a2dTheme: "MF-A2D-THEME",
	previewClosed: "MF-PREVIEW-CLOSED",
} as const;

export const exampleMobileFallbackAnchorsNamedActions: ScenarioNamedAction[] = [
	{
		name: "desktop keeps 2d/3d anchors on the viewport",
		run: async (page) => {
			await expect(
				page.getByText(ANCHOR_LABELS.a3dDefault),
			).toBeVisible();
			await expect(
				page.getByText(ANCHOR_LABELS.a3dJsonBottom),
			).toBeVisible();
			await expect(page.getByText(ANCHOR_LABELS.a2dTheme)).toBeVisible();
			await expect(
				page.getByText(ANCHOR_LABELS.previewClosed),
			).toHaveCount(0);
			await expect(getPreviewIconImg(page, "desktop")).toBeVisible();
			await expect(getPreviewIconImg(page, "mobile")).toHaveCount(0);
			await expect(getStandardContainer(page, "right")).toHaveCount(0);
			await expect(getStandardContainer(page, "bottom")).toHaveCount(0);
		},
	},
	{
		name: "mobile portrait layout sends unset 3d to right and swaps previewIcon",
		run: async (page, slug) => {
			await setViewportBelowNavbarBreakpoint(
				page,
				APP_BUILDER_E2E_VIEWPORT_MOBILE_PORTRAIT,
			);
			await expectAppShellNavbarCollapsed(page);
			await expectTextInStandardContainer(
				page,
				"right",
				ANCHOR_LABELS.a3dDefault,
			);
			await expectTextNotInStandardContainer(
				page,
				"right",
				ANCHOR_LABELS.a3dJsonBottom,
			);
			await expectTextNotInStandardContainer(
				page,
				"right",
				ANCHOR_LABELS.a2dTheme,
			);
			await expect(getPreviewIconImg(page, "mobile")).toBeVisible();
			await expect(getPreviewIconImg(page, "desktop")).toHaveCount(0);
			await expect(
				page.getByText(ANCHOR_LABELS.previewClosed),
			).toHaveCount(0);
			await takeSnapshot(page, `${slug}-mobile-portrait-layout`);
		},
	},
	{
		name: "mobile portrait navbar shows 2d theme and JSON 3d in bottom",
		run: async (page, slug) => {
			await setViewportBelowNavbarBreakpoint(
				page,
				APP_BUILDER_E2E_VIEWPORT_MOBILE_PORTRAIT,
			);
			await openAppShellNavbar(page);
			await expectTextInStandardContainer(
				page,
				"right",
				ANCHOR_LABELS.a3dDefault,
			);
			await expectTextInStandardContainer(
				page,
				"bottom",
				ANCHOR_LABELS.a2dTheme,
			);
			await expectTextInStandardContainer(
				page,
				"bottom",
				ANCHOR_LABELS.a3dJsonBottom,
			);
			await expectTextNotInStandardContainer(
				page,
				"bottom",
				ANCHOR_LABELS.a3dDefault,
			);
			await takeSnapshot(page, `${slug}-mobile-portrait`);
		},
	},
];

const KB_LABELS = {
	left: "MF-KB-LEFT",
	right: "MF-KB-RIGHT",
	bottom: "MF-KB-BOTTOM",
} as const;

async function expectDesktopKeepBottom(page: Page): Promise<void> {
	await expectTextInStandardContainer(page, "left", KB_LABELS.left);
	await expectTextInStandardContainer(page, "right", KB_LABELS.right);
	await expectTextInStandardContainer(page, "bottom", KB_LABELS.bottom);
	await expectTextNotInStandardContainer(page, "bottom", KB_LABELS.right);
	await expectTextNotInStandardContainer(page, "right", KB_LABELS.left);
}

export const exampleMobileFallbackKeepBottomNamedActions: ScenarioNamedAction[] =
	[
		{
			name: "desktop keeps original slots",
			run: async (page) => {
				await expectDesktopKeepBottom(page);
			},
		},
		{
			name: "mobile portrait layout keeps leftover bottom in the grid",
			run: async (page, slug) => {
				await setViewportBelowNavbarBreakpoint(
					page,
					APP_BUILDER_E2E_VIEWPORT_MOBILE_PORTRAIT,
				);
				await expectAppShellNavbarCollapsed(page);
				await expectTextInStandardContainer(
					page,
					"bottom",
					KB_LABELS.bottom,
				);
				await expectTextInStandardContainer(
					page,
					"bottom",
					KB_LABELS.right,
				);
				await expectTextNotInStandardContainer(
					page,
					"bottom",
					KB_LABELS.left,
				);
				await takeSnapshot(page, `${slug}-mobile-portrait-layout`);
			},
		},
		{
			name: "mobile portrait navbar shows one-hop chain in right",
			run: async (page, slug) => {
				await setViewportBelowNavbarBreakpoint(
					page,
					APP_BUILDER_E2E_VIEWPORT_MOBILE_PORTRAIT,
				);
				await openAppShellNavbar(page);
				await expectTextInStandardContainer(
					page,
					"right",
					KB_LABELS.left,
				);
				await expectTextNotInStandardContainer(
					page,
					"bottom",
					KB_LABELS.left,
				);
				await expectTextInStandardContainer(
					page,
					"bottom",
					KB_LABELS.bottom,
				);
				await expectTextInStandardContainer(
					page,
					"bottom",
					KB_LABELS.right,
				);
				await takeSnapshot(page, `${slug}-mobile-portrait`);
			},
		},
		{
			name: "mobile landscape layout keeps chain and leftover bottom in the grid",
			run: async (page, slug) => {
				await setViewportBelowMobileBreakpoint(
					page,
					APP_BUILDER_E2E_VIEWPORT_MOBILE_LANDSCAPE,
				);
				await expect(getAppShellBurger(page)).toHaveCount(0);
				await expectTextInStandardContainer(
					page,
					"right",
					KB_LABELS.left,
				);
				await expectTextInStandardContainer(
					page,
					"bottom",
					KB_LABELS.bottom,
				);
				await expectTextInStandardContainer(
					page,
					"bottom",
					KB_LABELS.right,
				);
				await takeSnapshot(page, `${slug}-mobile-landscape-layout`);
			},
		},
	];
