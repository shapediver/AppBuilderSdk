/**
 * Coordinate picker for the 3D viewport.
 *
 * Usage:
 *   pnpm pick-coords <slug>
 *   TEST_BRANCH=my-feature pnpm pick-coords my-slug
 *
 * Opens the page, lets you click the 3D scene, and prints normalized
 * coordinates you can paste straight into a test.
 */

import {chromium} from "@playwright/test";

const DEFAULT_HOST = "https://appbuilder.shapediver.com/v1/main";
const DEFAULT_BRANCH = "testing";

function resolveUrl(slug: string): string {
	const branch = process.env.TEST_BRANCH?.trim() || DEFAULT_BRANCH;
	const baseUrl =
		process.env.APPBUILDER_BASE_URL?.trim() ||
		`${DEFAULT_HOST}/${branch}/`;
	const url = new URL(baseUrl);
	url.searchParams.set("slug", slug);
	return url.toString();
}

async function main() {
	const slug = process.argv[2];

	if (!slug) {
		console.error("");
		console.error("  Usage: pnpm pick-coords <slug>");
		console.error("  Example: pnpm pick-coords beta-cameraaction");
		console.error("  Example: TEST_BRANCH=development pnpm pick-coords my-slug");
		console.error("");
		process.exit(1);
	}

	const url = resolveUrl(slug);

	console.log(`\n  Opening: ${url}\n`);
	console.log("  Click anywhere on the 3D scene.");
	console.log("  Coordinates appear here — copy into your test.");
	console.log("  Close the browser when done.\n");

	const browser = await chromium.launch({headless: false});
	const page = await browser.newPage({viewport: {width: 1280, height: 800}});

	await page.exposeFunction("__pickCoord", (normX: number, normY: number) => {
		const line = `viewportCoords(page, ${normX.toFixed(3)}, ${normY.toFixed(3)})`;
		console.log(`  ${line}`);
	});

	await page.goto(url, {waitUntil: "domcontentloaded"});

	await page.waitForSelector("canvas", {timeout: 90_000});

	try {
		await page
			.locator('[data-component="Loader"]')
			.waitFor({state: "hidden", timeout: 60_000});
	} catch {
		// proceed anyway
	}

	await page.waitForFunction(
		() => {
			const c = document.querySelector("canvas");
			if (!c) return false;
			const r = c.getBoundingClientRect();
			return r.width > 0 && r.height > 0;
		},
		{timeout: 60_000, polling: 1000},
	);

	await page.evaluate(() => {
		const canvas = document.querySelector("canvas");
		if (!canvas) return;

		canvas.style.cursor = "crosshair";

		canvas.addEventListener("click", (event) => {
			const rect = canvas!.getBoundingClientRect();
			const x = event.clientX - rect.left;
			const y = event.clientY - rect.top;
			(window as any).__pickCoord(x / rect.width, y / rect.height);
		});

		const info = document.createElement("div");
		info.style.cssText =
			"position:fixed;bottom:8px;left:8px;background:rgba(0,0,0,0.7);color:#fff;padding:6px 10px;border-radius:4px;font:14px monospace;pointer-events:none;z-index:9999";
		info.textContent = "Click the 3D scene → coordinates appear in terminal";
		document.body.appendChild(info);
	});

	await page.waitForEvent("close");
	await browser.close();
	console.log("\n  Done.\n");
}

main().catch((err) => {
	console.error("  Error:", err);
	process.exit(1);
});