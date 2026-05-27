import {Locator, Page} from "@playwright/test";

/**
 * Targets the AppBuilder parameter container by its display name.
 *
 * AppBuilder renders each parameter as:
 *   <div>                  ← container  (2 levels up from the label)
 *     <p>Display Name</p>  ← label paragraph
 *     <div>                ← control wrapper
 *       <input|button|…/>  ← the actual control
 *     </div>
 *   </div>
 *
 * Scoping to the container lets you chain further locators
 * (e.g. `.getByRole("slider")`) without accidentally matching
 * unrelated controls elsewhere on the page.
 *
 * @param page        - Playwright Page
 * @param displayName - The display name shown in the AppBuilder UI
 * @returns Locator scoped to the parameter's outermost container element
 *
 * @example
 * // Slider
 * await getParameterElement(page, "Count").getByRole("slider").fill("4");
 *
 * // Text input
 * await getParameterElement(page, "Label").getByRole("textbox").fill("hello");
 *
 * // File input (Mantine FileInput hides the native <input> inside the button)
 * await getParameterElement(page, "Floor Plan")
 *   .locator('input[type="file"]')
 *   .setInputFiles("path/to/file.3dm");
 *
 * // Activation button (selection / gumball / points input)
 * await getParameterElement(page, "SelectBox").getByRole("button").click();
 */
export function getParameterElement(page: Page, displayName: string): Locator {
	return page.locator("p", {hasText: displayName}).locator("../..");
}
