import path from "path";
import {
	buildNestedDocRoot,
	collectDocFlatProperties,
	createDefinitionsContext,
	dedupeFlatEntriesByConfigPath,
	detectMirroredMantinePropsDocKey,
} from "./buildArtifacts.ts";
import {DEFINITIONS_REF_PREFIX} from "./typeDefinitions.ts";

const projectRoot = path.resolve(__dirname, "../..");

type DocFlatEntry = {
	configPath: string;
	name: string;
	summary: string;
	source: string;
	properties?: Array<{
		name: string;
		description: string;
		type: {type: string} | {$ref: string};
	}>;
	docLink?: string;
};

function createTestDefinitionsContext() {
	const getText = (arr: {text: string}[] | undefined) =>
		arr ? arr.map((s) => s.text).join("") : "";
	return createDefinitionsContext({}, getText, (v) => v.trim(), projectRoot);
}

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
					{name: "n", description: "", type: {type: "string"}},
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

describe("detectMirroredMantinePropsDocKey", () => {
	it("maps MantinePaperProps reference to PaperProps", () => {
		expect(
			detectMirroredMantinePropsDocKey({
				type: "reference",
				name: "MantinePaperProps",
			}),
		).toBe("PaperProps");
	});

	it("maps intersection of only MantinePaperProps to PaperProps", () => {
		expect(
			detectMirroredMantinePropsDocKey({
				type: "intersection",
				types: [{type: "reference", name: "MantinePaperProps"}],
			}),
		).toBe("PaperProps");
	});
});

describe("collectDocFlatProperties", () => {
	const getText = (arr: {text: string}[] | undefined) =>
		arr ? arr.map((s) => s.text).join("") : "";
	const processTagValue = (v: string) => v.trim();

	it("maps declaration children when present", () => {
		const definitionsContext = createTestDefinitionsContext();
		const reflection = {
			children: [
				{
					name: "foo",
					type: {type: "intrinsic", name: "string"},
					comment: {summary: [{text: "Foo prop"}]},
				},
			],
		};
		expect(
			collectDocFlatProperties(
				reflection,
				getText,
				processTagValue,
				definitionsContext,
			),
		).toEqual([
			{name: "foo", description: "Foo prop", type: {type: "string"}},
		]);
	});

	it("merges properties from intersection of reflection object types", () => {
		const definitionsContext = createTestDefinitionsContext();
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
									type: {type: "intrinsic", name: "string"},
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
									type: {type: "intrinsic", name: "number"},
									comment: {summary: [{text: "overwritten"}]},
								},
								{
									name: "b",
									type: {type: "intrinsic", name: "boolean"},
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
			definitionsContext,
		);
		expect(props).toHaveLength(2);
		const byName = Object.fromEntries(props.map((p) => [p.name, p]));
		expect(byName.a).toEqual({
			name: "a",
			description: "overwritten",
			type: {type: "number"},
		});
		expect(byName.b).toEqual({
			name: "b",
			description: "",
			type: {type: "boolean"},
		});
	});

	it("unwraps optional wrapper types", () => {
		const definitionsContext = createTestDefinitionsContext();
		const reflection = {
			type: {
				type: "optional",
				elementType: {
					type: "reflection",
					declaration: {
						children: [
							{
								name: "flag",
								type: {type: "intrinsic", name: "boolean"},
								comment: {summary: []},
							},
						],
					},
				},
			},
		};
		expect(
			collectDocFlatProperties(
				reflection,
				getText,
				processTagValue,
				definitionsContext,
			),
		).toEqual([{name: "flag", description: "", type: {type: "boolean"}}]);
	});

	it("includes @default on nested members", () => {
		const definitionsContext = createTestDefinitionsContext();
		const reflection = {
			type: {
				type: "reflection",
				declaration: {
					children: [
						{
							name: "x",
							type: {type: "intrinsic", name: "number"},
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
			collectDocFlatProperties(
				reflection,
				getText,
				processTagValue,
				definitionsContext,
			),
		).toEqual([
			{name: "x", description: "", type: {type: "number"}, default: "1"},
		]);
	});

	it("uses mirror-backed PaperProps for empty extends MantinePaperProps", () => {
		const definitionsContext = createTestDefinitionsContext();
		const reflection = {
			type: {type: "reference", name: "MantinePaperProps"},
		};
		const props = collectDocFlatProperties(
			reflection,
			getText,
			processTagValue,
			definitionsContext,
		);
		const byName = Object.fromEntries(props.map((prop) => [prop.name, prop]));
		expect(byName.px?.type).toEqual({
			$ref: `${DEFINITIONS_REF_PREFIX}MantineSpacing`,
		});
		expect(byName.py?.type).toEqual({
			$ref: `${DEFINITIONS_REF_PREFIX}MantineSpacing`,
		});
		expect(props.map((prop) => prop.name).sort()).toEqual([
			"p",
			"px",
			"py",
			"shadow",
			"style",
			"styles",
			"withBorder",
		]);
	});

	it("uses $ref for named reference property types", () => {
		const definitionsContext = createTestDefinitionsContext();
		const reflection = {
			children: [
				{
					name: "draggingColor",
					type: {
						type: "reference",
						name: "InteractionEffect",
					},
					comment: {summary: []},
				},
			],
		};
		const props = collectDocFlatProperties(
			reflection,
			getText,
			processTagValue,
			definitionsContext,
		);
		expect(props[0].type).toEqual({
			$ref: `${DEFINITIONS_REF_PREFIX}InteractionEffect`,
		});
		expect(definitionsContext.definitions.InteractionEffect).toEqual({
			type: "unknown",
			name: "InteractionEffect",
		});
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
					{name: "bar", description: "desc", type: {type: "number"}},
				],
			},
		];
		const nested = buildNestedDocRoot(entries) as Record<string, unknown>;
		const leaf = (
			nested as {
				themeOverrides: {
					components: {
						Foo: {defaultProps: {properties: unknown[]}};
					};
				};
			}
		).themeOverrides.components.Foo.defaultProps;
		expect(leaf.properties).toEqual([
			{name: "bar", description: "desc", type: {type: "number"}},
		]);
	});

	it("includes category on nested leaf when provided", () => {
		const entries: DocFlatEntry[] = [
			{
				configPath: "themeOverrides.components.Widget.defaultProps",
				name: "Widget",
				summary: "",
				source: "Widget.tsx",
				properties: [],
				category: "widget",
			},
		];
		const nested = buildNestedDocRoot(entries) as Record<string, unknown>;
		const leaf = (
			nested as {
				themeOverrides: {
					components: {
						Widget: {
							defaultProps: {category?: string};
						};
					};
				};
			}
		).themeOverrides.components.Widget.defaultProps;
		expect(leaf.category).toBe("widget");
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
		const nested = buildNestedDocRoot(entries) as Record<string, unknown>;
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
