import * as path from "path";
import {
	parseInterfaceFromSourceFile,
	parseSchemaInputTypeDefinition,
	resolveMantineCorePropsMirror,
	resolveMantineCorePropsMirrorForDocKey,
} from "./mantineMirrorParser.ts";

const projectRoot = path.resolve(__dirname, "../..");

describe("resolveMantineCorePropsMirror", () => {
	it("resolves ButtonProps from button.schema-input.ts", () => {
		const parsed = resolveMantineCorePropsMirror(projectRoot, "ButtonProps");
		expect(parsed).toHaveProperty("properties");
		const props = (parsed as {properties: Record<string, unknown>}).properties;
		expect(props).toHaveProperty("fw");
		expect(props).toHaveProperty("variant");
		expect(props).toHaveProperty("size");
		expect(props).toHaveProperty("fullWidth");
	});

	it("resolves IconProps from icon.schema-input.ts", () => {
		const parsed = resolveMantineCorePropsMirror(projectRoot, "IconProps");
		expect(parsed).toHaveProperty("properties.size");
		expect(parsed).toHaveProperty("properties.stroke");
		expect(parsed).toHaveProperty("properties.iconType");
	});

	it("aliases SelectTextWeightedStyleProps to TextProps mirror", () => {
		const parsed = resolveMantineCorePropsMirrorForDocKey(
			projectRoot,
			"SelectTextWeightedStyleProps",
		);
		expect(parsed).toHaveProperty("properties.fw");
		expect(parsed).toHaveProperty("properties.size");
	});

	it("resolves AccordionProps from accordion schema-input", () => {
		const parsed = resolveMantineCorePropsMirror(
			projectRoot,
			"AccordionProps",
		);
		expect(parsed).toHaveProperty("properties.styles");
	});
});

describe("parseSchemaInputTypeDefinition", () => {
	it("parses MantineStylesApi from primitives.schema-input.ts", () => {
		const parsed = parseSchemaInputTypeDefinition(
			projectRoot,
			"MantineStylesApi",
		);
		expect(parsed).toHaveProperty("properties");
		const selector = (
			parsed as {properties: Record<string, unknown>}
		).properties["[selector]"];
		expect(selector).toBeDefined();
	});

	it("parses MantineCssLength as string | number", () => {
		const parsed = parseSchemaInputTypeDefinition(
			projectRoot,
			"MantineCssLength",
		);
		expect(parsed).toEqual({
			oneOf: [{type: "string"}, {type: "number"}],
		});
	});

	it("parses MantineFlexWrap as string enum", () => {
		const parsed = parseSchemaInputTypeDefinition(
			projectRoot,
			"MantineFlexWrap",
		);
		expect(parsed).toEqual({
			type: "string",
			enum: ["nowrap", "wrap", "wrap-reverse"],
		});
	});

	it("parses MantineCssStyleRecord as string-keyed style map", () => {
		const parsed = parseSchemaInputTypeDefinition(
			projectRoot,
			"MantineCssStyleRecord",
		);
		expect(parsed).toHaveProperty("properties");
		const value = (
			parsed as {properties: Record<string, {oneOf?: unknown[]}>}
		).properties["[string]"];
		expect(value?.oneOf).toEqual([{type: "string"}, {type: "number"}]);
	});

	it("parses MantineSpacing with token enum and string | number", () => {
		const parsed = parseSchemaInputTypeDefinition(
			projectRoot,
			"MantineSpacing",
		);
		expect(parsed).toHaveProperty("oneOf");
	});
});

describe("parseSchemaInputInterface", () => {
	it("parses MantineGroupProps without ts.createProgram", () => {
		const parsed = parseInterfaceFromSourceFile(
			projectRoot,
			"src/shared/shared/mantine-props/group.schema-input.ts",
			"MantineGroupProps",
		);
		expect(parsed).toHaveProperty("properties");
		const props = (parsed as {properties: Record<string, {description?: string}>})
			.properties;
		expect(props.w?.description).toContain("Group width");
		expect(props.w).toMatchObject({$ref: "#/definitions/MantineCssLength"});
		expect(props.wrap).toMatchObject({$ref: "#/definitions/MantineFlexWrap"});
		expect(props.wrap?.description).toContain("Flex wrap");
	});
});
