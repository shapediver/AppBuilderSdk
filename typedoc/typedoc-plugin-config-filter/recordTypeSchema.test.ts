import {
	buildRecordDefinitionName,
	buildRecordTypeSchema,
	isStringOrNumberUnionSchema,
	recordSchemaFromParts,
} from "./recordTypeSchema.ts";

describe("recordTypeSchema", () => {
	it("builds unique Record definition names from key and value", () => {
		expect(
			buildRecordDefinitionName({name: "string"}, {name: "ISelectComponentOverrides"}),
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
});
