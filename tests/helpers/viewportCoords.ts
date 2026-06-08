import {Page} from "@playwright/test";

/**
 * Converts normalised (0–1) canvas coordinates to absolute page pixel
 * coordinates, suitable for `page.mouse.click()` / `page.mouse.move()`.
 *
 * Uses the bounding box of the first `<canvas>` element on the page, which
 * is the ShapeDiver 3D viewport.
 *
 * @param page - Playwright Page
 * @param x    - Horizontal position: 0 = left edge, 1 = right edge
 * @param y    - Vertical position:   0 = top edge,  1 = bottom edge
 * @returns Absolute `{x, y}` pixel coordinates within the page
 *
 * @example
 * // Click the centre of the viewport
 * const pos = await viewportCoords(page, 0.5, 0.5);
 * await page.mouse.click(pos.x, pos.y);
 *
 * // Drag from centre-left to centre-right
 * const from = await viewportCoords(page, 0.3, 0.5);
 * const to   = await viewportCoords(page, 0.7, 0.5);
 * await page.mouse.move(from.x, from.y);
 * await page.mouse.down();
 * await page.mouse.move(to.x, to.y, {steps: 10});
 * await page.mouse.up();
 */
export async function viewportCoords(
	page: Page,
	x: number,
	y: number,
): Promise<{x: number; y: number}> {
	const box = await page.locator("canvas").first().boundingBox();
	if (!box) throw new Error("Canvas not found or has no bounding box");
	return {
		x: box.x + box.width * x,
		y: box.y + box.height * y,
	};
}
