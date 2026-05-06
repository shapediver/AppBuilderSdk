import {
	buildNestedDocRoot,
	collectDocFlatProperties,
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
	docLink?: string;
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

describe("collectDocFlatProperties", () => {
	const getText = (arr: {text: string}[] | undefined) =>
		arr ? arr.map((s) => s.text).join("") : "";
	const processTagValue = (v: string) => v.trim();

	it("maps declaration children when present", () => {
		const reflection = {
			children: [
				{
					name: "foo",
					type: {toString: () => "string"},
					comment: {summary: [{text: "Foo prop"}]},
				},
			],
		};
		expect(
			collectDocFlatProperties(reflection, getText, processTagValue),
		).toEqual([
			{name: "foo", description: "Foo prop", type: "string"},
		]);
	});

	it("merges properties from intersection of reflection object types", () => {
		const reflection = {
			type: {
				type: "intersection",
				types: [
					{
						type: "reflection",
						declaration: {
							children: [
								{
									name: "a",
									type: {toString: () => "string"},
									comment: {summary: [{text: "first"}]},
								},
							],
						},
					},
					{
						type: "reflection",
						declaration: {
							children: [
								{
									name: "a",
									type: {toString: () => "number"},
									comment: {summary: [{text: "overwritten"}]},
								},
								{
									name: "b",
									type: {toString: () => "boolean"},
									comment: {summary: []},
								},
							],
						},
					},
				],
			},
		};
		const props = collectDocFlatProperties(
			reflection,
			getText,
			processTagValue,
		);
		expect(props).toHaveLength(2);
		const byName = Object.fromEntries(props.map((p) => [p.name, p]));
		expect(byName.a).toEqual({
			name: "a",
			description: "overwritten",
			type: "number",
		});
		expect(byName.b).toEqual({
			name: "b",
			description: "",
			type: "boolean",
		});
	});

	it("unwraps optional wrapper types", () => {
		const reflection = {
			type: {
				type: "optional",
				elementType: {
					type: "reflection",
					declaration: {
						children: [
							{
								name: "flag",
								type: {toString: () => "boolean"},
								comment: {summary: []},
							},
						],
					},
				},
			},
		};
		expect(
			collectDocFlatProperties(reflection, getText, processTagValue),
		).toEqual([{name: "flag", description: "", type: "boolean"}]);
	});

	it("includes @default on nested members", () => {
		const reflection = {
			type: {
				type: "reflection",
				declaration: {
					children: [
						{
							name: "x",
							type: {toString: () => "number"},
							comment: {
								summary: [],
								blockTags: [
									{tag: "@default", content: [{text: "1"}]},
								],
							},
						},
					],
				},
			},
		};
		expect(
			collectDocFlatProperties(reflection, getText, processTagValue),
		).toEqual([{name: "x", description: "", type: "number", default: "1"}]);
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

	it("includes docLink on nested leaf when provided", () => {
		const entries: DocFlatEntry[] = [
			{
				configPath: "themeOverrides.components.Bar.defaultProps",
				name: "Bar",
				summary: "",
				source: "Bar.tsx",
				properties: [],
				docLink: "https://example.com/docs",
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
						Bar: {
							defaultProps: {
								properties: unknown[];
								docLink: string;
							};
						};
					};
				};
			}
		).themeOverrides.components.Bar.defaultProps;
		expect(leaf.properties).toEqual([]);
		expect(leaf.docLink).toBe("https://example.com/docs");
	});
});
