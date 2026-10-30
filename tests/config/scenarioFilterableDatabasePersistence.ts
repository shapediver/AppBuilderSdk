import {expect, Page} from "@playwright/test";
import {
	expectAppShellNavbarCollapsed,
	getAppShellBurger,
	openAppShellNavbar,
	setViewportBelowNavbarBreakpoint,
} from "../helpers/appBuilderContainers";
import {
	cardLabels,
	expandFilterGroup,
	filterDropdown,
	filterPills,
	loadAllCards,
	openFilters,
	parameter,
	toggleFilterOption,
} from "../helpers/selectParameters";
import type {ScenarioNamedAction} from "./scenarioActions";

/**
 * SS-10229: a filterable database control keeps its view while it is
 * unmounted or idle (`public/example-filterableDatabase-persistence.json`,
 * model `sdr8euc1`, same databases as example-filterableDatabase-selects).
 *
 * Layout:
 * - top: "Close catalog" / "Open catalog" (`setContainerVisibility` on left).
 * - left: tabs "Catalog" (TenCards: CSV, fullwidthcards, 2 per page in a
 *   220px panel) and "Notes". Inactive tabs unmount.
 * - toolbar: "Grid catalog" widgets popover with SevenCards (JSON, grid,
 *   2 per page in a 240px panel). Closing the popover unmounts it.
 * - Below the AppShell breakpoint, left lives in the burger navbar, which
 *   keeps its content mounted but idle (Activity) while collapsed.
 *
 * Every case sets filters, search text, loaded pages, and a scroll offset,
 * hides the control, shows it again, and expects the same view. Before
 * SS-10229 the list started over: no filters, empty search, first page,
 * scrolled to the top.
 */

/** What the user sees of a database-backed card list. */
interface ListView {
	labels: string[];
	pills: string[];
	search: string;
	scrollTop: number;
}

function scrollRoot(page: Page, name: string) {
	return parameter(page, name).locator("div[style*='overflow-y']").first();
}

async function readView(page: Page, name: string): Promise<ListView> {
	return {
		labels: await cardLabels(page, name),
		pills: await filterPills(page, name).allInnerTexts(),
		search: await parameter(page, name)
			.getByPlaceholder("Search")
			.inputValue(),
		scrollTop: await scrollRoot(page, name).evaluate((el) => el.scrollTop),
	};
}

/** Scroll the list to an offset the way a user would (fires `scroll`). */
async function scrollListTo(page: Page, name: string, top: number) {
	await scrollRoot(page, name).evaluate((el, value) => {
		el.scrollTop = value;
		el.dispatchEvent(new Event("scroll"));
	}, top);
}

async function search(page: Page, name: string, text: string) {
	await parameter(page, name).getByPlaceholder("Search").fill(text);
}

/**
 * TenCards: Material metal + wood + textile, search "e" (no item key
 * "Option N" contains an "e"), every page loaded, scrolled to the middle.
 */
async function prepareTenCards(page: Page): Promise<ListView> {
	await expect
		.poll(async () => (await cardLabels(page, "TenCards")).length)
		.toBeGreaterThanOrEqual(2);

	await openFilters(page, "TenCards");
	await expandFilterGroup(page, "Material");
	for (const option of ["metal", "wood", "textile"]) {
		await toggleFilterOption(page, option);
	}
	await page.keyboard.press("Escape");
	await expect(filterDropdown(page)).toHaveCount(0);

	await search(page, "TenCards", "e");
	await expect
		.poll(async () => (await cardLabels(page, "TenCards"))[0])
		.toBe("Cedar");
	expect(await loadAllCards(page, "TenCards")).toEqual([
		"Cedar",
		"Elm",
		"Fiber",
		"Hemp",
		"Jute",
	]);

	await scrollListTo(page, "TenCards", 150);
	const view = await readView(page, "TenCards");
	expect(view.pills).toEqual([
		"Material: metal",
		"Material: wood",
		"Material: textile",
	]);
	expect(view.search).toBe("e");
	expect(view.scrollTop).toBeGreaterThan(100);
	return view;
}

/** SevenCards: search "e", every page loaded, scrolled to the bottom. */
async function prepareSevenCards(page: Page): Promise<ListView> {
	await expect
		.poll(async () => (await cardLabels(page, "SevenCards")).length)
		.toBeGreaterThanOrEqual(2);

	await search(page, "SevenCards", "e");
	await expect
		.poll(async () => (await cardLabels(page, "SevenCards"))[0])
		.toBe("Cedar");
	expect(await loadAllCards(page, "SevenCards")).toEqual([
		"Cedar",
		"Concrete",
		"Elm",
		"Fiber",
	]);

	await scrollListTo(page, "SevenCards", 10_000);
	const view = await readView(page, "SevenCards");
	expect(view.search).toBe("e");
	return view;
}

/** The control shows exactly what it showed before it was hidden. */
async function expectSameView(page: Page, name: string, before: ListView) {
	await expect.poll(() => cardLabels(page, name)).toEqual(before.labels);
	expect(await filterPills(page, name).allInnerTexts()).toEqual(before.pills);
	await expect(parameter(page, name).getByPlaceholder("Search")).toHaveValue(
		before.search,
	);
	await expect
		.poll(() => scrollRoot(page, name).evaluate((el) => el.scrollTop))
		.toBeCloseTo(before.scrollTop, -1);
}

function toolbarButton(page: Page) {
	return page.getByRole("button", {name: "Grid catalog"});
}

export const scenarioFilterableDatabasePersistenceNamedActions: ScenarioNamedAction[] =
	[
		{
			name: "database view survives closing the container",
			run: async (page) => {
				const before = await prepareTenCards(page);

				await page.getByRole("button", {name: "Close catalog"}).click();
				await expect(parameter(page, "TenCards")).toHaveCount(0);
				await page.getByRole("button", {name: "Open catalog"}).click();

				await expectSameView(page, "TenCards", before);
			},
		},
		{
			name: "database view survives switching tabs",
			run: async (page) => {
				const before = await prepareTenCards(page);

				await page.getByRole("tab", {name: "Notes"}).click();
				await expect(page.getByText("Notes tab")).toBeVisible();
				await expect(parameter(page, "TenCards")).toHaveCount(0);
				await page.getByRole("tab", {name: "Catalog"}).click();

				await expectSameView(page, "TenCards", before);
			},
		},
		{
			name: "database view survives closing the toolbar popover",
			run: async (page) => {
				await toolbarButton(page).click();
				const before = await prepareSevenCards(page);

				await toolbarButton(page).click();
				await expect(parameter(page, "SevenCards")).toHaveCount(0);
				await toolbarButton(page).click();

				await expectSameView(page, "SevenCards", before);
			},
		},
		{
			name: "database view survives collapsing the navbar",
			run: async (page) => {
				await setViewportBelowNavbarBreakpoint(page);
				await openAppShellNavbar(page);
				const before = await prepareTenCards(page);

				await getAppShellBurger(page).click();
				await expectAppShellNavbarCollapsed(page);
				await openAppShellNavbar(page);

				await expectSameView(page, "TenCards", before);
			},
		},
	];
