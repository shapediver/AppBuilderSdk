import {
	buildNestedDocRoot,
	dedupeFlatEntriesByConfigPath,
} from "./buildArtifacts.js";

type DocFlatEntry = {
	configPath: string;
	name: string;
	summary: string;
	source: string;
	properties?: Array<{
		name: string;
		description: string;
		type: string;
	}>;
};

describe("dedupeFlatEntriesByConfigPath", () => {
	it("keeps last entry and notifies on duplicate configPath", () => {
		const duplicatePaths: string[] = [];
		const entries: DocFlatEntry[] = [
			{
				configPath: "themeOverrides.components.X.defaultProps",
				name: "First",
				summary: "",
				source: "a.ts",
				properties: [
					{name: "n", description: "", type: "string"},
				],
			},
			{
				configPath: "themeOverrides.components.X.defaultProps",
				name: "Second",
				summary: "",
				source: "b.ts",
				properties: [],
			},
		];
		const out = dedupeFlatEntriesByConfigPath(entries, (path) => {
			duplicatePaths.push(path);
		});
		expect(duplicatePaths).toEqual([
			"themeOverrides.components.X.defaultProps",
		]);
		expect(out).toHaveLength(1);
		expect(out[0].name).toBe("Second");
	});
});

describe("buildNestedDocRoot", () => {
	it("places properties at nested path from configPath", () => {
		const entries: DocFlatEntry[] = [
			{
				configPath: "themeOverrides.components.Foo.defaultProps",
				name: "Foo",
				summary: "About Foo",
				source: "Foo.tsx",
				properties: [
					{name: "bar", description: "desc", type: "number"},
				],
			},
		];
		const nested = buildNestedDocRoot(entries) as Record<
			string,
			unknown
		>;
		const leaf = (
			nested as {
				themeOverrides: {
					components: {
						Foo: {"defaultProps": {properties: unknown[]}};
					};
				};
			}
		).themeOverrides.components.Foo.defaultProps;
		expect(leaf.properties).toEqual([
			{name: "bar", description: "desc", type: "number"},
		]);
	});
});
