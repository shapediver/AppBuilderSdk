import * as path from "path";
import {
	canonicalMantinePropsDocKeyForPropertyKeys,
	findMirroredMantinePropsDocKeyForSuperset,
	mantineCorePropsDocKeyForMirrorName,
	parseInterfaceFromSourceFile,
	parseSchemaInputTypeDefinition,
	resetMantineMirrorPropertyFingerprintIndex,
	resolveDocRefForTypeName,
	resolveMantineCorePropsMirror,
	resolveMantineCorePropsMirrorForDocKey,
} from "./mantineMirrorParser.ts";

const projectRoot = path.resolve(__dirname, "../..");

describe("mantineCorePropsDocKeyForMirrorName", () => {
	it("maps MantineButtonProps to ButtonProps", () => {
		expect(mantineCorePropsDocKeyForMirrorName("MantineButtonProps")).toBe(
			"ButtonProps",
		);
	});

	it("maps MantineThemeOverrideProps to MantineThemeOverride", () => {
		expect(
			mantineCorePropsDocKeyForMirrorName("MantineThemeOverrideProps"),
		).toBe("MantineThemeOverride");
	});
});

describe("resolveDocRefForTypeName", () => {
	it("returns ButtonProps ref for MantineButtonProps", () => {
		expect(resolveDocRefForTypeName(projectRoot, "MantineButtonProps")).toEqual(
			{$ref: "#/definitions/ButtonProps"},
		);
	});
});

describe("canonicalMantinePropsDocKeyForPropertyKeys", () => {
	it("matches ButtonProps field set", () => {
		const mirror = resolveMantineCorePropsMirror(projectRoot, "ButtonProps");
		expect(mirror).toHaveProperty("properties");
		const keys = (mirror as {properties: Record<string, unknown>}).properties;
		expect(canonicalMantinePropsDocKeyForPropertyKeys(projectRoot, keys)).toBe(
			"ButtonProps",
		);
	});
});

describe("findMirroredMantinePropsDocKeyForSuperset", () => {
	beforeEach(() => {
		resetMantineMirrorPropertyFingerprintIndex();
	});

	it("matches ButtonProps when entry adds actionIconProps", () => {
		const mirror = resolveMantineCorePropsMirror(projectRoot, "ButtonProps");
		expect(mirror).toHaveProperty("properties");
		const buttonProps = (mirror as {properties: Record<string, unknown>})
			.properties;
		const buttonKeys = Object.keys(buttonProps);
		expect(buttonKeys.length).toBeGreaterThan(0);
		expect(
			canonicalMantinePropsDocKeyForPropertyKeys(projectRoot, buttonProps),
		).toBe("ButtonProps");
		const result = findMirroredMantinePropsDocKeyForSuperset(projectRoot, [
			...buttonKeys,
			"actionIconProps",
		]);
		expect(result).toBe("ButtonProps");
	});
});

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

	it("parses MantineFloatingPosition as string enum", () => {
		const parsed = parseSchemaInputTypeDefinition(
			projectRoot,
			"MantineFloatingPosition",
		);
		expect(parsed).toEqual({
			type: "string",
			enum: [
				"top",
				"right",
				"bottom",
				"left",
				"top-start",
				"top-end",
				"bottom-start",
				"bottom-end",
				"left-start",
				"left-end",
				"right-start",
				"right-end",
			],
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
		expect(props.pt?.description).toContain("Padding top");
		expect(props.pb?.description).toContain("Padding bottom");
	});

	it("parses MantineTooltipProps position as MantineFloatingPosition ref", () => {
		const parsed = parseInterfaceFromSourceFile(
			projectRoot,
			"src/shared/shared/mantine-props/tooltip.schema-input.ts",
			"MantineTooltipProps",
		);
		expect(parsed).toHaveProperty("properties");
		const props = (parsed as {properties: Record<string, unknown>}).properties;
		expect(props.position).toEqual({
			$ref: "#/definitions/MantineFloatingPosition",
		});
	});
});
