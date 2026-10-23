import {expect} from "@playwright/test";
import {
	card,
	cardLabels,
	parameter,
	sdvParameterValue,
	snapshotParameter,
} from "../helpers/selectParameters";
import {waitForModelRecomputed} from "../helpers/waitForModelRecomputed";
import type {ScenarioNamedAction} from "./scenarioActions";

/**
 * E2E coverage for select widgets with plain `items` (parameter choices plus
 * theme `itemData`), no database or scrolling API
 * (`public/example-select-widgets.json`, same model as the filterable
 * database scenario).
 *
 * Pins the behavior every select type had before database support was
 * extended to them: rendering `displayname` / `color` / `tooltip` /
 * `imageUrl`, dropping `hidden` items (including a hidden current value),
 * and committing the choice index.
 *
 * Parameter setup (model `sdr8euc1`, all StringList):
 * - DropDown: dropdown (Mantine Select), "Two" renamed, "Four" hidden.
 * - Color: color swatches, "Red" tooltip, "Pink" hidden.
 * - ButtonChipGroup: chipgroup, current value "Ocho" hidden.
 * - ButtonFlex: buttonflex, "Due" renamed with tooltip.
 * - ButtonGroup: buttongroup, "Ans" renamed.
 * - ImageDropDown: imagedropdown with images and descriptions.
 * - Checklist: checklist visualization -> MultiSelect, "Three" hidden.
 * - TenCards: fullwidthcards, local search with `limit: 3`, one hidden.
 * - ThreeCards: grid.
 * - SevenCards: carousel, one hidden.
 */
export const scenarioSelectWidgetsNamedActions: ScenarioNamedAction[] = [
	{
		name: "dropdown renders display names and commits",
		run: async (page, slug) => {
			const input = parameter(page, "DropDown").getByRole("combobox");
			await input.click();
			await expect(page.getByRole("option")).toHaveText([
				"One",
				"Zwei",
				"Three",
			]);
			await waitForModelRecomputed(page, async () => {
				await page.getByRole("option", {name: "Zwei"}).click();
			});
			await expect
				.poll(() => sdvParameterValue(page, "DropDown"))
				.toBe("1");
			await expect(input).toHaveValue("Zwei");
			await snapshotParameter(page, "DropDown", `${slug}-dropdown`);
		},
	},
	{
		name: "color swatches show tooltip and commit",
		run: async (page, slug) => {
			const swatches = parameter(page, "Color").locator(
				".mantine-Button-root",
			);
			// 16 choices, "Pink" hidden.
			await expect(swatches).toHaveCount(15);

			await swatches.first().hover();
			await expect(page.getByRole("tooltip")).toHaveText("A warm red");

			// Second swatch is "Blue", choice index 1.
			await waitForModelRecomputed(page, async () => {
				await swatches.nth(1).click();
			});
			await expect.poll(() => sdvParameterValue(page, "Color")).toBe("1");
			await snapshotParameter(page, "Color", `${slug}-color`);
		},
	},
	{
		name: "chip group hides the current value and commits",
		run: async (page, slug) => {
			const chips = parameter(page, "ButtonChipGroup").getByRole("radio");
			// "Ocho" (the current value, index 7) is hidden: 9 chips, none
			// selected, parameter value unchanged.
			await expect(chips).toHaveCount(9);
			await expect(
				parameter(page, "ButtonChipGroup").getByText("Ocho"),
			).toHaveCount(0);
			await expect(
				parameter(page, "ButtonChipGroup").locator("input:checked"),
			).toHaveCount(0);
			expect(await sdvParameterValue(page, "ButtonChipGroup")).toBe("7");
			await snapshotParameter(
				page,
				"ButtonChipGroup",
				`${slug}-chipgroup-hidden-value`,
			);

			await waitForModelRecomputed(page, async () => {
				await parameter(page, "ButtonChipGroup")
					.getByText("One", {exact: true})
					.click();
			});
			await expect
				.poll(() => sdvParameterValue(page, "ButtonChipGroup"))
				.toBe("0");
			await expect(chips.first()).toBeChecked();
			await snapshotParameter(
				page,
				"ButtonChipGroup",
				`${slug}-chipgroup-committed`,
			);
		},
	},
	{
		name: "button flex shows tooltip and commits",
		run: async (page, slug) => {
			const two = parameter(page, "ButtonFlex").getByRole("button", {
				name: "Two",
				exact: true,
			});
			await two.hover();
			await expect(page.getByRole("tooltip")).toHaveText(
				"Due, Zwei, Zwa, Deux",
			);
			await waitForModelRecomputed(page, async () => {
				await two.click();
			});
			await expect
				.poll(() => sdvParameterValue(page, "ButtonFlex"))
				.toBe("1");
			await snapshotParameter(page, "ButtonFlex", `${slug}-buttonflex`);
		},
	},
	{
		name: "button group marks the selection and commits",
		run: async (page, slug) => {
			const group = parameter(page, "ButtonGroup");
			await expect(group.getByRole("button")).toHaveText([
				"One",
				"Zwa",
				"Drei",
			]);
			// Current value index 1 ("Zwa") is the filled button.
			await expect(
				group.getByRole("button", {name: "Zwa"}),
			).toHaveAttribute("data-variant", "filled");

			await waitForModelRecomputed(page, async () => {
				await group.getByRole("button", {name: "One"}).click();
			});
			await expect
				.poll(() => sdvParameterValue(page, "ButtonGroup"))
				.toBe("0");
			await expect(
				group.getByRole("button", {name: "One"}),
			).toHaveAttribute("data-variant", "filled");
			await snapshotParameter(page, "ButtonGroup", `${slug}-buttongroup`);
		},
	},
	{
		name: "image dropdown renders options and commits",
		run: async (page, slug) => {
			const input = parameter(page, "ImageDropDown").locator(
				".mantine-InputBase-input",
			);
			await expect(input).toContainText("Apples");
			await input.click();
			const options = parameter(page, "ImageDropDown").getByRole(
				"option",
			);
			await expect(options).toHaveCount(7);
			await expect(options.last()).toContainText("Grapes");
			await expect(options.last()).toContainText("Fruit 7");
			await snapshotParameter(
				page,
				"ImageDropDown",
				`${slug}-imagedropdown-open`,
			);

			await waitForModelRecomputed(page, async () => {
				await options.last().click();
			});
			await expect
				.poll(() => sdvParameterValue(page, "ImageDropDown"))
				.toBe("6");
			await expect(input).toContainText("Grapes");
		},
	},
	{
		name: "checklist multiselect hides items and commits several",
		run: async (page, slug) => {
			const checklist = parameter(page, "Checklist");
			await expect(checklist.locator(".mantine-Pill-root")).toHaveText([
				"Two",
			]);
			// The input field sits under the pills wrapper; click the wrapper.
			await checklist.locator(".mantine-MultiSelect-input").click();
			await expect(page.getByRole("option")).toHaveText([
				"One",
				"Two",
				"Vier",
			]);

			await waitForModelRecomputed(page, async () => {
				await page.getByRole("option", {name: "One"}).click();
			});
			await expect
				.poll(() => sdvParameterValue(page, "Checklist"))
				.toBe("0,1");
			await expect(checklist.locator(".mantine-Pill-root")).toHaveCount(
				2,
			);
			await snapshotParameter(page, "Checklist", `${slug}-checklist`);
		},
	},
	{
		name: "plain cards search locally with limit and commit",
		run: async (page, slug) => {
			// 10 choices, "Lemons" hidden; no limit without a search term.
			expect(await cardLabels(page, "TenCards")).toEqual([
				"Apples",
				"Bananas",
				"Cherries",
				"Dates",
				"Elderberries",
				"Figs",
				"Grapes",
				"Honeydew",
				"Kiwis",
			]);
			await expect(card(page, "TenCards", "Figs")).toContainText(
				"Fruit 6",
			);

			// Search matches value, displayname and description; `limit: 3`
			// caps the result.
			await parameter(page, "TenCards")
				.getByPlaceholder("Search")
				.fill("e");
			await expect
				.poll(() => cardLabels(page, "TenCards"))
				.toEqual(["Apples", "Cherries", "Dates"]);
			await snapshotParameter(page, "TenCards", `${slug}-cards-search`);

			await waitForModelRecomputed(page, async () => {
				await card(page, "TenCards", "Dates").click();
			});
			await expect
				.poll(() => sdvParameterValue(page, "TenCards"))
				.toBe("3");
		},
	},
	{
		name: "plain grid commits",
		run: async (page, slug) => {
			expect(await cardLabels(page, "ThreeCards")).toEqual([
				"Small",
				"Medium",
				"Large",
			]);
			await waitForModelRecomputed(page, async () => {
				await card(page, "ThreeCards", "Large").click();
			});
			await expect
				.poll(() => sdvParameterValue(page, "ThreeCards"))
				.toBe("2");
			await snapshotParameter(page, "ThreeCards", `${slug}-grid`);
		},
	},
	{
		name: "carousel hides items and commits",
		run: async (page, slug) => {
			// 7 choices, "Grapes" hidden.
			expect(await cardLabels(page, "SevenCards")).toEqual([
				"Apples",
				"Bananas",
				"Cherries",
				"Dates",
				"Elderberries",
				"Figs",
			]);
			// The carousel opens on the current value (index 4, Elderberries).
			const elderberries = card(page, "SevenCards", "Elderberries");
			await elderberries.scrollIntoViewIfNeeded();
			await expect(elderberries).toBeInViewport({ratio: 1});
			await expect(
				card(page, "SevenCards", "Apples"),
			).not.toBeInViewport();
			await snapshotParameter(page, "SevenCards", `${slug}-carousel`);

			// Next arrow brings Figs fully into view; it commits index 5.
			await parameter(page, "SevenCards")
				.locator(".mantine-Carousel-control")
				.last()
				.click();
			const figs = card(page, "SevenCards", "Figs");
			await expect(figs).toBeInViewport({ratio: 1});
			await waitForModelRecomputed(page, async () => {
				await figs.click();
			});
			await expect
				.poll(() => sdvParameterValue(page, "SevenCards"))
				.toBe("5");
			await snapshotParameter(
				page,
				"SevenCards",
				`${slug}-carousel-committed`,
			);
		},
	},
];
