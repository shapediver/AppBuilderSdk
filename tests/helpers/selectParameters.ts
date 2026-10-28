import {expect, Locator, Page} from "@playwright/test";
import {takeSnapshot} from "./takeSnapshot";

/**
 * Parameter container by exact label. `getParameterElement` matches
 * substrings, which would also hit "ImageDropDown" for "DropDown".
 * Only visible labels count: closed filter dropdowns stay mounted (hidden)
 * and may contain a group label with the same text (e.g. "Color").
 */
export function parameter(page: Page, name: string): Locator {
	return page
		.locator("p:visible")
		.filter({hasText: new RegExp(`^${name}$`)})
		.locator("../..");
}

/** Read the current value of a named SDV parameter. */
export async function sdvParameterValue(
	page: Page,
	name: string,
): Promise<string> {
	return page.evaluate((parameterName) => {
		const sessions = (
			window as unknown as {
				SDV?: {
					sessions?: Record<
						string,
						{
							parameters?: Record<
								string,
								{name: string; value: unknown}
							>;
						}
					>;
				};
			}
		).SDV?.sessions;
		for (const session of Object.values(sessions ?? {})) {
			for (const parameter of Object.values(session.parameters ?? {})) {
				if (parameter.name === parameterName) {
					return String(parameter.value);
				}
			}
		}
		throw new Error(`SDV parameter "${parameterName}" not found`);
	}, name);
}

/** Card titles (displayname, first text line) currently rendered for a parameter. */
export async function cardLabels(page: Page, name: string): Promise<string[]> {
	const texts = await parameter(page, name)
		.locator(".mantine-Card-root")
		.allInnerTexts();
	return texts.map((text) => text.trim().split("\n")[0].trim());
}

/** Card element by its displayname. */
export function card(page: Page, name: string, displayname: string): Locator {
	return parameter(page, name)
		.locator(".mantine-Card-root")
		.filter({hasText: displayname})
		.first();
}

/**
 * Screenshot with the parameter scrolled into view (most parameters sit
 * below the fold of the sidebar's own scroll container) and its visible
 * images loaded. Images scrolled out of view inside a card list may be lazy
 * and never load, so only images in the viewport are awaited.
 */
export async function snapshotParameter(
	page: Page,
	name: string,
	snapshotName: string,
) {
	const element = parameter(page, name);
	await element.scrollIntoViewIfNeeded();
	await expect
		.poll(() =>
			element.locator("img").evaluateAll((images) =>
				images.every((image) => {
					const img = image as HTMLImageElement;
					const box = img.getBoundingClientRect();
					const inViewport =
						box.width > 0 &&
						box.height > 0 &&
						box.bottom > 0 &&
						box.right > 0 &&
						box.top < window.innerHeight &&
						box.left < window.innerWidth;
					return img.complete || !inViewport;
				}),
			),
		)
		.toBe(true);
	await takeSnapshot(page, snapshotName);
}

/** Scroll the card list to the bottom to trigger the infinite-scroll sentinel. */
export async function scrollToBottom(page: Page, name: string) {
	await parameter(page, name)
		.locator("div[style*='overflow-y']")
		.first()
		.evaluate((el) => {
			el.scrollTop = el.scrollHeight;
			el.dispatchEvent(new Event("scroll"));
		});
}

/** Scroll until every page is loaded; returns all card titles. */
export async function loadAllCards(
	page: Page,
	name: string,
): Promise<string[]> {
	let previous = -1;
	let labels = await cardLabels(page, name);
	while (labels.length !== previous) {
		previous = labels.length;
		await scrollToBottom(page, name);
		// Give the sentinel a chance to append the next page.
		await page.waitForTimeout(500);
		labels = await cardLabels(page, name);
	}
	return labels;
}

/** The open filter dropdown (Mantine renders it in a portal). */
export function filterDropdown(page: Page): Locator {
	return page.locator(".mantine-Combobox-dropdown:visible");
}

/** Open the filter combobox of a database-backed select parameter. */
export async function openFilters(page: Page, name: string) {
	await parameter(page, name).getByPlaceholder("Filters").click();
	await expect(filterDropdown(page)).toBeVisible();
}

/** Expand an accordion filter group (groups start collapsed). */
export async function expandFilterGroup(page: Page, label: string) {
	const control = filterDropdown(page)
		.locator(".mantine-Accordion-control")
		.filter({hasText: label});
	if ((await control.getAttribute("aria-expanded")) !== "true") {
		await control.getByText(label, {exact: true}).click();
	}
	await expect(control).toHaveAttribute("aria-expanded", "true");
}

/** Click one filter option (checkbox or radio) by its label. */
export async function toggleFilterOption(page: Page, label: string) {
	await filterDropdown(page)
		.locator("label")
		.getByText(label, {exact: true})
		.click();
}

/** Active filter pills of a parameter. */
export function filterPills(page: Page, name: string): Locator {
	return parameter(page, name).locator(".mantine-Pill-root");
}

/** Set a named SDV parameter and recompute the session (no UI involved). */
export async function setSdvParameterValue(
	page: Page,
	name: string,
	value: string,
) {
	await page.evaluate(
		async ({parameterName, parameterValue}) => {
			const sessions = (
				window as unknown as {
					SDV?: {
						sessions?: Record<
							string,
							{
								parameters?: Record<
									string,
									{name: string; value: unknown}
								>;
								customize: () => Promise<unknown>;
							}
						>;
					};
				}
			).SDV?.sessions;
			for (const session of Object.values(sessions ?? {})) {
				for (const parameter of Object.values(
					session.parameters ?? {},
				)) {
					if (parameter.name === parameterName) {
						parameter.value = parameterValue;
						await session.customize();
						return;
					}
				}
			}
			throw new Error(`SDV parameter "${parameterName}" not found`);
		},
		{parameterName: name, parameterValue: value},
	);
}

/**
 * Park the mouse in the viewport corner and wait until no tooltip is open,
 * so a screenshot does not catch a tooltip of whatever ended up under the
 * cursor.
 */
export async function moveMouseAway(page: Page) {
	await page.mouse.move(0, 0);
	await expect(page.getByRole("tooltip")).toHaveCount(0);
}
