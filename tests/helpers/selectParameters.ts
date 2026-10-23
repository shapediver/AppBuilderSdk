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
 * below the fold of the sidebar's own scroll container) and its images
 * loaded.
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
			element
				.locator("img")
				.evaluateAll((images) =>
					images.every(
						(image) => (image as HTMLImageElement).complete,
					),
				),
		)
		.toBe(true);
	await takeSnapshot(page, snapshotName);
}
