import type {DocTypeSchema} from "./typeDefinitions.ts";

export const MANTINE_CSS_STYLE_RECORD_REF: DocTypeSchema = {
	$ref: "#/definitions/MantineCssStyleRecord",
};

export const MANTINE_RESPONSIVE_CSS_SIZE_REF: DocTypeSchema = {
	$ref: "#/definitions/MantineResponsiveCssSize",
};

const BREAKPOINT_SIZE_KEYS = new Set(["base", "xs", "sm", "md", "lg", "xl"]);

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
			.map((member) =>
				typeArgumentLabelForDefinition(member as TypeArgNode),
			)
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

function isStringOrNumberSchema(schema: DocTypeSchema): boolean {
	return (
		schema.type === "string" ||
		schema.type === "number" ||
		isStringOrNumberUnionSchema(schema)
	);
}

/** Object with only Mantine breakpoint keys (`base`, `xs`, …) and string/number values. */
export function isBreakpointSizeObjectSchema(schema: DocTypeSchema): boolean {
	if (!("properties" in schema) || !schema.properties) return false;
	const keys = Object.keys(schema.properties);
	if (keys.length < 3) return false;
	if (!keys.every((key) => BREAKPOINT_SIZE_KEYS.has(key))) return false;
	return keys.every((key) =>
		isStringOrNumberSchema(schema.properties![key] as DocTypeSchema),
	);
}

/** Detect inline unions equivalent to `MantineResponsiveCssSize`. */
export function matchesMantineResponsiveCssSize(
	schema: DocTypeSchema,
): boolean {
	if (!("oneOf" in schema) || !schema.oneOf?.length) return false;
	const hasString = schema.oneOf.some((member) => member.type === "string");
	const hasNumber = schema.oneOf.some((member) => member.type === "number");
	const hasBreakpointObject = schema.oneOf.some((member) =>
		isBreakpointSizeObjectSchema(member),
	);
	return hasString && hasNumber && hasBreakpointObject;
}

/** Top-level keys only — no deep `SelectComponentSettings` expansion. */
export function compactISelectComponentOverridesValueSchema(): DocTypeSchema {
	return {
		properties: {
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
		},
	};
}

export function compactRecordStringISelectComponentOverrides(): DocTypeSchema {
	return {
		properties: {
			"[string]": compactISelectComponentOverridesValueSchema(),
		},
	};
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
