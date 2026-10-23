import {expect, Page} from "@playwright/test";
import {
	card,
	cardLabels,
	expandFilterGroup,
	filterDropdown,
	filterPills,
	loadAllCards,
	openFilters,
	parameter,
	scrollToBottom,
	sdvParameterValue,
	snapshotParameter,
	toggleFilterOption,
} from "../helpers/selectParameters";
import {waitForModelRecomputed} from "../helpers/waitForModelRecomputed";
import type {ScenarioNamedAction} from "./scenarioActions";

/**
 * E2E coverage for database-backed select parameters
 * (`public/example-filterableDatabase-selects.json`).
 *
 * The fake databases live in `public/example-filterableDatabase.csv` /
 * `.json` / `-invalid.json` and are referenced by root-relative hrefs, which
 * work as-is on the local dev server. On branch deploys the app lives under
 * `/v1/main/<branch>/`, so the scenario's `beforeGoto` rewrites those hrefs
 * against the settings file URL (`routeSettingsHrefsToAppBase`). `data:`
 * hrefs are not an option: the deployed CSP blocks them in `connect-src`.
 *
 * The databases emulate folders with hierarchical categories: every row
 * lists its folder path and all ancestors (`natural;natural/wood;
 * natural/wood/softwood`) in a multivalued column, so selecting a parent
 * folder also matches everything below it. `columnLabel` supplies the
 * readable folder names ("Natural", "Wood", "Softwood").
 *
 * Parameter setup (model `sdr8euc1`, all StringList):
 * - TenCards: CSV, fullwidthcards, search, `limit: 4` paging, tooltip
 *   mapping, inline text filter, Material tag filter, Category folder
 *   filter.
 * - ThreeCards: CSV, grid, single-select inline color filter, Material
 *   restricted by `filterValues`. Only choices Option 1-3 exist.
 * - SevenCards: JSON with inferred columns, nested `data`, folder arrays;
 *   grid paging (`limit: 2` in a 240px panel) and search.
 * - Color: small JSON database with "search:" suggestion rows (search
 *   history links) and an unlabelled single-select accordion filter.
 * - ButtonGroup: JSON source that is not a database (error state).
 * - DropDown: e-commerce `source` in fullwidthcards, served by the built-in
 *   95-item dummy scrolling API outside the platform.
 * - ImageDropDown: the same dummy scrolling API in grid layout (own source
 *   name, so its search state is separate from DropDown).
 *
 * Widgets commit item keys; the parameter stores the choice index. Committed
 * values are read via `window.SDV` (same technique as `findSdvParameter` in
 * the e-commerce helpers).
 */

/** The list shows whole pages again, starting with `first`. */
async function expectFirstPages(
	page: Page,
	name: string,
	first: string,
	pageSize: number,
) {
	await expect
		.poll(async () => {
			const labels = await cardLabels(page, name);
			return labels[0] === first && labels.length % pageSize === 0;
		})
		.toBe(true);
}

export const scenarioFilterableDatabaseNamedActions: ScenarioNamedAction[] = [
	{
		// TenCards: 4 cards per page; scrolling inside the 360px panel loads
		// the rest through the filterable-database scrolling API. The first
		// page does not fill the panel, so the sentinel may already have
		// loaded page 2 on arrival: assert whole pages, not an exact count.
		name: "database cards page through all rows",
		run: async (page, slug) => {
			await expect
				.poll(async () => (await cardLabels(page, "TenCards")).length)
				.toBeGreaterThanOrEqual(4);
			const initial = await cardLabels(page, "TenCards");
			expect(initial.length % 4).toBe(0);
			expect(initial.slice(0, 4)).toEqual([
				"Aluminium",
				"Brass",
				"Cedar",
				"Concrete",
			]);

			expect(await loadAllCards(page, "TenCards")).toEqual([
				"Aluminium",
				"Brass",
				"Cedar",
				"Concrete",
				"Elm",
				"Fiber",
				"Glass",
				"Hemp",
				"Iron",
				"Jute",
			]);
			await snapshotParameter(
				page,
				"TenCards",
				`${slug}-tencards-all-rows`,
			);

			// Mapped columns: displayname (col 1) and description (col 6).
			await expect(card(page, "TenCards", "Aluminium")).toContainText(
				"12",
			);
		},
	},
	{
		// Card click commits the item key; the parameter stores its choice
		// index. Filtering the committed item out keeps the value.
		name: "database card commits and survives filtering",
		run: async (page, slug) => {
			await waitForModelRecomputed(page, async () => {
				await card(page, "TenCards", "Cedar").click();
			});
			await expect
				.poll(() => sdvParameterValue(page, "TenCards"))
				.toBe("2");
			await snapshotParameter(
				page,
				"TenCards",
				`${slug}-tencards-committed`,
			);

			await openFilters(page, "TenCards");
			await expandFilterGroup(page, "Material");
			await toggleFilterOption(page, "metal");
			await expect
				.poll(() => cardLabels(page, "TenCards"))
				.toEqual(["Aluminium", "Brass", "Iron"]);
			expect(await sdvParameterValue(page, "TenCards")).toBe("2");
			await snapshotParameter(
				page,
				"TenCards",
				`${slug}-tencards-committed-filtered-out`,
			);
		},
	},
	{
		// Tag filter: OR within a group, removable pill, list restored.
		name: "database tag filter narrows and restores",
		run: async (page, slug) => {
			await openFilters(page, "TenCards");
			await expandFilterGroup(page, "Material");
			await toggleFilterOption(page, "wood");
			await expect
				.poll(() => cardLabels(page, "TenCards"))
				.toEqual(["Cedar", "Elm"]);

			await toggleFilterOption(page, "glass");
			await expect
				.poll(() => cardLabels(page, "TenCards"))
				.toEqual(["Cedar", "Elm", "Glass"]);

			await expect(filterPills(page, "TenCards")).toHaveText([
				"Material: wood",
				"Material: glass",
			]);
			await snapshotParameter(
				page,
				"TenCards",
				`${slug}-tencards-material-filter`,
			);
			await filterPills(page, "TenCards")
				.filter({hasText: "wood"})
				.locator(".mantine-Pill-remove")
				.click();
			await expect
				.poll(() => cardLabels(page, "TenCards"))
				.toEqual(["Glass"]);

			await filterPills(page, "TenCards")
				.locator(".mantine-Pill-remove")
				.click();
			await expect(filterPills(page, "TenCards")).toHaveCount(0);
			// Paging restarts from the first page; the sentinel may already have
			// appended page 2, so assert whole pages, not an exact count.
			await expectFirstPages(page, "TenCards", "Aluminium", 4);
		},
	},
	{
		// Folder categories: a parent folder matches all descendants, a leaf
		// matches only its rows; pills and options show the columnLabel.
		name: "database folder categories filter hierarchically",
		run: async (page, slug) => {
			await openFilters(page, "TenCards");
			await expandFilterGroup(page, "Category");

			// Options sorted by folder path, labelled by columnLabel.
			const categoryOptions = filterDropdown(page)
				.locator(".mantine-Accordion-item")
				.filter({hasText: "Category"})
				.locator("label");
			await expect(categoryOptions).toHaveText([
				"Metals",
				"Ferrous metals",
				"Non-ferrous metals",
				"Natural",
				"Plant fibers",
				"Wood",
				"Hardwood",
				"Softwood",
				"Synthetic",
				"Mineral",
				"Synthetic textiles",
			]);
			await snapshotParameter(
				page,
				"TenCards",
				`${slug}-tencards-folder-options`,
			);

			// Parent folder: everything below "natural".
			await toggleFilterOption(page, "Natural");
			await expect
				.poll(() => cardLabels(page, "TenCards"))
				.toEqual(["Cedar", "Elm", "Hemp", "Jute"]);
			await expect(filterPills(page, "TenCards")).toHaveText([
				"Category: Natural",
			]);
			await snapshotParameter(
				page,
				"TenCards",
				`${slug}-tencards-folder-parent`,
			);

			// Leaf folder only.
			await toggleFilterOption(page, "Natural");
			await toggleFilterOption(page, "Softwood");
			await expect
				.poll(() => cardLabels(page, "TenCards"))
				.toEqual(["Cedar"]);
			await snapshotParameter(
				page,
				"TenCards",
				`${slug}-tencards-folder-leaf`,
			);

			// Middle folder plus a sibling top-level folder (OR within group).
			await toggleFilterOption(page, "Softwood");
			await toggleFilterOption(page, "Wood");
			await toggleFilterOption(page, "Ferrous metals");
			await expect
				.poll(() => cardLabels(page, "TenCards"))
				.toEqual(["Cedar", "Elm", "Iron"]);
			await snapshotParameter(
				page,
				"TenCards",
				`${slug}-tencards-folder-mixed`,
			);
		},
	},
	{
		// Groups combine with AND: folder "Natural" and material "textile".
		name: "database filter groups combine with and",
		run: async (page, slug) => {
			await openFilters(page, "TenCards");
			await expandFilterGroup(page, "Category");
			await toggleFilterOption(page, "Natural");
			await expandFilterGroup(page, "Material");
			await toggleFilterOption(page, "textile");
			await expect
				.poll(() => cardLabels(page, "TenCards"))
				.toEqual(["Hemp", "Jute"]);
			await snapshotParameter(
				page,
				"TenCards",
				`${slug}-tencards-filters-and`,
			);
		},
	},
	{
		// Select-all toggles a whole group; unchecking one option leaves the
		// group indeterminate and excludes that option.
		name: "database select all toggles a group",
		run: async (page, slug) => {
			await openFilters(page, "TenCards");
			const selectAll = filterDropdown(page).getByLabel(
				"Select all Material",
			);
			await selectAll.check();
			await expect(filterPills(page, "TenCards")).toHaveCount(5);
			expect(await loadAllCards(page, "TenCards")).toHaveLength(10);

			await expandFilterGroup(page, "Material");
			await toggleFilterOption(page, "glass");
			await expect(selectAll).toHaveAttribute(
				"data-indeterminate",
				"true",
			);
			expect(await loadAllCards(page, "TenCards")).not.toContain("Glass");
			expect(await loadAllCards(page, "TenCards")).toHaveLength(9);
			await snapshotParameter(
				page,
				"TenCards",
				`${slug}-tencards-select-all-indeterminate`,
			);

			await selectAll.click();
			await expect(filterPills(page, "TenCards")).toHaveCount(5);
			await selectAll.click();
			await expect(filterPills(page, "TenCards")).toHaveCount(0);
		},
	},
	{
		// Typing in the filter field narrows the option list by label.
		name: "database filter options are searchable",
		run: async (page, slug) => {
			await openFilters(page, "TenCards");
			await expandFilterGroup(page, "Material");
			await expandFilterGroup(page, "Category");
			await parameter(page, "TenCards")
				.getByPlaceholder("Filters")
				.fill("wood");
			// Options keep their order (sorted by value, i.e. folder path).
			await expect(filterDropdown(page).locator("label")).toHaveText([
				"wood",
				"Wood",
				"Hardwood",
				"Softwood",
			]);
			await snapshotParameter(
				page,
				"TenCards",
				`${slug}-tencards-filter-option-search`,
			);
		},
	},
	{
		// Inline text filter: substring match on the Name column (debounced).
		name: "database text filter matches substrings",
		run: async (page, slug) => {
			await openFilters(page, "TenCards");
			await filterDropdown(page).getByRole("textbox").fill("ass");
			await expect
				.poll(() => cardLabels(page, "TenCards"))
				.toEqual(["Brass", "Glass"]);
			await expect(filterPills(page, "TenCards")).toHaveText([
				"Name: ass",
			]);
			await snapshotParameter(
				page,
				"TenCards",
				`${slug}-tencards-text-filter`,
			);
		},
	},
	{
		// Search box: client-side search over item key and displayname.
		name: "database search narrows cards",
		run: async (page, slug) => {
			await parameter(page, "TenCards")
				.getByPlaceholder("Search")
				.fill("Iron");
			await expect
				.poll(() => cardLabels(page, "TenCards"))
				.toEqual(["Iron"]);
			await snapshotParameter(
				page,
				"TenCards",
				`${slug}-tencards-search`,
			);
			await parameter(page, "TenCards")
				.getByPlaceholder("Search")
				.fill("");
			// Paging restarts from the first page; the sentinel may already have
			// appended page 2, so assert whole pages, not an exact count.
			await expectFirstPages(page, "TenCards", "Aluminium", 4);
		},
	},
	{
		// ThreeCards: inline color filter is single-select (radio) with
		// swatches; Material lists only `filterValues`. Grid commits keys.
		name: "database grid color filter and filter values",
		run: async (page, slug) => {
			expect(await loadAllCards(page, "ThreeCards")).toHaveLength(10);

			await openFilters(page, "ThreeCards");
			await expect(
				filterDropdown(page).locator(".mantine-ColorSwatch-root"),
			).not.toHaveCount(0);
			await filterDropdown(page)
				.getByRole("radio", {name: "red"})
				.click();
			await expect
				.poll(() => cardLabels(page, "ThreeCards"))
				.toEqual(["Fiber", "Jute"]);
			// Radio: picking another color replaces the first one.
			await filterDropdown(page)
				.getByRole("radio", {name: "blue"})
				.click();
			await expect
				.poll(() => cardLabels(page, "ThreeCards"))
				.toEqual(["Glass"]);
			await expect(filterPills(page, "ThreeCards")).toHaveText([
				"Color: blue",
			]);
			await snapshotParameter(
				page,
				"ThreeCards",
				`${slug}-threecards-color-filter`,
			);
			await filterPills(page, "ThreeCards")
				.locator(".mantine-Pill-remove")
				.click();

			await openFilters(page, "ThreeCards");
			await expandFilterGroup(page, "Material");
			await expect(
				filterDropdown(page)
					.locator(".mantine-Accordion-item")
					.filter({hasText: "Material"})
					.locator("label"),
			).toHaveText(["metal", "wood"]);
			await snapshotParameter(
				page,
				"ThreeCards",
				`${slug}-threecards-filter-values`,
			);
			await page.keyboard.press("Escape");

			// Only Option 1-3 are choices of ThreeCards; Cedar is Option 3.
			await waitForModelRecomputed(page, async () => {
				await card(page, "ThreeCards", "Cedar").click();
			});
			await expect
				.poll(() => sdvParameterValue(page, "ThreeCards"))
				.toBe("2");
			await snapshotParameter(
				page,
				"ThreeCards",
				`${slug}-threecards-committed`,
			);
		},
	},
	{
		// SevenCards: JSON rows with nested `data`; folder arrays become
		// multivalued cells. Description maps the nested stock column.
		name: "database json rows filter by folder and commit",
		run: async (page, slug) => {
			// Paged by 2 (see the grid paging test); load every row first.
			expect(await loadAllCards(page, "SevenCards")).toEqual([
				"Aluminium",
				"Brass",
				"Cedar",
				"Concrete",
				"Elm",
				"Fiber",
				"Glass",
			]);
			await expect(card(page, "SevenCards", "Glass")).toContainText("15");
			await snapshotParameter(
				page,
				"SevenCards",
				`${slug}-sevencards-json`,
			);

			await openFilters(page, "SevenCards");
			await expandFilterGroup(page, "Category");
			await toggleFilterOption(page, "Mineral");
			await expect
				.poll(() => cardLabels(page, "SevenCards"))
				.toEqual(["Concrete", "Glass"]);
			await snapshotParameter(
				page,
				"SevenCards",
				`${slug}-sevencards-folder-filter`,
			);
			await page.keyboard.press("Escape");

			await waitForModelRecomputed(page, async () => {
				await card(page, "SevenCards", "Glass").click();
			});
			await expect
				.poll(() => sdvParameterValue(page, "SevenCards"))
				.toBe("6");
			await snapshotParameter(
				page,
				"SevenCards",
				`${slug}-sevencards-committed`,
			);
		},
	},
	{
		// SevenCards grid: 2 cards per page in a 240px panel, so the first
		// page(s) cannot hold all 7 rows and scrolling must load the rest.
		// Grid has its own search input and scroll sentinel, separate from
		// fullwidthcards.
		name: "database grid pages and searches",
		run: async (page, slug) => {
			await expect
				.poll(async () => (await cardLabels(page, "SevenCards")).length)
				.toBeGreaterThanOrEqual(2);
			const initial = await cardLabels(page, "SevenCards");
			expect(initial.length % 2).toBe(0);
			expect(initial.length).toBeLessThan(7);
			expect(initial.slice(0, 2)).toEqual(["Aluminium", "Brass"]);

			await scrollToBottom(page, "SevenCards");
			await expect
				.poll(async () => (await cardLabels(page, "SevenCards")).length)
				.toBeGreaterThan(initial.length);
			expect(await loadAllCards(page, "SevenCards")).toEqual([
				"Aluminium",
				"Brass",
				"Cedar",
				"Concrete",
				"Elm",
				"Fiber",
				"Glass",
			]);
			await snapshotParameter(
				page,
				"SevenCards",
				`${slug}-sevencards-grid-all-rows`,
			);

			await parameter(page, "SevenCards")
				.getByPlaceholder("Search")
				.fill("Glass");
			await expect
				.poll(() => cardLabels(page, "SevenCards"))
				.toEqual(["Glass"]);
			await snapshotParameter(
				page,
				"SevenCards",
				`${slug}-sevencards-grid-search`,
			);

			// Clearing the search restarts paging from the first page.
			await parameter(page, "SevenCards")
				.getByPlaceholder("Search")
				.fill("");
			await expect
				.poll(async () => (await cardLabels(page, "SevenCards"))[0])
				.toBe("Aluminium");
			expect((await cardLabels(page, "SevenCards")).length).toBeLessThan(
				7,
			);
		},
	},
	{
		// `itemDataDefinition.tooltip` (dataId column) shows on image hover.
		name: "database card tooltip",
		run: async (page, slug) => {
			await card(page, "TenCards", "Cedar").locator("img").hover();
			await expect(page.getByRole("tooltip")).toHaveText("D-1003");
			await snapshotParameter(
				page,
				"TenCards",
				`${slug}-tencards-tooltip`,
			);
		},
	},
	{
		// Color: rows whose value starts with "search:" do not commit; they
		// push a search term. Terms stack (AND) and show as links; clicking a
		// link drops it and every term after it.
		name: "database search history links",
		run: async (page, slug) => {
			const all = [
				"Red metal",
				"Blue glass",
				"Green wood",
				"Gold metal",
				"More metal",
				"Gold metal finish",
			];
			await expect.poll(() => cardLabels(page, "Color")).toEqual(all);
			const valueBefore = await sdvParameterValue(page, "Color");

			await card(page, "Color", "More metal").click();
			await expect
				.poll(() => cardLabels(page, "Color"))
				.toEqual([
					"Red metal",
					"Gold metal",
					"More metal",
					"Gold metal finish",
				]);
			await card(page, "Color", "Gold metal finish").click();
			await expect
				.poll(() => cardLabels(page, "Color"))
				.toEqual(["Gold metal", "Gold metal finish"]);
			const links = parameter(page, "Color").locator("a");
			await expect(links).toHaveText(["metal", "Gold"]);
			await snapshotParameter(
				page,
				"Color",
				`${slug}-color-search-history`,
			);

			// Suggestion clicks never commit a parameter value.
			expect(await sdvParameterValue(page, "Color")).toBe(valueBefore);

			// Dropping "Gold" keeps "metal"; dropping "metal" clears all.
			await links.filter({hasText: "Gold"}).click();
			await expect(links).toHaveText(["metal"]);
			await expect
				.poll(() => cardLabels(page, "Color"))
				.toEqual([
					"Red metal",
					"Gold metal",
					"More metal",
					"Gold metal finish",
				]);
			await links.filter({hasText: "metal"}).click();
			await expect(links).toHaveCount(0);
			await expect.poll(() => cardLabels(page, "Color")).toEqual(all);
		},
	},
	{
		// Color: a filter without `label` is titled "Filter 1"; with
		// `multiple: false` an accordion group renders radios.
		name: "database single-select accordion filter",
		run: async (page, slug) => {
			await openFilters(page, "Color");
			await expandFilterGroup(page, "Filter 1");
			await filterDropdown(page)
				.getByRole("radio", {name: "glass"})
				.click();
			await expect
				.poll(() => cardLabels(page, "Color"))
				.toEqual(["Blue glass"]);
			await filterDropdown(page)
				.getByRole("radio", {name: "wood"})
				.click();
			await expect
				.poll(() => cardLabels(page, "Color"))
				.toEqual(["Green wood"]);
			await expect(filterPills(page, "Color")).toHaveText([
				"Filter 1: wood",
			]);
			await snapshotParameter(
				page,
				"Color",
				`${slug}-color-single-select-accordion`,
			);
		},
	},
	{
		// A source that is not a database shows the engine error instead of
		// cards.
		name: "database load error is shown",
		run: async (page, slug) => {
			await expect(parameter(page, "ButtonGroup")).toContainText(
				'JSON database is missing "rows"',
			);
			await expect(
				parameter(page, "ButtonGroup").locator(".mantine-Card-root"),
			).toHaveCount(0);
			await snapshotParameter(
				page,
				"ButtonGroup",
				`${slug}-buttongroup-error`,
			);
		},
	},
	{
		// DropDown: e-commerce `source` scrolling API (dummy outside the
		// platform, pages of 10; `limit` does not reach it). Keys are not
		// choices, so nothing is committed; paging and search are the shared
		// async contract.
		name: "source scrolling api pages and searches",
		run: async (page, slug) => {
			await expect
				.poll(async () => (await cardLabels(page, "DropDown")).length)
				.toBe(10);

			await scrollToBottom(page, "DropDown");
			await expect
				.poll(async () => (await cardLabels(page, "DropDown")).length)
				.toBe(20);
			await snapshotParameter(
				page,
				"DropDown",
				`${slug}-dropdown-scrolled`,
			);

			// "Option 05" matches exactly Option 050-059.
			await parameter(page, "DropDown")
				.getByPlaceholder("Search")
				.fill("Option 05");
			await expect
				.poll(() => cardLabels(page, "DropDown"))
				.toEqual(Array.from({length: 10}, (_, i) => `Option 05${i}`));
			await snapshotParameter(
				page,
				"DropDown",
				`${slug}-dropdown-search`,
			);
		},
	},
	{
		// ImageDropDown: the same dummy scrolling API rendered as a grid.
		// The first page may not fill the panel, so the sentinel can load
		// page 2 on arrival: assert whole pages of 10, then growth on scroll.
		name: "source scrolling api pages and searches in grid",
		run: async (page, slug) => {
			await expect
				.poll(
					async () =>
						(await cardLabels(page, "ImageDropDown")).length,
				)
				.toBeGreaterThanOrEqual(10);
			const initial = await cardLabels(page, "ImageDropDown");
			expect(initial.length % 10).toBe(0);
			expect(initial.slice(0, 2)).toEqual(["Option 000", "Option 001"]);

			await scrollToBottom(page, "ImageDropDown");
			await expect
				.poll(
					async () =>
						(await cardLabels(page, "ImageDropDown")).length,
				)
				.toBeGreaterThan(initial.length);
			await snapshotParameter(
				page,
				"ImageDropDown",
				`${slug}-imagedropdown-grid-scrolled`,
			);

			await parameter(page, "ImageDropDown")
				.getByPlaceholder("Search")
				.fill("Option 05");
			await expect
				.poll(() => cardLabels(page, "ImageDropDown"))
				.toEqual(Array.from({length: 10}, (_, i) => `Option 05${i}`));
			await snapshotParameter(
				page,
				"ImageDropDown",
				`${slug}-imagedropdown-grid-search`,
			);
		},
	},
];
