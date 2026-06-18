import {
	buildRecordDefinitionName,
	buildRecordTypeSchema,
	compactRecordStringISelectComponentOverrides,
	isBreakpointSizeObjectSchema,
	isStringOrNumberUnionSchema,
	matchesMantineResponsiveCssSize,
	recordSchemaFromParts,
} from "./recordTypeSchema.ts";

describe("recordTypeSchema", () => {
	it("builds unique Record definition names from key and value", () => {
		expect(
			buildRecordDefinitionName(
				{name: "string"},
				{name: "ISelectComponentOverrides"},
			),
		).toBe("Record_string_ISelectComponentOverrides");
		expect(
			buildRecordDefinitionName(
				{name: "string"},
				{
					type: "union",
					types: [{name: "string"}, {name: "number"}],
				},
			),
		).toBe("Record_string_string_or_number");
	});

	it("maps Record<string, string | number> to MantineCssStyleRecord ref", () => {
		expect(
			recordSchemaFromParts("string", {
				oneOf: [{type: "string"}, {type: "number"}],
			}),
		).toEqual({$ref: "#/definitions/MantineCssStyleRecord"});
	});

	it("builds index-signature map for object value types", () => {
		expect(
			buildRecordTypeSchema("string", {
				properties: {
					type: {type: "string"},
				},
			}),
		).toEqual({
			properties: {
				"[string]": {
					properties: {
						type: {type: "string"},
					},
				},
			},
		});
	});

	it("detects string | number unions", () => {
		expect(
			isStringOrNumberUnionSchema({
				oneOf: [{type: "string"}, {type: "number"}],
			}),
		).toBe(true);
		expect(
			isStringOrNumberUnionSchema({
				oneOf: [{type: "string"}, {type: "boolean"}],
			}),
		).toBe(false);
	});

	it("detects MantineResponsiveCssSize-shaped unions and breakpoint objects", () => {
		const breakpointObject = {
			properties: {
				base: {oneOf: [{type: "string"}, {type: "number"}]},
				xs: {oneOf: [{type: "string"}, {type: "number"}]},
				sm: {oneOf: [{type: "string"}, {type: "number"}]},
				md: {oneOf: [{type: "string"}, {type: "number"}]},
				lg: {oneOf: [{type: "string"}, {type: "number"}]},
				xl: {oneOf: [{type: "string"}, {type: "number"}]},
			},
		};
		expect(isBreakpointSizeObjectSchema(breakpointObject)).toBe(true);
		expect(
			matchesMantineResponsiveCssSize({
				oneOf: [{type: "string"}, {type: "number"}, breakpointObject],
			}),
		).toBe(true);
	});

	it("stubs Record<string, ISelectComponentOverrides> with top-level keys only", () => {
		const compact = compactRecordStringISelectComponentOverrides();
		const value = (
			compact as {
				properties: Record<
					string,
					{properties?: Record<string, unknown>}
				>;
			}
		).properties["[string]"];
		expect(value?.properties).toEqual({
			type: {
				type: "unknown",
				name: "SelectComponentType",
				description: "Type of select component to use.",
			},
			itemData: {
				type: "unknown",
				name: "Record<string, ISelectComponentItemDataType>",
				description:
					"Record containing optional further item data per item name.",
			},
			settings: {
				type: "unknown",
				name: "SelectComponentSettings",
				description: "Optional further settings, like image width etc.",
			},
		});
	});
});
