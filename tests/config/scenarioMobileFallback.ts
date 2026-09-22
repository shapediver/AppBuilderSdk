/**
 * SS-10042 mobileFallback e2e.
 *
 * Settings file: public/example-mobileFallback.json
 * Theme is the general default; JSON overlays defined fields per container/anchor.
 *
 * Snapshots: desktop visual from the spec; closed-navbar `*-layout` (viewport +
 * leftover `right`); open-navbar `*-portrait` / `*-landscape` (drawer contents).
 *
 * Unique labels in that file:
 *   MF-LEFT-CHAIN      left original — theme moves to right (JSON only sets position)
 *   MF-RIGHT-THEME     right original — theme moves to bottom
 *   MF-BOTTOM-NATIVE   bottom original — stays
 *   MF-TOP-DISABLED    top original — theme would move to bottom; JSON disabled hides
 *   MF-ANCHOR-THEME    2d anchor — theme ViewportAnchor2d → bottom
 *   MF-ANCHOR-JSON-LEFT 2d anchor — JSON overlays container to left
 *   MF-ANCHOR-JSON-HIDE 2d anchor — JSON overlays disabled
 */
import {expect, Page} from "@playwright/test";
import {
	APP_BUILDER_E2E_VIEWPORT_MOBILE_LANDSCAPE,
	APP_BUILDER_E2E_VIEWPORT_MOBILE_PORTRAIT,
	expectAppShellNavbarCollapsed,
	expectTextInStandardContainer,
	expectTextNotInStandardContainer,
	openAppShellNavbar,
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
