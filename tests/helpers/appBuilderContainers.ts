import {expect, Locator, Page} from "@playwright/test";

export type E2eStandardContainerName = "left" | "right" | "top" | "bottom";

/**
 * Playwright project default (playwright.config.ts). Above Mantine `md` (62em / 992px).
 */
export const APP_BUILDER_E2E_VIEWPORT_DESKTOP = {width: 1280, height: 800};

/**
 * Below TemplateSelector `mobileBreakpoint` (`md`) in portrait. On AppShell,
 * right content moves under the viewport; left/bottom live in the burger navbar.
 */
export const APP_BUILDER_E2E_VIEWPORT_MOBILE_PORTRAIT = {
	width: 390,
	height: 844,
};

/**
 * Below `md` (62em / 992px) in landscape. 900px is above `sm` (768px), so
 * this size only enters mobile when the fixture uses `md` (TemplateSelector
 * and ViewportAnchor2d `mobileBreakpoint` in example-mobileFallback.json).
 * Bottom (and leftover left) stay in the burger; right stays in the main grid.
 */
export const APP_BUILDER_E2E_VIEWPORT_MOBILE_LANDSCAPE = {
	width: 900,
	height: 700,
};

export function getStandardContainer(
	page: Page,
	name: E2eStandardContainerName,
): Locator {
	return page.locator(`[data-app-builder-container="${name}"]`);
}

export function getAppShellBurger(page: Page): Locator {
	return page.locator(".mantine-Burger-root");
}

export function getAppShellNavbar(page: Page): Locator {
	return page.locator(".mantine-AppShell-navbar");
}

export async function expectTextInStandardContainer(
	page: Page,
	name: E2eStandardContainerName,
	text: string,
): Promise<void> {
	await expect(
		getStandardContainer(page, name).getByText(text),
	).toBeVisible();
}

/**
 * Slot membership only. Grid left/right columns span the last row, so
 * bottom overflow is clipped and Playwright `toBeVisible()` reports hidden.
 */
export async function expectTextPresentInStandardContainer(
	page: Page,
	name: E2eStandardContainerName,
	text: string,
): Promise<void> {
	await expect(getStandardContainer(page, name)).toContainText(text);
}

export async function expectTextNotInStandardContainer(
	page: Page,
	name: E2eStandardContainerName,
	text: string,
): Promise<void> {
	await expect(getStandardContainer(page, name).getByText(text)).toHaveCount(
		0,
	);
}

export async function expectTabInStandardContainer(
	page: Page,
	name: E2eStandardContainerName,
	tabName: string,
): Promise<void> {
	await expect(
		getStandardContainer(page, name).getByRole("tab", {name: tabName}),
	).toBeVisible();
}

export async function clickTabInStandardContainer(
	page: Page,
	name: E2eStandardContainerName,
	tabName: string,
): Promise<void> {
	await getStandardContainer(page, name)
		.getByRole("tab", {name: tabName})
		.click();
}

/**
 * Closed-anchor preview icons in example-mobileFallback-anchors.json:
 * desktop = red circle (`#e03131`), mobile = green square (`#2f9e44`).
 */
export const MOBILE_FALLBACK_PREVIEW_ICON = {
	desktop: "e03131",
	mobile: "2f9e44",
} as const;

export function getPreviewIconImg(
	page: Page,
	kind: keyof typeof MOBILE_FALLBACK_PREVIEW_ICON,
): Locator {
	return page.locator(`img[src*="${MOBILE_FALLBACK_PREVIEW_ICON[kind]}"]`);
}

/** Resize below TemplateSelector `mobileBreakpoint` (`md`). */
export async function setViewportBelowMobileBreakpoint(
	page: Page,
	size: {
		width: number;
		height: number;
	} = APP_BUILDER_E2E_VIEWPORT_MOBILE_PORTRAIT,
): Promise<void> {
	await page.setViewportSize(size);
}

/** Resize below `navbarBreakpoint` and wait until the AppShell burger is shown. */
export async function setViewportBelowNavbarBreakpoint(
	page: Page,
	size: {
		width: number;
		height: number;
	} = APP_BUILDER_E2E_VIEWPORT_MOBILE_PORTRAIT,
): Promise<void> {
	await setViewportBelowMobileBreakpoint(page, size);
	await expect(getAppShellBurger(page)).toBeVisible();
}

/** Resize to the desktop project viewport and wait until the burger hides. */
export async function setViewportAboveNavbarBreakpoint(
	page: Page,
	size: {width: number; height: number} = APP_BUILDER_E2E_VIEWPORT_DESKTOP,
): Promise<void> {
	await page.setViewportSize(size);
	await expect(getAppShellBurger(page)).toBeHidden();
}

export async function openAppShellNavbar(page: Page): Promise<void> {
	await getAppShellBurger(page).click();
	await expect(getAppShellNavbar(page)).not.toHaveAttribute("hidden");
	await getAppShellNavbar(page).evaluate((element) =>
		Promise.all(
			element
				.getAnimations({subtree: true})
				.map((animation) => animation.finished.catch(() => undefined)),
		),
	);
}

/**
 * AppShell collapsed navbar keeps a layout box (author CSS overrides the
 * HTML `hidden` attribute’s `display: none`), so Playwright `toBeHidden()`
 * is not reliable. Collapsed state is the `hidden` attribute.
 */
export async function expectAppShellNavbarCollapsed(page: Page): Promise<void> {
	await expect(getAppShellNavbar(page)).toHaveAttribute("hidden", "");
}
