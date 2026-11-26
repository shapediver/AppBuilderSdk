import {expect, Page} from "@playwright/test";
import {getParameterElement} from "../helpers/getParameterElement";

const FAILURE_MESSAGE = "E2E: the computation failed for this output.";

/**
 * Let every output of the following computations fail with the same message,
 * like the geometry backend does when a computation fails. Returns the
 * number of outputs that were marked as failed.
 */
async function failComputations(page: Page) {
	const failed = {outputs: 0};
	await page.route(
		(url) => url.pathname.includes("/output"),
		async (route) => {
			const response = await route.fetch();
			let body: any;
			try {
				body = await response.json();
			} catch {
				return route.fulfill({response});
			}
			const outputs = Object.values(body?.outputs ?? {}) as any[];
			for (const output of outputs) {
				output.status_computation = "timeout";
				output.msg = FAILURE_MESSAGE;
			}
			failed.outputs = Math.max(failed.outputs, outputs.length);
			await route.fulfill({response, json: body});
		},
	);
	return failed;
}

/**
 * SS-10189: a failed computation sets the same message on every failed
 * output; the notification must show it once.
 */
export async function failedComputationShowsMessageOnce(page: Page) {
	const failed = await failComputations(page);

	const input = getParameterElement(page, "Block to Edit").getByRole(
		"textbox",
	);
	await input.fill("2");
	await input.press("Enter");

	const notification = page
		.locator(".mantine-Notification-root")
		.filter({hasText: "Computation failed"});
	await expect(notification).toHaveCount(1, {timeout: 60_000});
	await expect(notification).toContainText("(timeout)");

	// several outputs carried the message, the notification shows it once
	expect(failed.outputs).toBeGreaterThan(1);
	const text = (await notification.innerText()) ?? "";
	expect(text.split(FAILURE_MESSAGE).length - 1).toBe(1);
}
