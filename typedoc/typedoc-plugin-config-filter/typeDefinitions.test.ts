import * as path from "path";
import {
	buildIntersectionDefinitionName,
	createDefinitionsContext,
	DEFINITIONS_REF_PREFIX,
	sanitizeDefinitionName,
	wrapDocFlatEntries,
} from "./typeDefinitions.ts";

const projectRoot = path.resolve(__dirname, "../..");

describe("createDefinitionsContext", () => {
	const getText = (arr: {text: string}[] | undefined) =>
		arr ? arr.map((s) => s.text).join("") : "";
	const processTagValue = (v: string) => v.trim();

	it("inlines primitive types without definitions", () => {
		const ctx = createDefinitionsContext({}, getText, processTagValue);
		const schema = ctx.resolveType({
			type: "intrinsic",
			name: "string",
		});
		expect(schema).toEqual({type: "string"});
		expect(Object.keys(ctx.definitions)).toHaveLength(0);
	});

	it("registers union types and returns $ref on properties", () => {
		const ctx = createDefinitionsContext({}, getText, processTagValue);
		const schema = ctx.resolveType({
			type: "union",
			name: "InteractionEffect",
			types: [
				{type: "intrinsic", name: "string"},
				{type: "intrinsic", name: "null"},
				{
					type: "reference",
					name: "IMaterialStandardDataPropertiesDefinition",
				},
			],
		});
		expect(schema).toEqual({
			$ref: `${DEFINITIONS_REF_PREFIX}InteractionEffect`,
		});
		expect(ctx.definitions.InteractionEffect).toEqual({
			oneOf: [
				{type: "string"},
				{type: "null"},
				{
					$ref: `${DEFINITIONS_REF_PREFIX}IMaterialStandardDataPropertiesDefinition`,
				},
			],
		});
	});

	it("registers object reflections with property schemas", () => {
		const ctx = createDefinitionsContext({}, getText, processTagValue);
		ctx.resolveType({
			type: "reflection",
			declaration: {
				children: [
					{
						name: "color",
						type: {type: "intrinsic", name: "string"},
						comment: {summary: [{text: "Fill color"}]},
					},
				],
			},
		});
		const keys = Object.keys(ctx.definitions);
		expect(keys).toHaveLength(1);
		const def = ctx.definitions[keys[0]];
		expect(def).toEqual({
			properties: {
				color: {type: "string", description: "Fill color"},
			},
		});
	});
});

describe("buildIntersectionDefinitionName", () => {
	it("includes Partial generic base, not bare Partial", () => {
		expect(
			buildIntersectionDefinitionName([
				{
					type: "reference",
					name: "ViewportOverlayWrapperProps",
					_target: {qualifiedName: "ViewportOverlayWrapperProps"},
				},
				{
					type: "reference",
					name: "Partial",
					typeArguments: [
						{
							type: "reference",
							name: "OverlayStyleProps",
							_target: {qualifiedName: "OverlayStyleProps"},
						},
					],
				},
			]),
		).toBe("ViewportOverlayWrapperProps_and_Partial_OverlayStyleProps");
	});
});

describe("sanitizeDefinitionName", () => {
	it("produces unique keys per Partial generic argument", () => {
		expect(sanitizeDefinitionName("Partial<ButtonProps>")).toBe(
			"Partial_ButtonProps",
		);
		expect(sanitizeDefinitionName("Partial<TooltipProps>")).toBe(
			"Partial_TooltipProps",
		);
		expect(sanitizeDefinitionName("Partial<ButtonProps>")).not.toBe(
			sanitizeDefinitionName("Partial<TooltipProps>"),
		);
	});
});

describe("Partial utility definitions", () => {
	const getText = (arr: {text: string}[] | undefined) =>
		arr ? arr.map((s) => s.text).join("") : "";
	const processTagValue = (v: string) => v.trim();
	it("registers separate definition keys for Partial<ButtonProps> and Partial<TextProps>", () => {
		const ctx = createDefinitionsContext(
			{},
			getText,
			processTagValue,
			projectRoot,
		);

		ctx.resolveType({
			type: "reference",
			name: "Partial",
			typeArguments: [
				{
					type: "reference",
					name: "ButtonProps",
					_target: {
						packageName: "@mantine/core",
						packagePath: "lib/components/Button/Button.d.ts",
						qualifiedName: "ButtonProps",
					},
				},
			],
		});
		ctx.resolveType({
			type: "reference",
			name: "Partial",
			typeArguments: [
				{
					type: "reference",
					name: "TextProps",
					_target: {
						packageName: "@mantine/core",
						packagePath: "lib/components/Text/Text.d.ts",
						qualifiedName: "TextProps",
					},
				},
			],
		});

		expect(ctx.definitions.Partial).toBeUndefined();
		expect(ctx.definitions.Partial_ButtonProps).toBeUndefined();
		expect(ctx.definitions.ButtonProps).toHaveProperty("properties");
		expect(
			(ctx.definitions.ButtonProps as {properties: Record<string, unknown>})
				.properties,
		).toHaveProperty("variant");
		expect(ctx.definitions.Partial_TextProps).toBeUndefined();
		expect(ctx.definitions.TextProps).toHaveProperty("properties");
		expect(
			(ctx.definitions.TextProps as {properties: Record<string, unknown>})
				.properties,
		).toHaveProperty("fw");
		expect(ctx.definitions.ButtonProps).not.toEqual(
			ctx.definitions.TextProps,
		);
	});
});

describe("ViewportIconButton Partial props", () => {
	const getText = (arr: {text: string}[] | undefined) =>
		arr ? arr.map((s) => s.text).join("") : "";
	const processTagValue = (v: string) => v.trim();

	it("resolves tooltipWrapperProps to TooltipProps, not iconProps", () => {
		const ctx = createDefinitionsContext(
			{},
			getText,
			processTagValue,
			projectRoot,
		);
		ctx.setEntrySourceFile(
			"src/shared/entities/viewport/ui/ViewportIconButton.tsx",
		);

		const tooltipSchema = ctx.resolveType(
			{
				type: "reference",
				name: "Partial",
				typeArguments: [
					{
						type: "reference",
						name: "TooltipProps",
						_target: {
							packageName: "@mantine/core",
							packagePath:
								"lib/components/Tooltip/Tooltip.d.ts",
							qualifiedName: "TooltipProps",
						},
					},
				],
			},
			"tooltipWrapperProps",
		);

		expect(tooltipSchema).toEqual({
			$ref: `${DEFINITIONS_REF_PREFIX}TooltipProps`,
		});
		expect(tooltipSchema).not.toEqual({
			$ref: `${DEFINITIONS_REF_PREFIX}ViewportIconButton_iconProps`,
		});
	});

	it("resolves iconProps Partial<IconProps> to compact icon schema", () => {
		const ctx = createDefinitionsContext(
			{},
			getText,
			processTagValue,
			projectRoot,
		);
		ctx.setEntrySourceFile(
			"src/shared/entities/viewport/ui/ViewportIconButton.tsx",
		);

		const iconSchema = ctx.resolveType(
			{
				type: "reference",
				name: "Partial",
				typeArguments: [{type: "reference", name: "IconProps"}],
			},
			"iconProps",
		);

		expect(iconSchema).toEqual({
			$ref: `${DEFINITIONS_REF_PREFIX}Partial_IconProps`,
		});
	});
});

describe("Record utility definitions", () => {
	const getText = (arr: {text: string}[] | undefined) =>
		arr ? arr.map((s) => s.text).join("") : "";
	const processTagValue = (v: string) => v.trim();

	it("resolves Record<string, string | number> as MantineCssStyleRecord ref", () => {
		const ctx = createDefinitionsContext(
			{},
			getText,
			processTagValue,
			projectRoot,
		);
		const schema = ctx.resolveType({
			type: "reference",
			name: "Record",
			typeArguments: [
				{type: "intrinsic", name: "string"},
				{
					type: "union",
					types: [
						{type: "intrinsic", name: "string"},
						{type: "intrinsic", name: "number"},
					],
				},
			],
		});
		expect(schema).toEqual({
			$ref: "#/definitions/MantineCssStyleRecord",
		});
		expect(ctx.definitions.Record_string).toBeUndefined();
	});

	it("resolves ParameterSelectComponent componentSettings map", () => {
		const ctx = createDefinitionsContext(
			{},
			getText,
			processTagValue,
			projectRoot,
		);
		ctx.setEntrySourceFile(
			"src/shared/entities/parameter/ui/ParameterSelectComponent.tsx",
		);
		const schema = ctx.resolveType({
			type: "reference",
			name: "Record",
			typeArguments: [
				{type: "intrinsic", name: "string"},
				{
					type: "reference",
					name: "ISelectComponentOverrides",
				},
			],
		});
		expect(schema).toEqual({
			$ref: "#/definitions/Record_string_ISelectComponentOverrides",
		});
		const def = ctx.definitions.Record_string_ISelectComponentOverrides;
		expect(def).toHaveProperty("properties");
		const value = (
			def as {properties: Record<string, {properties?: Record<string, unknown>}>}
		).properties["[string]"];
		expect(value?.properties).toHaveProperty("type");
		expect(value?.properties).toHaveProperty("itemData");
		expect(value?.properties).toHaveProperty("settings");
		const settings = value?.properties?.settings as {
			properties?: Record<string, {$ref?: string}>;
		};
		expect(settings?.properties?.buttonProps).toEqual({
			$ref: "#/definitions/ButtonProps",
		});
	});
});

describe("wrapDocFlatEntries", () => {
	it("wraps entries with definitions object", () => {
		const doc = wrapDocFlatEntries(
			[{configPath: "a.b", name: "A", summary: "", source: "x.ts"}],
			{Foo: {type: "string"}},
		);
		expect(doc.entries).toHaveLength(1);
		expect(doc.definitions.Foo).toEqual({type: "string"});
		expect(doc.entriesByCategory).toEqual({});
	});

	it("builds entriesByCategory index from entry.category", () => {
		const doc = wrapDocFlatEntries(
			[
				{
					configPath: "themeOverrides.components.A.defaultProps",
					name: "A",
					category: "widget",
				},
				{
					configPath: "themeOverrides.components.B.defaultProps",
					name: "B",
					category: "entity",
				},
				{
					configPath: "themeOverrides.components.C.defaultProps",
					name: "C",
					category: "widget",
				},
			],
			{},
		);
		expect(doc.entriesByCategory).toEqual({
			widget: [
				"themeOverrides.components.A.defaultProps",
				"themeOverrides.components.C.defaultProps",
			],
			entity: ["themeOverrides.components.B.defaultProps"],
		});
	});
});
