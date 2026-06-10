import * as fs from "fs";
import * as path from "path";
import ts from "typescript";
import type {DocTypeDefinition, DocTypeSchema} from "./typeDefinitions.ts";

const DEFINITIONS_REF_PREFIX = "#/definitions/";

const PRIMITIVES_SCHEMA_INPUT =
	"src/shared/shared/mantine-props/primitives.schema-input.ts";
const SPACING_SCHEMA_INPUT =
	"src/shared/shared/mantine-props/spacing.schema-input.ts";

/** Serializable types defined in mantine-props schema-input files (not component mirrors). */
export const MANTINE_SCHEMA_INPUT_TYPE_SOURCES: Record<string, string> = {
	MantineCssLength: PRIMITIVES_SCHEMA_INPUT,
	MantineCssStyleRecord: PRIMITIVES_SCHEMA_INPUT,
	MantineFlexWrap: PRIMITIVES_SCHEMA_INPUT,
	MantineStylesApiValue: PRIMITIVES_SCHEMA_INPUT,
	MantineStylesApi: PRIMITIVES_SCHEMA_INPUT,
	MantineResponsiveCssSize: PRIMITIVES_SCHEMA_INPUT,
	MantineSpacing: SPACING_SCHEMA_INPUT,
	MantineSizeToken: SPACING_SCHEMA_INPUT,
};

export const MANTINE_SCHEMA_INPUT_TYPE_NAMES = new Set(
	Object.keys(MANTINE_SCHEMA_INPUT_TYPE_SOURCES),
);

function mantineSchemaInputRef(typeName: string): {$ref: string} {
	return {$ref: `${DEFINITIONS_REF_PREFIX}${typeName}`};
}

function jsDocSummary(node: ts.Node): string | undefined {
	for (const tag of ts.getJSDocCommentsAndTags(node)) {
		if (!ts.isJSDoc(tag)) continue;
		const comment = tag.comment;
		if (typeof comment === "string" && comment.trim()) {
			return comment.trim();
		}
		if (Array.isArray(comment)) {
			const text = comment.map((part) => part.text).join("").trim();
			if (text) return text;
		}
	}
	return undefined;
}

function jsDocDefault(node: ts.Node): string | undefined {
	for (const tag of ts.getJSDocCommentsAndTags(node)) {
		if (!ts.isJSDocTag(tag) || tag.tagName.text !== "default") continue;
		const comment = tag.comment;
		if (typeof comment === "string" && comment.trim()) {
			return comment.trim();
		}
		if (Array.isArray(comment)) {
			return comment.map((part) => part.text).join("").trim() || undefined;
		}
	}
	return undefined;
}

function schemaFromTypeNode(typeNode: ts.TypeNode | undefined): DocTypeSchema {
	if (!typeNode) {
		return {type: "unknown", name: "unknown"};
	}
	if (ts.isUnionTypeNode(typeNode)) {
		const members = typeNode.types
			.filter((member) => member.kind !== ts.SyntaxKind.UndefinedKeyword)
			.map((member) => schemaFromTypeNode(member));
		if (!members.length) {
			return {type: "unknown", name: "undefined"};
		}
		const strings = members
			.filter(
				(m): m is {type: "string"; const: string} =>
					m.type === "string" &&
					typeof (m as {const?: string}).const === "string",
			)
			.map((m) => m.const);
		if (strings.length === members.length && strings.length > 1) {
			return {type: "string", enum: strings};
		}
		if (members.length === 2) {
			const kinds = new Set(members.map((m) => m.type));
			if (kinds.has("string") && kinds.has("number")) {
				return {oneOf: [{type: "string"}, {type: "number"}]};
			}
		}
		const literalEnums = members.filter(
			(m): m is {type: "string"; const: string} =>
				m.type === "string" &&
				typeof (m as {const?: string}).const === "string",
		);
		const hasPlainString = members.some(
			(m) => m.type === "string" && !("const" in m && m.const),
		);
		if (literalEnums.length > 0 && hasPlainString) {
			const oneOf: DocTypeSchema[] = [
				{
					type: "string",
					enum: literalEnums.map((m) => m.const),
				},
				{type: "string"},
			];
			if (members.some((member) => member.type === "number")) {
				oneOf.push({type: "number"});
			}
			return {oneOf};
		}
		return {oneOf: members};
	}
	if (ts.isArrayTypeNode(typeNode)) {
		return {items: schemaFromTypeNode(typeNode.elementType)};
	}
	if (ts.isTypeLiteralNode(typeNode)) {
		const indexSignatures = typeNode.members.filter(
			(member) => member.kind === ts.SyntaxKind.IndexSignature,
		);
		if (
			indexSignatures.length === 1 &&
			indexSignatures.length === typeNode.members.length
		) {
			const indexSig = indexSignatures[0]!;
			const keyParam = indexSig.parameters[0];
			const keyLabel = keyParam?.name.getText() ?? "key";
			return {
				properties: {
					[`[${keyLabel}]`]: schemaFromTypeNode(indexSig.type),
				},
			};
		}
		const properties: Record<string, DocTypeSchema> = {};
		for (const member of typeNode.members) {
			if (
				member.kind !== ts.SyntaxKind.PropertySignature ||
				!ts.isPropertySignature(member) ||
				!member.name
			) {
				continue;
			}
			properties[member.name.getText()] = schemaFromTypeNode(member.type);
		}
		if (Object.keys(properties).length) {
			return {properties};
		}
	}
	if (ts.isLiteralTypeNode(typeNode)) {
		if (ts.isStringLiteral(typeNode.literal)) {
			return {type: "string", const: typeNode.literal.text};
		}
		if (ts.isNumericLiteral(typeNode.literal)) {
			return {type: "number", const: Number(typeNode.literal.text)};
		}
	}
	if (typeNode.kind === ts.SyntaxKind.StringKeyword) {
		return {type: "string"};
	}
	if (typeNode.kind === ts.SyntaxKind.NumberKeyword) {
		return {type: "number"};
	}
	if (typeNode.kind === ts.SyntaxKind.BooleanKeyword) {
		return {type: "boolean"};
	}
	if (
		typeNode.kind === ts.SyntaxKind.NullKeyword ||
		typeNode.getText() === "null"
	) {
		return {type: "null"};
	}
	if (ts.isTypeReferenceNode(typeNode)) {
		const name = typeNode.typeName.getText();
		if (name === "Record" && typeNode.typeArguments?.length === 2) {
			const keyLabel = typeNode.typeArguments[0]!.getText();
			return {
				properties: {
					[`[${keyLabel}]`]: schemaFromTypeNode(typeNode.typeArguments[1]),
				},
			};
		}
		if (MANTINE_SCHEMA_INPUT_TYPE_NAMES.has(name)) {
			return mantineSchemaInputRef(name);
		}
		return {type: "unknown", name};
	}
	if (typeNode.kind === ts.SyntaxKind.UnknownKeyword) {
		return {type: "unknown", name: "unknown"};
	}
	return {type: "unknown", name: typeNode.getText()};
}

/**
 * Parse an exported interface from a `.ts` source file without `ts.createProgram`.
 */
export function parseInterfaceFromSourceFile(
	projectRoot: string,
	sourceFileRelative: string,
	interfaceName: string,
): DocTypeDefinition | undefined {
	const sourceFile = readSchemaInputSourceFile(projectRoot, sourceFileRelative);
	if (!sourceFile) return undefined;

	let iface: ts.InterfaceDeclaration | undefined;
	const visit = (node: ts.Node) => {
		if (iface) return;
		if (ts.isInterfaceDeclaration(node) && node.name.text === interfaceName) {
			iface = node;
			return;
		}
		ts.forEachChild(node, visit);
	};
	visit(sourceFile);
	if (!iface) return undefined;

	const properties: Record<
		string,
		DocTypeSchema & {description?: string; default?: string}
	> = {};
	for (const member of iface.members) {
		if (!ts.isPropertySignature(member) || !member.name) continue;
		const name = member.name.getText();
		const description = jsDocSummary(member);
		const defaultValue = jsDocDefault(member);
		properties[name] = {
			...schemaFromTypeNode(member.type),
			...(description ? {description} : {}),
			...(defaultValue ? {default: defaultValue} : {}),
		};
	}

	if (!Object.keys(properties).length) return undefined;
	return {properties};
}

function readSchemaInputSourceFile(
	projectRoot: string,
	sourceFileRelative: string,
): ts.SourceFile | undefined {
	const absPath = path.isAbsolute(sourceFileRelative)
		? sourceFileRelative
		: path.join(projectRoot, sourceFileRelative);
	if (!absPath.endsWith(".ts") || !fs.existsSync(absPath)) {
		return undefined;
	}
	const content = fs.readFileSync(absPath, "utf8");
	return ts.createSourceFile(
		absPath,
		content,
		ts.ScriptTarget.Latest,
		true,
		ts.ScriptKind.TS,
	);
}

/** Parse `export type` or `export interface` from a schema-input file. */
export function parseSchemaInputTypeDefinition(
	projectRoot: string,
	typeName: string,
): DocTypeDefinition | undefined {
	const sourceFileRelative = MANTINE_SCHEMA_INPUT_TYPE_SOURCES[typeName];
	if (!sourceFileRelative) return undefined;
	const sourceFile = readSchemaInputSourceFile(projectRoot, sourceFileRelative);
	if (!sourceFile) return undefined;

	let typeAlias: ts.TypeAliasDeclaration | undefined;
	let iface: ts.InterfaceDeclaration | undefined;
	const visit = (node: ts.Node) => {
		if (typeAlias || iface) return;
		if (ts.isTypeAliasDeclaration(node) && node.name.text === typeName) {
			typeAlias = node;
			return;
		}
		if (ts.isInterfaceDeclaration(node) && node.name.text === typeName) {
			iface = node;
		}
		ts.forEachChild(node, visit);
	};
	visit(sourceFile);

	if (typeAlias) {
		return schemaFromTypeNode(typeAlias.type) as DocTypeDefinition;
	}
	if (iface) {
		return parseInterfaceFromSourceFile(
			projectRoot,
			sourceFileRelative,
			typeName,
		);
	}
	return undefined;
}

/** Register all mantine-props primitive / shared types into doc `definitions`. */
export function seedMantineSchemaInputTypeDefinitions(
	projectRoot: string,
	definitions: Record<string, DocTypeDefinition>,
): void {
	for (const typeName of MANTINE_SCHEMA_INPUT_TYPE_NAMES) {
		const parsed = parseSchemaInputTypeDefinition(projectRoot, typeName);
		if (parsed) {
			definitions[typeName] = parsed;
		}
	}
}

/** @deprecated Use {@link parseInterfaceFromSourceFile} */
export function parseSchemaInputInterface(
	projectRoot: string,
	sourceFileRelative: string,
	interfaceName: string,
): DocTypeDefinition | undefined {
	if (!isSchemaInputRelativePath(sourceFileRelative)) return undefined;
	return parseInterfaceFromSourceFile(
		projectRoot,
		sourceFileRelative,
		interfaceName,
	);
}


/** Maps `@mantine/core` `{Component}Props` to mantine-props mirror interface name. */
export function mantineMirrorForCorePropsName(
	corePropsName: string,
): string | undefined {
	if (corePropsName.startsWith("Mantine")) return undefined;
	const match = /^([A-Z][A-Za-z]*)Props$/.exec(corePropsName);
	if (!match) return undefined;
	return `Mantine${match[1]}Props`;
}

export function mantineMirrorSchemaInputRelativePath(
	mirrorInterfaceName: string,
): string | undefined {
	const match = /^Mantine([A-Z][A-Za-z]*)Props$/.exec(mirrorInterfaceName);
	if (!match) return undefined;
	const fileBase =
		match[1].charAt(0).toLowerCase() + match[1].slice(1);
	return `src/shared/shared/mantine-props/${fileBase}.schema-input.ts`;
}

/** Resolve serializable props from mantine-props schema-input for core or mirror names. */
/** Theme doc keys that alias a mirrored `@mantine/core` props type. */
const MANTINE_CORE_PROPS_DOC_ALIASES: Record<string, string> = {
	SelectButtonStyleProps: "ButtonProps",
	SelectTextWeightedStyleProps: "TextProps",
	SelectTextStyleProps: "TextProps",
	SelectCardStyleProps: "CardProps",
	SelectImageStyleProps: "ImageProps",
	SelectFlexStyleProps: "FlexProps",
	SelectGroupStyleProps: "GroupProps",
	SelectStackStyleProps: "StackProps",
	Unknown_and_Partial_IconProps: "IconProps",
	Partial_IconProps: "IconProps",
};

/** `$ref` for theme doc aliases that map to a mirrored Mantine props definition. */
export function resolveDocRefForAliasedType(
	projectRoot: string,
	typeName: string,
): DocTypeSchema | undefined {
	const targetKey = MANTINE_CORE_PROPS_DOC_ALIASES[typeName];
	if (!targetKey) return undefined;
	if (!resolveMantineCorePropsMirrorForDocKey(projectRoot, targetKey)) {
		return undefined;
	}
	return {$ref: `${DEFINITIONS_REF_PREFIX}${targetKey}`};
}

/** `$ref` when `typeName` has a mantine-props mirror or alias target. */
export function resolveDocRefForTypeName(
	projectRoot: string,
	typeName: string,
): DocTypeSchema | undefined {
	return (
		resolveDocRefForAliasedType(projectRoot, typeName) ??
		(resolveMantineCorePropsMirrorForDocKey(projectRoot, typeName)
			? {$ref: `${DEFINITIONS_REF_PREFIX}${typeName}`}
			: undefined)
	);
}

const SPECIAL_MIRROR_DEFINITIONS: Record<
	string,
	{relativePath: string; interfaceName: string}
> = {
	MantineThemeOverride: {
		relativePath:
			"src/shared/shared/mantine-props/themeOverride.schema-input.ts",
		interfaceName: "MantineThemeOverrideProps",
	},
};

/** Resolve mirror for a definition key (core or alias name). */
export function resolveMantineCorePropsMirrorForDocKey(
	projectRoot: string,
	definitionKey: string,
): DocTypeDefinition | undefined {
	const special = SPECIAL_MIRROR_DEFINITIONS[definitionKey];
	if (special) {
		return parseInterfaceFromSourceFile(
			projectRoot,
			special.relativePath,
			special.interfaceName,
		);
	}
	const coreName =
		MANTINE_CORE_PROPS_DOC_ALIASES[definitionKey] ?? definitionKey;
	return resolveMantineCorePropsMirror(projectRoot, coreName);
}

export function resolveMantineCorePropsMirror(
	projectRoot: string,
	typeName: string,
): DocTypeDefinition | undefined {
	const mirrorInterfaceName =
		mantineMirrorForCorePropsName(typeName) ??
		(/^Mantine[A-Z][A-Za-z]*Props$/.test(typeName) ? typeName : undefined);
	if (!mirrorInterfaceName) return undefined;
	const relativePath =
		mantineMirrorSchemaInputRelativePath(mirrorInterfaceName);
	if (!relativePath) return undefined;
	return parseInterfaceFromSourceFile(
		projectRoot,
		relativePath,
		mirrorInterfaceName,
	);
}

export function isSchemaInputRelativePath(relativePath: string): boolean {
	return relativePath.replace(/\\/g, "/").endsWith(".schema-input.ts");
}

export function isLocalTypesSourcePath(relativePath: string): boolean {
	const normalized = relativePath.replace(/\\/g, "/");
	return (
		normalized.endsWith(".types.ts") ||
		normalized.endsWith(".theme.types.ts") ||
		isSchemaInputRelativePath(normalized)
	);
}
