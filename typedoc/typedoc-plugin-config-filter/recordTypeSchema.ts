import type {DocTypeSchema} from "./typeDefinitions.ts";

export const MANTINE_CSS_STYLE_RECORD_REF: DocTypeSchema = {
	$ref: "#/definitions/MantineCssStyleRecord",
};

type TypeArgNode = {
	name?: string;
	type?: string;
	types?: unknown[];
	_target?: {qualifiedName?: string};
};

export function typeArgumentLabelForDefinition(arg: TypeArgNode): string {
	if (arg._target?.qualifiedName) return arg._target.qualifiedName;
	if (typeof arg.name === "string" && arg.name.length) return arg.name;
	if (arg.type === "union" && Array.isArray(arg.types)) {
		return arg.types
			.map((member) => typeArgumentLabelForDefinition(member as TypeArgNode))
			.join("_or_");
	}
	return "Unknown";
}

export function buildRecordDefinitionName(
	keyArg: TypeArgNode,
	valueArg: TypeArgNode,
): string {
	return `Record_${typeArgumentLabelForDefinition(keyArg)}_${typeArgumentLabelForDefinition(valueArg)}`;
}

export function buildRecordTypeSchema(
	keyLabel: string,
	valueSchema: DocTypeSchema,
): DocTypeSchema {
	return {
		properties: {
			[`[${keyLabel}]`]: valueSchema,
		},
	};
}

export function isStringOrNumberUnionSchema(schema: DocTypeSchema): boolean {
	if (!("oneOf" in schema) || !schema.oneOf || schema.oneOf.length !== 2) {
		return false;
	}
	const kinds = schema.oneOf.map((member) =>
		"type" in member ? member.type : "",
	);
	return kinds.includes("string") && kinds.includes("number");
}

/** Map `Record<string, V>` to a doc schema; reuse `MantineCssStyleRecord` when applicable. */
export function recordSchemaFromParts(
	keyLabel: string,
	valueSchema: DocTypeSchema,
): DocTypeSchema {
	if (keyLabel === "string" && isStringOrNumberUnionSchema(valueSchema)) {
		return MANTINE_CSS_STYLE_RECORD_REF;
	}
	return buildRecordTypeSchema(keyLabel, valueSchema);
}

export function valueSchemaFromExpanded(
	valueExpanded: DocTypeSchema | undefined,
	fallbackName: string,
): DocTypeSchema {
	if (
		valueExpanded &&
		"properties" in valueExpanded &&
		valueExpanded.properties
	) {
		return {properties: valueExpanded.properties};
	}
	if (
		valueExpanded &&
		("oneOf" in valueExpanded ||
			"items" in valueExpanded ||
			"$ref" in valueExpanded)
	) {
		return valueExpanded;
	}
	return {type: "unknown", name: fallbackName};
}
