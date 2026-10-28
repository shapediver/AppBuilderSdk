import {expect, Page} from "@playwright/test";
import {
	card,
	cardLabels,
	parameter,
	sdvParameterValue,
	setSdvParameterValue,
	snapshotParameter,
} from "../helpers/selectParameters";
import {waitForModelRecomputed} from "../helpers/waitForModelRecomputed";
import type {ScenarioNamedAction} from "./scenarioActions";

/**
 * E2E coverage for String parameters rendered as selects, with the select
 * settings sent by Grasshopper (model `stringselect-10`).
 *
 * The model has two String parameters. Its AppBuilder output echoes the
 * JSON value of `Settings` as `overrides.settings` of `TextInput`, so setting
 * `Settings` makes Grasshopper send new select settings at runtime. That is
 * the same path the Salem Stones model uses to hide items that do not fit
 * the geometry.
 *
 * Pre-existing behavior (SS-8997, SS-9717, SS-8813):
 * - plain `items` commit the item key; `hidden` items are dropped;
 * - with `source` or `database`, cards commit `JSON.stringify(data)` when
 *   the item has a `data` payload, otherwise the key.
 * New in SS-10264:
 * - `database` behind other widgets (dropdown, chips) also commits JSON;
 * - Grasshopper `itemData` patches database rows and can change at runtime.
 *
 * Database hrefs must be absolute here: they come from Grasshopper, not
 * from a settings file, so `routeSettingsHrefsToAppBase` cannot rewrite
 * them. They point at the fixtures deployed with the app under test.
 */

/** Absolute URL of a fixture deployed next to the app under test. */
async function fixtureUrl(page: Page, file: string): Promise<string> {
	return page.evaluate((name) => new URL(name, location.href).href, file);
}

/** Let Grasshopper send `settings` for TextInput (via the Settings parameter). */
async function sendTextInputSettings(page: Page, settings: unknown) {
	await waitForModelRecomputed(page, async () => {
		await setSdvParameterValue(page, "Settings", JSON.stringify(settings));
	});
}

/** CSV database mapping: key, displayname, and two `data` fields. */
async function csvDatabase(page: Page, filters: unknown[] = []) {
	return {
		dataSource: {
			href: await fixtureUrl(page, "example-filterableDatabase.csv"),
		},
		itemDataDefinition: {
			value: 0,
			displayname: 1,
			data: {material: 3, dataId: 5},
		},
		filters,
	};
}

// The settings travel through the model, which may reorder the keys of the
// `data` mapping: compare the committed row data as objects, not as strings.
const BRASS_DATA = {material: "metal", dataId: "D-1002"};
const CEDAR_DATA = {material: "wood", dataId: "D-1003"};

/** The committed value of a parameter parsed as JSON (undefined if it is no JSON). */
async function sdvParameterJson(page: Page, name: string): Promise<unknown> {
	const value = await sdvParameterValue(page, name);
	try {
		return JSON.parse(String(value));
	} catch {
		return undefined;
	}
}

export const scenarioStringSelectNamedActions: ScenarioNamedAction[] = [
	{
		name: "grasshopper plain items commit the item key",
		run: async (page, slug) => {
			await sendTextInputSettings(page, {
				selectSettings: {
					type: "chipgroup",
					items: ["a", "b", "c"],
					itemData: {b: {displayname: "Bee"}, c: {hidden: true}},
				},
			});
			const chips = parameter(page, "TextInput");
			await expect(chips.getByRole("radio")).toHaveCount(2);
			await expect(chips.locator("label")).toHaveText(["a", "Bee"]);

			await waitForModelRecomputed(page, async () => {
				await chips.getByText("Bee", {exact: true}).click();
			});
			await expect
				.poll(() => sdvParameterValue(page, "TextInput"))
				.toBe("b");
			await snapshotParameter(page, "TextInput", `${slug}-plain-items`);
		},
	},
	{
		// Items without a `data` payload commit their key even with `source`:
		// JSON is only stored when `itemData.data` exists. The dummy API's
		// items only carry displayname and tooltip.
		name: "grasshopper source grid commits the key without data payload",
		run: async (page, slug) => {
			await sendTextInputSettings(page, {
				selectSettings: {
					type: "grid",
					source: "graphics",
					height: "300px",
				},
			});
			await expect
				.poll(async () => (await cardLabels(page, "TextInput")).length)
				.toBeGreaterThanOrEqual(10);

			// Cards are disabled while the dummy API loads its next page
			// (250 ms); a click in that window is ignored, so retry until
			// the value is committed.
			await expect(async () => {
				await card(page, "TextInput", "Option 001").click();
				expect(await sdvParameterValue(page, "TextInput")).toBe(
					"Option 001",
				);
			}).toPass({timeout: 60_000});
			await snapshotParameter(page, "TextInput", `${slug}-source-grid`);
		},
	},
	{
		name: "database cards commit row data json",
		run: async (page, slug) => {
			await sendTextInputSettings(page, {
				selectSettings: {
					type: "fullwidthcards",
					height: "300px",
					database: await csvDatabase(page, [
						{column: 3, label: "Material"},
					]),
				},
			});
			await waitForModelRecomputed(page, async () => {
				await card(page, "TextInput", "Brass").click();
			});
			await expect
				.poll(() => sdvParameterJson(page, "TextInput"))
				.toEqual(BRASS_DATA);
			await snapshotParameter(
				page,
				"TextInput",
				`${slug}-database-cards`,
			);
		},
	},
	{
		name: "database dropdown commits json and hides patched rows",
		run: async (page, slug) => {
			await sendTextInputSettings(page, {
				selectSettings: {
					type: "dropdown",
					database: await csvDatabase(page),
					itemData: {"Option 3": {hidden: true}},
				},
			});
			const input = parameter(page, "TextInput").getByRole("combobox");
			await input.click();
			// 10 rows, Cedar (Option 3) hidden by the Grasshopper patch.
			await expect(page.getByRole("option")).toHaveText([
				"Aluminium",
				"Brass",
				"Concrete",
				"Elm",
				"Fiber",
				"Glass",
				"Hemp",
				"Iron",
				"Jute",
			]);
			await waitForModelRecomputed(page, async () => {
				await page.getByRole("option", {name: "Brass"}).click();
			});
			await expect
				.poll(() => sdvParameterJson(page, "TextInput"))
				.toEqual(BRASS_DATA);
			// The stored JSON maps back to the row for display.
			await expect(input).toHaveValue("Brass");
			await snapshotParameter(
				page,
				"TextInput",
				`${slug}-database-dropdown`,
			);
		},
	},
	{
		name: "grasshopper patch changes at runtime",
		run: async (page, slug) => {
			const select = async (itemData?: unknown) =>
				sendTextInputSettings(page, {
					selectSettings: {
						type: "chipgroup",
						database: await csvDatabase(page),
						...(itemData ? {itemData} : {}),
					},
				});
			const chips = parameter(page, "TextInput");

			await select();
			await expect(chips.getByRole("radio")).toHaveCount(10);
			await waitForModelRecomputed(page, async () => {
				await chips.getByText("Cedar", {exact: true}).click();
			});
			await expect
				.poll(() => sdvParameterJson(page, "TextInput"))
				.toEqual(CEDAR_DATA);

			// Grasshopper now hides Cedar (the current value) and renames
			// Aluminium. The stored value stays; no chip is selected.
			await select({
				"Option 3": {hidden: true},
				"Option 1": {displayname: "Aluminium (recommended)"},
			});
			await expect(chips.getByRole("radio")).toHaveCount(9);
			await expect(chips.getByText("Cedar", {exact: true})).toHaveCount(
				0,
			);
			await expect(
				chips.getByText("Aluminium (recommended)", {exact: true}),
			).toBeVisible();
			await expect(chips.locator("input:checked")).toHaveCount(0);
			expect(await sdvParameterJson(page, "TextInput")).toEqual(
				CEDAR_DATA,
			);
			await snapshotParameter(page, "TextInput", `${slug}-patch-applied`);

			// Patch removed again: Cedar is back and selected.
			await select();
			await expect(chips.getByRole("radio")).toHaveCount(10);
			await expect(
				chips.getByRole("radio", {name: "Cedar"}),
			).toBeChecked();
		},
	},
];
