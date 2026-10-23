import {expect} from "@playwright/test";
import {
	card,
	cardLabels,
	expandFilterGroup,
	filterDropdown,
	loadAllCards,
	moveMouseAway,
	openFilters,
	parameter,
	sdvParameterValue,
	snapshotParameter,
	toggleFilterOption,
} from "../helpers/selectParameters";
import {waitForModelRecomputed} from "../helpers/waitForModelRecomputed";
import type {ScenarioNamedAction} from "./scenarioActions";

/**
 * E2E coverage for SS-10264: a filterable database behind every select
 * display type (`public/example-filterableDatabase-all-types.json`).
 *
 * New behavior pinned here:
 * - `database` works for dropdown, chipgroup, buttonflex, buttongroup,
 *   color, imagedropdown, carousel and checklist (MultiSelect), not only
 *   fullwidthcards and grid.
 * - `filters: []` loads every row and renders no filter UI.
 * - `itemData` next to `database` patches rows field by field: `hidden`
 *   removes a row (also the current value), `displayname` / `color` replace
 *   only that field, keys that are not in the database are ignored. The
 *   patch also applies on the paged scrolling-API path (cards).
 *
 * Databases (`public/example-filterableDatabase-*.json`) hold one row per
 * parameter choice: value, English displayname, tooltip, parity. Hrefs are
 * root-relative and rewritten for branch deploys like in the other database
 * scenario.
 *
 * Parameter setup (model `sdr8euc1`, all StringList):
 * - DropDown: dropdown, no filters, "Four" hidden.
 * - Checklist: MultiSelect, inline single-select Parity filter.
 * - ButtonGroup: displayname patch on "Zwa", unknown key "Vier".
 * - ButtonChipGroup: current value "Ocho" hidden.
 * - ButtonFlex: Parity tag filter, tooltips from the database.
 * - Color: color column, Tone filter, "Red" color patched, "Pink" hidden.
 * - ImageDropDown: CSV with images, Material filter.
 * - SevenCards: carousel over JSON, no filters, "Option 7" hidden.
 * - TenCards: paged cards, no filters, "Option 2" hidden, "Option 1" renamed.
 * - ThreeCards: grid, no filters.
 */
export const scenarioFilterableDatabaseAllTypesNamedActions: ScenarioNamedAction[] =
	[
		{
			name: "dropdown database without filters and hidden patch",
			run: async (page, slug) => {
				const dropdown = parameter(page, "DropDown");
				await expect(dropdown.getByPlaceholder("Filters")).toHaveCount(
					0,
				);
				const input = dropdown.getByRole("combobox");
				await expect(input).toHaveValue("Eins");
				await input.click();
				await expect(page.getByRole("option")).toHaveText([
					"Eins",
					"Zwei",
					"Drei",
				]);
				await waitForModelRecomputed(page, async () => {
					await page.getByRole("option", {name: "Zwei"}).click();
				});
				await expect
					.poll(() => sdvParameterValue(page, "DropDown"))
					.toBe("1");
				await expect(input).toHaveValue("Zwei");
				await moveMouseAway(page);
				await snapshotParameter(page, "DropDown", `${slug}-dropdown`);
			},
		},
		{
			name: "checklist database filters options and commits several",
			run: async (page, slug) => {
				const checklist = parameter(page, "Checklist");
				await expect(
					checklist.locator(".mantine-Pill-root"),
				).toHaveText(["Zwei"]);

				await openFilters(page, "Checklist");
				await filterDropdown(page)
					.getByRole("radio", {name: "even"})
					.click();
				await page.keyboard.press("Escape");

				await checklist.locator(".mantine-MultiSelect-input").click();
				await expect(page.getByRole("option")).toHaveText([
					"Zwei",
					"Vier",
				]);
				await waitForModelRecomputed(page, async () => {
					await page.getByRole("option", {name: "Vier"}).click();
				});
				await expect
					.poll(() => sdvParameterValue(page, "Checklist"))
					.toBe("1,3");
				await snapshotParameter(page, "Checklist", `${slug}-checklist`);
			},
		},
		{
			name: "button group patch replaces one field and ignores unknown keys",
			run: async (page, slug) => {
				const group = parameter(page, "ButtonGroup");
				// "Vier" is patched but not in the database: no extra button.
				await expect(group.getByRole("button")).toHaveText([
					"One",
					"Two (patched)",
					"Three",
				]);
				// The patch only replaced the displayname; the tooltip still
				// comes from the database row.
				await group
					.getByRole("button", {name: "Two (patched)"})
					.hover();
				await expect(page.getByRole("tooltip")).toHaveText(
					"Zwa is two",
				);
				await expect(
					group.getByRole("button", {name: "Two (patched)"}),
				).toHaveAttribute("data-variant", "filled");
				await snapshotParameter(
					page,
					"ButtonGroup",
					`${slug}-buttongroup`,
				);

				await waitForModelRecomputed(page, async () => {
					await group.getByRole("button", {name: "One"}).click();
				});
				await expect
					.poll(() => sdvParameterValue(page, "ButtonGroup"))
					.toBe("0");
			},
		},
		{
			name: "chip group database hides the current value",
			run: async (page, slug) => {
				const chips = parameter(page, "ButtonChipGroup");
				await expect(chips.getByRole("radio")).toHaveCount(9);
				await expect(chips.getByText("Eight")).toHaveCount(0);
				await expect(chips.locator("input:checked")).toHaveCount(0);
				expect(await sdvParameterValue(page, "ButtonChipGroup")).toBe(
					"7",
				);
				await snapshotParameter(
					page,
					"ButtonChipGroup",
					`${slug}-chipgroup-hidden-value`,
				);

				await waitForModelRecomputed(page, async () => {
					await chips.getByText("One", {exact: true}).click();
				});
				await expect
					.poll(() => sdvParameterValue(page, "ButtonChipGroup"))
					.toBe("0");
			},
		},
		{
			name: "button flex database filter narrows buttons",
			run: async (page, slug) => {
				const flex = parameter(page, "ButtonFlex");
				await expect(flex.getByRole("button")).toHaveCount(10);
				await flex
					.getByRole("button", {name: "Two", exact: true})
					.hover();
				await expect(page.getByRole("tooltip")).toHaveText(
					"Due is two",
				);

				await openFilters(page, "ButtonFlex");
				await expandFilterGroup(page, "Parity");
				await toggleFilterOption(page, "even");
				await page.keyboard.press("Escape");
				await expect(flex.locator(".mantine-Button-root")).toHaveText([
					"Two",
					"Four",
					"Six",
					"Eight",
					"Ten",
				]);
				await moveMouseAway(page);
				await snapshotParameter(
					page,
					"ButtonFlex",
					`${slug}-buttonflex`,
				);

				await waitForModelRecomputed(page, async () => {
					await flex.getByRole("button", {name: "Four"}).click();
				});
				await expect
					.poll(() => sdvParameterValue(page, "ButtonFlex"))
					.toBe("3");
			},
		},
		{
			name: "color database patch overrides a color and filters by tone",
			run: async (page, slug) => {
				const swatches = parameter(page, "Color").locator(
					".mantine-Button-root",
				);
				// 16 rows, "Pink" hidden by the patch.
				await expect(swatches).toHaveCount(15);
				// "Red" keeps its row but takes the patched color.
				await expect(swatches.first()).toHaveCSS(
					"background-color",
					"rgb(139, 0, 0)",
				);

				await openFilters(page, "Color");
				await expandFilterGroup(page, "Tone");
				await toggleFilterOption(page, "cool");
				await page.keyboard.press("Escape");
				// Blue, Green, Purple, Cyan, Teal.
				await expect(swatches).toHaveCount(5);
				await snapshotParameter(page, "Color", `${slug}-color`);

				await waitForModelRecomputed(page, async () => {
					await swatches.first().click();
				});
				await expect
					.poll(() => sdvParameterValue(page, "Color"))
					.toBe("1");
			},
		},
		{
			name: "image dropdown database filter narrows options",
			run: async (page, slug) => {
				const imageDropDown = parameter(page, "ImageDropDown");
				const input = imageDropDown.locator(".mantine-InputBase-input");
				await expect(input).toContainText("Aluminium");

				await openFilters(page, "ImageDropDown");
				await expandFilterGroup(page, "Material");
				await toggleFilterOption(page, "wood");
				await page.keyboard.press("Escape");

				await input.click();
				const options = imageDropDown.getByRole("option");
				await expect(options).toHaveCount(2);
				await expect(options.first()).toContainText("Cedar");
				await expect(options.last()).toContainText("Elm");
				await snapshotParameter(
					page,
					"ImageDropDown",
					`${slug}-imagedropdown`,
				);

				await waitForModelRecomputed(page, async () => {
					await options.last().click();
				});
				await expect
					.poll(() => sdvParameterValue(page, "ImageDropDown"))
					.toBe("4");
			},
		},
		{
			name: "carousel database without filters hides a slide",
			run: async (page, slug) => {
				const carousel = parameter(page, "SevenCards");
				await expect(carousel.getByPlaceholder("Filters")).toHaveCount(
					0,
				);
				expect(await cardLabels(page, "SevenCards")).toEqual([
					"Aluminium",
					"Brass",
					"Cedar",
					"Concrete",
					"Elm",
					"Fiber",
				]);
				// Opens on the current value (index 4, Elm).
				const elm = card(page, "SevenCards", "Elm");
				await elm.scrollIntoViewIfNeeded();
				await expect(elm).toBeInViewport({ratio: 1});
				await snapshotParameter(page, "SevenCards", `${slug}-carousel`);

				await carousel
					.locator(".mantine-Carousel-control")
					.last()
					.click();
				const fiber = card(page, "SevenCards", "Fiber");
				await expect(fiber).toBeInViewport({ratio: 1});
				await waitForModelRecomputed(page, async () => {
					await fiber.click();
				});
				await expect
					.poll(() => sdvParameterValue(page, "SevenCards"))
					.toBe("5");
			},
		},
		{
			name: "paged cards apply the patch without filters",
			run: async (page, slug) => {
				await expect(
					parameter(page, "TenCards").getByPlaceholder("Filters"),
				).toHaveCount(0);
				await expect
					.poll(async () => (await cardLabels(page, "TenCards"))[0])
					.toBe("Aluminium (patched)");
				// "Option 2" (Brass) hidden; all other rows still page in.
				expect(await loadAllCards(page, "TenCards")).toEqual([
					"Aluminium (patched)",
					"Cedar",
					"Concrete",
					"Elm",
					"Fiber",
					"Glass",
					"Hemp",
					"Iron",
					"Jute",
				]);
				await snapshotParameter(page, "TenCards", `${slug}-cards`);

				await waitForModelRecomputed(page, async () => {
					await card(page, "TenCards", "Cedar").click();
				});
				await expect
					.poll(() => sdvParameterValue(page, "TenCards"))
					.toBe("2");
			},
		},
		{
			name: "grid database without filters commits",
			run: async (page, slug) => {
				await expect(
					parameter(page, "ThreeCards").getByPlaceholder("Filters"),
				).toHaveCount(0);
				expect(await cardLabels(page, "ThreeCards")).toHaveLength(10);
				await waitForModelRecomputed(page, async () => {
					await card(page, "ThreeCards", "Cedar").click();
				});
				await expect
					.poll(() => sdvParameterValue(page, "ThreeCards"))
					.toBe("2");
				await snapshotParameter(page, "ThreeCards", `${slug}-grid`);
			},
		},
	];
