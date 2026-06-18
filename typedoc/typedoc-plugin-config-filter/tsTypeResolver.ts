import * as fs from "fs";
import * as path from "path";
import ts from "typescript";
import {
	isLocalTypesSourcePath,
	mantineMirrorSchemaInputRelativePath,
	parseInterfaceFromSourceFile,
	resolveDocRefForTypeName,
	resolveMantineCorePropsMirror,
} from "./mantineMirrorParser.ts";
import {
	compactISelectComponentOverridesValueSchema,
	MANTINE_RESPONSIVE_CSS_SIZE_REF,
	matchesMantineResponsiveCssSize,
	recordSchemaFromParts,
	valueSchemaFromExpanded,
} from "./recordTypeSchema.ts";
import type {DocTypeDefinition, DocTypeSchema} from "./typeDefinitions.ts";

type TypeDocTypeNode = {
	type?: string;
	name?: string;
	value?: unknown;
	types?: unknown[];
	typeArguments?: unknown[];
	_target?: {
		fileName?: string;
		qualifiedName?: string;
		packageName?: string;
		packagePath?: string;
	};
	reflection?: {name?: string};
};

const MAX_RESOLVE_DEPTH = 12;
const MAX_CACHED_PROGRAMS = 6;

/** Mantine types that must stay expandable (responsive/style props). */
const MANTINE_TS_EXPAND_ALLOWLIST = new Set(["MantineStyleProps"]);

const MANTINE_BREAKPOINT_KEYS = new Set(["xs", "sm", "md", "lg", "xl", "base"]);

function stringLiteralKeysFromType(type: ts.Type): string[] {
	if (type.flags & ts.TypeFlags.StringLiteral) {
		return [(type as ts.StringLiteralType).value];
	}
	if (!type.isUnion()) return [];
	const keys: string[] = [];
	for (const member of type.types) {
		if (member.flags & ts.TypeFlags.StringLiteral) {
			keys.push((member as ts.StringLiteralType).value);
		}
	}
	return keys;
}

function unwrapPartialRecord(
	type: ts.Type,
): {keys: string[]; valueType: ts.Type} | undefined {
	if (type.aliasSymbol?.getName() !== "Partial") return undefined;
	const recordType = type.aliasTypeArguments?.[0];
	if (!recordType || recordType.aliasSymbol?.getName() !== "Record") {
		return undefined;
	}
	const keyType = recordType.aliasTypeArguments?.[0];
	const valueType = recordType.aliasTypeArguments?.[1];
	if (!valueType) return undefined;

	const keys = stringLiteralKeysFromType(keyType).filter((key) =>
		MANTINE_BREAKPOINT_KEYS.has(key),
	);
	return {
		keys: keys.length ? keys : ["xs", "sm", "md", "lg", "xl"],
		valueType,
	};
}

function isBreakpointOnlyObject(type: ts.Type): boolean {
	const names = type
		.getProperties()
		.map((symbol) => symbol.getName())
		.filter((name) => MANTINE_BREAKPOINT_KEYS.has(name));
	return names.length >= 3 && names.length === type.getProperties().length;
}

function isPrimitiveSchema(schema: DocTypeSchema): boolean {
	return (
		"type" in schema &&
		schema.type !== "unknown" &&
		!("oneOf" in schema) &&
		!("properties" in schema) &&
		!("items" in schema) &&
		!("$ref" in schema)
	);
}

function isPlainStringSchema(schema: DocTypeSchema): boolean {
	return (
		schema.type === "string" &&
		(schema as {const?: string})["const"] === undefined &&
		(schema as {enum?: string[]})["enum"] === undefined
	);
}

export type SchemaSimplifyOptions = {
	/** Keep mirror enum/const unions and property JSDoc when simplifying schema-input shapes. */
	preserveMirrorFidelity?: boolean;
};

type MirrorPropertyMeta = {description?: string; default?: string};

function extractMirrorPropertyMeta(schema: DocTypeSchema): MirrorPropertyMeta {
	const meta: MirrorPropertyMeta = {};
	const withMeta = schema as MirrorPropertyMeta;
	if (withMeta.description) meta.description = withMeta.description;
	if (withMeta.default) meta.default = withMeta.default;
	return meta;
}

function applyMirrorPropertyMeta(
	schema: DocTypeSchema,
	meta: MirrorPropertyMeta,
): DocTypeSchema {
	if (!meta.description && !meta.default) return schema;
	return {
		...schema,
		...(meta.description ? {description: meta.description} : {}),
		...(meta.default ? {default: meta.default} : {}),
	};
}

function schemaHasStringEnum(schema: DocTypeSchema): boolean {
	if (schema.type === "string") {
		const e = (schema as {enum?: string[]}).enum;
		return Boolean(e?.length);
	}
	if ("oneOf" in schema && schema.oneOf) {
		return schema.oneOf.some(schemaHasStringEnum);
	}
	return false;
}

const MANTINE_THEME_DOC_LINK = "https://mantine.dev/theming/theme-object/";

const TYPE_DENYLIST_DOC_LINKS: Record<string, string> = {
	MantineTheme: MANTINE_THEME_DOC_LINK,
	MantineThemeOverride: MANTINE_THEME_DOC_LINK,
};

/** React/TS iterator pollution from expanded children unions — not real config keys. */
export function isInvalidPropertyName(name: string): boolean {
	if (name.startsWith("__@")) return true;
	if (name.startsWith("Symbol.")) return true;
	if (name.includes("iterator")) return true;
	return false;
}

/** DOM/React synthetic event handlers are not JSON-configurable. */
export function isDomEventHandlerTypeName(name: string): boolean {
	return /EventHandler/.test(name);
}

/** Expanded ReactElement object shape (type/props/key) — stub instead of recursing children. */
export function isReactElementLikeSchema(schema: DocTypeSchema): boolean {
	if (!("properties" in schema) || !schema.properties) return false;
	const keys = Object.keys(schema.properties);
	return (
		keys.includes("type") && keys.includes("props") && keys.includes("key")
	);
}

/** Collapse recursive ReactElement expansions in unions to a single ReactNode stub. */
export function compactReactNodeSchema(
	schema: DocTypeSchema,
	options?: SchemaSimplifyOptions,
): DocTypeSchema {
	const meta = options?.preserveMirrorFidelity
		? extractMirrorPropertyMeta(schema)
		: {};
	if (isReactElementLikeSchema(schema)) {
		return applyMirrorPropertyMeta(
			{type: "unknown", name: "ReactNode"},
			meta,
		);
	}
	if ("oneOf" in schema && schema.oneOf) {
		const simplified = simplifySchema(
			{
				oneOf: schema.oneOf.map((member) =>
					compactReactNodeSchema(member, options),
				),
			},
			options,
		);
		return applyMirrorPropertyMeta(simplified, meta);
	}
	if ("properties" in schema && schema.properties) {
		const properties: Record<string, DocTypeSchema> = {};
		for (const [key, value] of Object.entries(schema.properties)) {
			properties[key] = compactReactNodeSchema(value, options);
		}
		return {properties};
	}
	if ("items" in schema && schema.items) {
		return {
			items: compactReactNodeSchema(schema.items, options),
		};
	}
	return applyMirrorPropertyMeta(schema, meta);
}

function isMantineCoreTarget(
	target: {packageName?: string; fileName?: string} | undefined,
): boolean {
	const pkg = target?.packageName ?? "";
	const file = target?.fileName ?? "";
	return (
		pkg.startsWith("@mantine/") ||
		file.includes(`${path.sep}@mantine${path.sep}`)
	);
}

export function shouldStubMantineExpandedProps(
	qualifiedName: string,
	propCount: number,
	target?: {packageName?: string; fileName?: string},
): boolean {
	if (!isMantineCoreTarget(target)) return false;
	if (propCount > 80) return true;
	if (qualifiedName.endsWith("Props") && propCount > 50) return true;
	return false;
}

export function isMantineCorePackageTarget(
	target: {packageName?: string; fileName?: string} | undefined,
): boolean {
	return isMantineCoreTarget(target);
}

function mantinePropsStubDefinition(
	qualifiedName: string,
	propCount: number,
	docLinkFor: (name: string) => string | undefined,
): DocTypeDefinition {
	const docLink = docLinkFor(qualifiedName);
	return {
		type: "unknown",
		name: `${qualifiedName} (${propCount} props — see Mantine docs)`,
		...(docLink ? {docLink} : {}),
	};
}

/** Short labels for types that are not JSON-configurable but appear in Mantine/React props. */
export function normalizeUnknownTypeName(name: string): string {
	if (
		/ReactNode|ReactElement|ReactPortal|React\.|JSXElementConstructor/i.test(
			name,
		) ||
		/^Iterable<React/i.test(name) ||
		name.includes("__@iterator@")
	) {
		return "ReactNode";
	}
	if (
		name === "ComponentConstructor" ||
		/^new \(props/i.test(name) ||
		/\bConstructor\b/.test(name)
	) {
		return "ReactNode";
	}
	if (isDomEventHandlerTypeName(name)) {
		return "Function";
	}
	if (/Partial<Record<`--/.test(name)) {
		return "ResponsiveCSSVariables";
	}
	if (
		name === "CSSProperties" ||
		name.includes("CSSProperties") ||
		/^\(theme: MantineTheme\)/.test(name) ||
		/\(theme:\s*MantineTheme/.test(name)
	) {
		return "CSSProperties";
	}
	if (name.length > 120) {
		const fnMatch = /^\([^)]*\)\s*=>\s*/.exec(name);
		if (fnMatch) {
			return "Function";
		}
		return `${name.slice(0, 80)}…`;
	}
	return name;
}

function denylistedTypeSchema(typeName: string): DocTypeDefinition | undefined {
	const docLink = TYPE_DENYLIST_DOC_LINKS[typeName];
	if (!docLink) return undefined;
	return {type: "unknown", name: typeName, docLink};
}

function isIntrinsicPrimitiveTsType(type: ts.Type): boolean {
	return !!(
		type.flags &
		(ts.TypeFlags.String | ts.TypeFlags.Number | ts.TypeFlags.Boolean)
	);
}

function isReactNodeSchema(schema: DocTypeSchema): boolean {
	return (
		schema.type === "unknown" &&
		normalizeUnknownTypeName(schema.name) === "ReactNode"
	);
}

function memberDedupKey(member: DocTypeSchema): string {
	if ("oneOf" in member && member.oneOf) {
		return `oneOf:${member.oneOf.length}`;
	}
	if ("properties" in member && member.properties) {
		return `properties:${Object.keys(member.properties).sort().join(",")}`;
	}
	if (member.type === "unknown" && member.name) {
		return `unknown:${normalizeUnknownTypeName(member.name)}`;
	}
	if (member.type === "boolean") {
		const c = (member as {const?: boolean}).const;
		return typeof c === "boolean" ? `boolean:${c}` : "boolean";
	}
	if (member.type === "string") {
		const c = (member as {const?: string}).const;
		const e = (member as {enum?: string[]}).enum;
		if (typeof c === "string") return `string:${c}`;
		if (e?.length) return `string:enum:${e.join("|")}`;
		return "string";
	}
	if (member.type === "number") {
		const c = (member as {const?: number}).const;
		return typeof c === "number" ? `number:${c}` : "number";
	}
	return JSON.stringify(member);
}

/** Recursively simplify unions and nested property/item schemas. */
export function deepSimplifySchema(
	schema: DocTypeSchema,
	options?: SchemaSimplifyOptions,
): DocTypeSchema {
	const meta = options?.preserveMirrorFidelity
		? extractMirrorPropertyMeta(schema)
		: {};
	if ("properties" in schema && schema.properties) {
		const properties: Record<string, DocTypeSchema> = {};
		for (const [key, value] of Object.entries(schema.properties)) {
			properties[key] = deepSimplifySchema(value, options);
		}
		return applyMirrorPropertyMeta(
			compactReactNodeSchema(
				simplifySchema({...schema, properties}, options),
				options,
			),
			meta,
		);
	}
	if ("items" in schema && schema.items) {
		return applyMirrorPropertyMeta(
			compactReactNodeSchema(
				simplifySchema(
					{
						...schema,
						items: deepSimplifySchema(schema.items, options),
					},
					options,
				),
				options,
			),
			meta,
		);
	}
	return applyMirrorPropertyMeta(
		compactReactNodeSchema(simplifySchema(schema, options), options),
		meta,
	);
}

/** Collapse unions of string/number literals into `enum` for readable doc-flat output. */
export function simplifySchema(
	schema: DocTypeSchema,
	options?: SchemaSimplifyOptions,
): DocTypeSchema {
	if (!("oneOf" in schema) || !schema.oneOf?.length) {
		return schema;
	}

	const members = schema.oneOf.map((member) =>
		simplifySchema(member, options),
	);
	const stringEnums: string[] = [];
	const numberEnums: number[] = [];
	const rest: DocTypeSchema[] = [];

	for (const member of members) {
		const stringConst =
			member.type === "string"
				? (member as {const?: string})["const"]
				: undefined;
		if (typeof stringConst === "string") {
			stringEnums.push(stringConst);
			continue;
		}
		const quotedUnknown =
			member.type === "unknown" && /^"([^"]+)"$/.test(member.name);
		if (quotedUnknown) {
			stringEnums.push(member.name.slice(1, -1));
			continue;
		}
		const numberConst =
			member.type === "number"
				? (member as {const?: number})["const"]
				: undefined;
		if (typeof numberConst === "number") {
			numberEnums.push(numberConst);
			continue;
		}
		if (member.type === "unknown" && member.name === "string & {}") {
			rest.push({type: "string"});
			continue;
		}
		if (isReactElementLikeSchema(member)) {
			rest.push({type: "unknown", name: "ReactNode"});
			continue;
		}
		if (member.type === "unknown" && member.name) {
			rest.push({
				type: "unknown",
				name: normalizeUnknownTypeName(member.name),
			});
			continue;
		}
		rest.push(member);
	}

	const combined: DocTypeSchema[] = [];
	if (numberEnums.length === 1) {
		combined.push({type: "number", const: numberEnums[0]});
	} else if (numberEnums.length > 1) {
		combined.push({
			type: "number",
			enum: [...new Set(numberEnums)],
		});
	}
	if (stringEnums.length === 1) {
		combined.push({type: "string", const: stringEnums[0]});
	} else if (stringEnums.length > 1) {
		const unique = [...new Set(stringEnums)];
		if (unique.length) {
			combined.push({
				type: "string",
				enum: unique,
			});
		}
	}
	const dedupedRest: DocTypeSchema[] = [];
	const seenKeys = new Set<string>();
	let hasPlainString = false;
	let hasReactNode = false;
	for (const member of rest) {
		if (isPlainStringSchema(member)) {
			if (hasPlainString) continue;
			hasPlainString = true;
		}
		if (isReactNodeSchema(member)) {
			if (hasReactNode) continue;
			hasReactNode = true;
		}
		const key = memberDedupKey(member);
		if (seenKeys.has(key)) continue;
		seenKeys.add(key);
		dedupedRest.push(member);
	}
	combined.push(...dedupedRest);

	if (combined.length === 0) {
		return {type: "unknown", name: "empty union"};
	}
	if (combined.length === 1) {
		const only = combined[0]!;
		if (
			options?.preserveMirrorFidelity &&
			isPlainStringSchema(only) &&
			(stringEnums.length > 0 || schemaHasStringEnum(schema))
		) {
			return {oneOf: combined};
		}
		return only;
	}
	if (
		options?.preserveMirrorFidelity &&
		stringEnums.length > 0 &&
		hasPlainString
	) {
		return {oneOf: combined};
	}
	return {oneOf: combined};
}

/** Overlay mirror schema-input props onto a TS-built definition, keeping mirror types and JSDoc. */
export function mergeMirrorDefinitionOverlay(
	built: DocTypeDefinition,
	fromMirror: DocTypeDefinition,
): DocTypeDefinition {
	if (!("properties" in fromMirror) || !fromMirror.properties) {
		return fromMirror;
	}
	const builtProps =
		"properties" in built && built.properties ? built.properties : {};
	const properties: Record<string, DocTypeSchema & MirrorPropertyMeta> = {};
	const mirrorOptions: SchemaSimplifyOptions = {preserveMirrorFidelity: true};
	for (const [key, mirrorProp] of Object.entries(fromMirror.properties)) {
		const builtProp = builtProps[key] as
			| (DocTypeSchema & MirrorPropertyMeta)
			| undefined;
		const simplified = deepSimplifySchema(mirrorProp, mirrorOptions);
		const mirrorMeta = extractMirrorPropertyMeta(mirrorProp);
		const builtMeta = builtProp ? extractMirrorPropertyMeta(builtProp) : {};
		properties[key] = applyMirrorPropertyMeta(simplified, {
			description: mirrorMeta.description ?? builtMeta.description,
			default: mirrorMeta.default ?? builtMeta.default,
		});
	}
	return {properties};
}

/**
 * Resolves Mantine / lib .d.ts types via the TypeScript checker when TypeDoc
 * only provides an unresolved reference (e.g. Omit<ImageProps, "src">).
 */
const COMPILER_OPTIONS: ts.CompilerOptions = {
	jsx: ts.JsxEmit.React,
	skipLibCheck: true,
	moduleResolution: ts.ModuleResolutionKind.NodeJs,
	allowSyntheticDefaultImports: true,
	esModuleInterop: true,
};

export function createTsTypeResolver(projectRoot: string) {
	const programByEntry = new Map<string, ts.Program>();
	let sourceFileContext: string | undefined;

	function getProgramForEntry(entryPath: string): ts.Program | undefined {
		const normalized = path.normalize(entryPath);
		if (!fs.existsSync(normalized)) return undefined;
		let program = programByEntry.get(normalized);
		if (!program) {
			if (programByEntry.size >= MAX_CACHED_PROGRAMS) {
				const oldest = programByEntry.keys().next().value;
				if (oldest) programByEntry.delete(oldest);
			}
			program = ts.createProgram([normalized], COMPILER_OPTIONS);
			programByEntry.set(normalized, program);
		}
		return program;
	}

	function getProgramForFile(
		absoluteFilePath: string,
	): ts.Program | undefined {
		const normalized = path.normalize(absoluteFilePath);
		if (!fs.existsSync(normalized)) return undefined;

		// Prefer a single declaration file — avoids loading full @mantine package indexes.
		const directProgram = getProgramForEntry(normalized);
		if (directProgram?.getSourceFile(normalized)) {
			return directProgram;
		}

		const mantineCoreMatch = normalized.match(
			/(.*@mantine[/\\][^/\\]+)[/\\]/,
		);
		if (mantineCoreMatch) {
			const pkgDir = mantineCoreMatch[1];
			const indexCandidates = [
				path.join(pkgDir, "lib", "index.d.ts"),
				path.join(pkgDir, "esm", "index.d.mts"),
			];
			for (const entry of indexCandidates) {
				if (fs.existsSync(entry)) {
					return getProgramForEntry(entry);
				}
			}
		}

		if (normalized.includes("viewer.shared.types")) {
			return getProgramForEntry(
				path.join(
					projectRoot,
					"node_modules/@shapediver/viewer.shared.types/dist/index.d.ts",
				),
			);
		}

		return directProgram;
	}

	function clearPrograms(): void {
		programByEntry.clear();
	}

	function findDeclarationInFile(
		sourceFile: ts.SourceFile,
		qualifiedName: string,
	): ts.Node | undefined {
		const parts = qualifiedName.split(".");
		const leaf = parts[parts.length - 1];
		let found: ts.Node | undefined;

		const visit = (node: ts.Node) => {
			if (found) return;
			const isMatch =
				(ts.isInterfaceDeclaration(node) ||
					ts.isTypeAliasDeclaration(node) ||
					ts.isEnumDeclaration(node)) &&
				node.name.text === leaf;
			if (isMatch) {
				found = node;
				return;
			}
			ts.forEachChild(node, visit);
		};
		visit(sourceFile);
		return found;
	}

	const PROTOTYPE_METHOD_NAMES = new Set([
		"toString",
		"charAt",
		"charCodeAt",
		"toFixed",
		"toExponential",
		"toPrecision",
		"valueOf",
		"toLocaleString",
	]);

	function isPlainObjectType(type: ts.Type): boolean {
		if (isIntrinsicPrimitiveTsType(type)) return false;
		const props = type.getProperties();
		if (props.length === 0 || props.length > 40) return false;
		const names = props.map((symbol) => symbol.getName());
		if (names.some((name) => PROTOTYPE_METHOD_NAMES.has(name))) {
			return false;
		}
		return true;
	}

	function schemaFromPlainObject(
		checker: ts.TypeChecker,
		type: ts.Type,
		depth: number,
	): DocTypeSchema | undefined {
		if (!isPlainObjectType(type)) return undefined;
		const properties: Record<string, DocTypeSchema> = {};
		for (const symbol of type.getProperties()) {
			const name = symbol.getName();
			if (isInvalidPropertyName(name)) continue;
			const decl = symbol.valueDeclaration ?? symbol.declarations?.[0];
			const propType = decl
				? checker.getTypeOfSymbolAtLocation(symbol, decl)
				: checker.getTypeOfSymbol(symbol);
			properties[name] = schemaFromTsType(checker, propType, depth + 1);
		}
		return Object.keys(properties).length ? {properties} : undefined;
	}

	function schemaFromTsType(
		checker: ts.TypeChecker,
		type: ts.Type,
		depth: number,
	): DocTypeSchema {
		if (depth > MAX_RESOLVE_DEPTH) {
			return {
				type: "unknown",
				name: normalizeUnknownTypeName(checker.typeToString(type)),
			};
		}

		const aliasName = type.aliasSymbol?.getName();
		if (aliasName && TYPE_DENYLIST_DOC_LINKS[aliasName]) {
			return denylistedTypeSchema(aliasName)!;
		}
		if (aliasName) {
			const aliasRef = resolveDocRefForTypeName(projectRoot, aliasName);
			if (aliasRef) return aliasRef;
		}

		if (type.flags & ts.TypeFlags.StringLiteral) {
			return {
				type: "string",
				const: (type as ts.StringLiteralType).value,
			};
		}
		if (type.flags & ts.TypeFlags.NumberLiteral) {
			return {
				type: "number",
				const: (type as ts.NumberLiteralType).value,
			};
		}
		if (type.flags & ts.TypeFlags.BooleanLiteral) {
			return {
				type: "boolean",
				const: (type as ts.BooleanLiteralType).value,
			};
		}

		if (type.flags & ts.TypeFlags.String) return {type: "string"};
		if (type.flags & ts.TypeFlags.Number) return {type: "number"};
		if (type.flags & ts.TypeFlags.Boolean) return {type: "boolean"};
		if (type.flags & ts.TypeFlags.Null) return {type: "null"};
		if (type.flags & ts.TypeFlags.Undefined) {
			return {type: "unknown", name: "undefined"};
		}

		if (type.isUnion()) {
			const simplified = simplifySchema({
				oneOf: type.types.map((member) =>
					schemaFromTsType(checker, member, depth + 1),
				),
			});
			if (matchesMantineResponsiveCssSize(simplified)) {
				return MANTINE_RESPONSIVE_CSS_SIZE_REF;
			}
			return simplified;
		}

		if (checker.isArrayType(type) || checker.isTupleType(type)) {
			const elementType = (
				checker.getTypeArguments(type as ts.TypeReference) as
					| ts.Type[]
					| undefined
			)?.[0];
			if (elementType) {
				return {
					items: simplifySchema(
						schemaFromTsType(checker, elementType, depth + 1),
					),
				};
			}
		}

		const partialRecord = unwrapPartialRecord(type);
		if (partialRecord) {
			const valueSchema = schemaFromTsType(
				checker,
				partialRecord.valueType,
				depth + 1,
			);
			const properties: Record<string, DocTypeSchema> = {};
			for (const key of partialRecord.keys) {
				properties[key] = valueSchema;
			}
			return {properties};
		}

		if (isBreakpointOnlyObject(type)) {
			const properties: Record<string, DocTypeSchema> = {};
			for (const symbol of type.getProperties()) {
				const name = symbol.getName();
				if (!MANTINE_BREAKPOINT_KEYS.has(name)) continue;
				const decl =
					symbol.valueDeclaration ?? symbol.declarations?.[0];
				const propType = decl
					? checker.getTypeOfSymbolAtLocation(symbol, decl)
					: checker.getTypeOfSymbol(symbol);
				properties[name] = schemaFromTsType(
					checker,
					propType,
					depth + 1,
				);
			}
			if (Object.keys(properties).length) {
				return {properties};
			}
		}

		const plainObject = schemaFromPlainObject(checker, type, depth);
		if (plainObject) {
			return deepSimplifySchema(plainObject);
		}

		const stringRepr = checker.typeToString(type);
		const denylisted = TYPE_DENYLIST_DOC_LINKS[stringRepr];
		if (denylisted) {
			return {type: "unknown", name: stringRepr, docLink: denylisted};
		}
		if (stringRepr === "string" || stringRepr === "string & {}") {
			return {type: "string"};
		}
		if (stringRepr === "number") {
			return {type: "number"};
		}
		if (stringRepr === "boolean") {
			return {type: "boolean"};
		}
		if (stringRepr === "any") {
			return {type: "unknown", name: stringRepr};
		}

		const normalized = normalizeUnknownTypeName(stringRepr);
		const namedType = /^[A-Za-z][\w]*$/.test(stringRepr)
			? stringRepr
			: /^[A-Za-z][\w]*$/.test(normalized)
				? normalized
				: undefined;
		if (namedType) {
			const namedRef = resolveDocRefForTypeName(projectRoot, namedType);
			if (namedRef) return namedRef;
		}

		if (normalized !== stringRepr) {
			return {type: "unknown", name: normalized};
		}

		return {type: "unknown", name: stringRepr};
	}

	function jsDocSummaryForMember(
		checker: ts.TypeChecker,
		member: ts.PropertySignature,
	): string | undefined {
		for (const tag of ts.getJSDocCommentsAndTags(member)) {
			if (!ts.isJSDoc(tag)) continue;
			const comment = tag.comment;
			if (typeof comment === "string" && comment.trim()) {
				return comment.trim();
			}
			if (Array.isArray(comment)) {
				const text = comment
					.map((part) => part.text)
					.join("")
					.trim();
				if (text) return text;
			}
		}
		const fromSymbol = ts
			.displayPartsToString(
				member.symbol?.getDocumentationComment(checker) ?? [],
			)
			.trim();
		return fromSymbol || undefined;
	}

	function jsDocDefaultForMember(
		member: ts.PropertySignature,
	): string | undefined {
		for (const tag of ts.getJSDocCommentsAndTags(member)) {
			if (!ts.isJSDocTag(tag) || tag.tagName.text !== "default") continue;
			const comment = tag.comment;
			if (typeof comment === "string" && comment.trim()) {
				return comment.trim();
			}
			if (Array.isArray(comment)) {
				return (
					comment
						.map((part) => part.text)
						.join("")
						.trim() || undefined
				);
			}
		}
		return undefined;
	}

	function propertiesFromDeclarationMembers(
		checker: ts.TypeChecker,
		node: ts.InterfaceDeclaration | ts.TypeLiteralNode,
	): Record<
		string,
		DocTypeSchema & {description?: string; default?: string}
	> {
		const props: Record<
			string,
			DocTypeSchema & {description?: string; default?: string}
		> = {};
		const members = ts.isInterfaceDeclaration(node)
			? node.members
			: node.members;
		for (const member of members) {
			if (!ts.isPropertySignature(member) || !member.name) continue;
			const name = member.name.getText();
			if (isInvalidPropertyName(name)) continue;
			const propType = checker.getTypeAtLocation(member);
			const description = jsDocSummaryForMember(checker, member);
			const defaultValue = jsDocDefaultForMember(member);
			props[name] = {
				...deepSimplifySchema(schemaFromTsType(checker, propType, 0)),
				...(description ? {description} : {}),
				...(defaultValue ? {default: defaultValue} : {}),
			};
		}
		return props;
	}

	function propertiesFromTsType(
		checker: ts.TypeChecker,
		type: ts.Type,
		omitKeys?: readonly string[],
		pickKeys?: readonly string[],
	): Record<string, DocTypeSchema & {description?: string}> {
		const props: Record<string, DocTypeSchema & {description?: string}> =
			{};

		for (const symbol of type.getProperties()) {
			const name = symbol.getName();
			if (isInvalidPropertyName(name)) continue;
			if (omitKeys?.includes(name)) continue;
			if (pickKeys?.length && !pickKeys.includes(name)) continue;

			if (name === "themeOverride") {
				props[name] = {
					type: "unknown",
					name: "MantineThemeOverride",
					docLink: MANTINE_THEME_DOC_LINK,
				};
				continue;
			}

			const decl = symbol.valueDeclaration ?? symbol.declarations?.[0];
			const propType = decl
				? checker.getTypeOfSymbolAtLocation(symbol, decl)
				: checker.getTypeOfSymbol(symbol);

			const description = decl
				? ts.displayPartsToString(
						symbol.getDocumentationComment(checker),
					)
				: undefined;

			const propSchema = deepSimplifySchema(
				schemaFromTsType(checker, propType, 0),
			);
			const propName = propType.aliasSymbol?.getName() ?? name;
			const declFile = decl?.getSourceFile()?.fileName ?? "";
			if (
				declFile.includes("@mantine/core") &&
				propName.endsWith("Props") &&
				propSchema.type === "unknown" &&
				!("properties" in propSchema)
			) {
				const docLink = mantineDocLinkForProps(propName);
				if (docLink) {
					props[name] = {
						...propSchema,
						docLink,
						...(description ? {description} : {}),
					};
					continue;
				}
			}
			props[name] = {
				...propSchema,
				...(description ? {description} : {}),
			};
		}

		return props;
	}

	function resolveDeclarationPath(
		target: NonNullable<TypeDocTypeNode["_target"]>,
	): string | undefined {
		if (target.packageName && target.packagePath) {
			const pkgRoot = path.join(
				projectRoot,
				"node_modules",
				target.packageName,
			);
			const fromPackage = path.join(pkgRoot, target.packagePath);
			if (fs.existsSync(fromPackage)) {
				return path.normalize(fromPackage);
			}
		}
		if (target.fileName && fs.existsSync(target.fileName)) {
			return path.normalize(target.fileName);
		}
		return undefined;
	}

	function getSourceFileInProgram(
		program: ts.Program,
		declarationPath: string,
	): ts.SourceFile | undefined {
		const normalized = path.normalize(declarationPath);
		const resolved = path.resolve(normalized);
		return (
			program.getSourceFile(normalized) ??
			program.getSourceFile(resolved) ??
			program
				.getSourceFiles()
				.find(
					(sf) =>
						path.normalize(sf.fileName) === resolved ||
						path.normalize(sf.fileName) === normalized,
				)
		);
	}

	function resolveTargetDeclaration(
		declarationPath: string,
		qualifiedName: string,
	): {checker: ts.TypeChecker; node: ts.Node} | undefined {
		const normalized = path.normalize(declarationPath);
		let program = getProgramForFile(normalized);
		let checker = program?.getTypeChecker();
		let sourceFile = program
			? getSourceFileInProgram(program, normalized)
			: undefined;

		if (!sourceFile) {
			program = getProgramForEntry(normalized);
			checker = program?.getTypeChecker();
			sourceFile = program?.getSourceFile(normalized);
		}

		if (!checker || !sourceFile) return undefined;
		const node = findDeclarationInFile(sourceFile, qualifiedName);
		if (!node) return undefined;
		return {checker, node};
	}

	function applyMirrorPickOmit(
		fromMirror: DocTypeDefinition,
		omitKeys?: readonly string[],
		pickKeys?: readonly string[],
	): DocTypeDefinition {
		if (!("properties" in fromMirror) || !fromMirror.properties) {
			return fromMirror;
		}
		if (!omitKeys?.length && !pickKeys?.length) {
			return fromMirror;
		}
		const filtered: Record<
			string,
			DocTypeSchema & {description?: string; default?: string}
		> = {};
		for (const [key, value] of Object.entries(fromMirror.properties)) {
			if (omitKeys?.includes(key)) continue;
			if (pickKeys?.length && !pickKeys.includes(key)) continue;
			filtered[key] = value;
		}
		if (!Object.keys(filtered).length) {
			return {properties: {}};
		}
		return deepSimplifySchema({properties: filtered});
	}

	function resolveReferenceTarget(
		ref: TypeDocTypeNode,
		omitKeys?: readonly string[],
		pickKeys?: readonly string[],
	): DocTypeDefinition | undefined {
		const refName = ref.name ?? ref._target?.qualifiedName;
		if (refName && TYPE_DENYLIST_DOC_LINKS[refName]) {
			return denylistedTypeSchema(refName);
		}

		const mirrorTypeName = ref._target?.qualifiedName ?? ref.name;
		if (mirrorTypeName) {
			const fromMirror = resolveMantineCorePropsMirror(
				projectRoot,
				mirrorTypeName,
			);
			if (fromMirror) {
				return applyMirrorPickOmit(fromMirror, omitKeys, pickKeys);
			}
		}

		const target = ref._target;
		if (!target?.qualifiedName) {
			return undefined;
		}

		const denylisted = denylistedTypeSchema(target.qualifiedName);
		if (denylisted) return denylisted;

		const qName = target.qualifiedName;
		if (
			isMantineCorePackageTarget(target) &&
			!omitKeys?.length &&
			!pickKeys?.length &&
			!MANTINE_TS_EXPAND_ALLOWLIST.has(qName) &&
			(qName.endsWith("Props") || qName.endsWith("StyleProps"))
		) {
			const fromMirror = resolveMantineCorePropsMirror(
				projectRoot,
				qName,
			);
			if (fromMirror) return fromMirror;
			return mantinePropsStubDefinition(
				qName,
				99,
				mantineDocLinkForProps,
			);
		}

		const declarationPath = resolveDeclarationPath(target);
		if (!declarationPath) return undefined;

		const resolved = resolveTargetDeclaration(
			declarationPath,
			target.qualifiedName,
		);
		if (!resolved) return undefined;

		const type = resolved.checker.getTypeAtLocation(resolved.node);
		const typeString = resolved.checker.typeToString(type);
		if (
			target.qualifiedName === "string" ||
			typeString === "string" ||
			typeString === "string & {}"
		) {
			return {type: "string"};
		}

		const inlineSchema = schemaFromTsType(resolved.checker, type, 0);
		const propSymbols = type.getProperties();
		const hasPrototypePollution = propSymbols.some((symbol) =>
			PROTOTYPE_METHOD_NAMES.has(symbol.getName()),
		);
		if (
			hasPrototypePollution &&
			(isPrimitiveSchema(inlineSchema) ||
				("oneOf" in inlineSchema && !("properties" in inlineSchema)))
		) {
			return inlineSchema;
		}

		const properties = propertiesFromTsType(
			resolved.checker,
			type,
			omitKeys,
			pickKeys,
		);
		if (
			Object.keys(properties).some((name) =>
				PROTOTYPE_METHOD_NAMES.has(name),
			)
		) {
			if ("oneOf" in inlineSchema || isPrimitiveSchema(inlineSchema)) {
				return inlineSchema;
			}
			return {
				type: "unknown",
				name: target.qualifiedName,
			};
		}
		if (!Object.keys(properties).length) {
			return undefined;
		}
		const propCount = Object.keys(properties).length;
		if (
			shouldStubMantineExpandedProps(
				target.qualifiedName,
				propCount,
				target,
			)
		) {
			return mantinePropsStubDefinition(
				target.qualifiedName,
				propCount,
				mantineDocLinkForProps,
			);
		}
		return deepSimplifySchema({properties});
	}

	function collectLiteralKeys(
		typeNode: TypeDocTypeNode | undefined,
	): string[] {
		if (!typeNode) return [];

		const kind = typeNode.type;
		if (kind === "literal" && typeof typeNode.value === "string") {
			return [typeNode.value];
		}
		if (kind === "union" && typeNode.types?.length) {
			const keys: string[] = [];
			for (const member of typeNode.types as TypeDocTypeNode[]) {
				keys.push(...collectLiteralKeys(member));
			}
			return keys;
		}
		return [];
	}

	function valueSchemaFromTypeDocNode(
		valueRef: TypeDocTypeNode,
	): DocTypeSchema {
		if (valueRef.name === "ISelectComponentOverrides") {
			return compactISelectComponentOverridesValueSchema();
		}
		if (valueRef.type === "union" && valueRef.types?.length) {
			const members = (valueRef.types as TypeDocTypeNode[]).map(
				(member) => valueSchemaFromTypeDocNode(member),
			);
			if (
				members.length === 2 &&
				members.some((member) => member.type === "string") &&
				members.some((member) => member.type === "number")
			) {
				return {oneOf: [{type: "string"}, {type: "number"}]};
			}
			return {oneOf: members};
		}
		if (valueRef.type === "intrinsic") {
			if (valueRef.name === "string") return {type: "string"};
			if (valueRef.name === "number") return {type: "number"};
			if (valueRef.name === "boolean") return {type: "boolean"};
		}
		let valueExpanded = resolveReferenceTarget(valueRef);
		if (!valueExpanded && valueRef.name) {
			valueExpanded = tryResolveLocalTypeName(valueRef.name);
		}
		return valueSchemaFromExpanded(
			valueExpanded,
			typeArgumentDisplayName(valueRef),
		);
	}

	function typeArgumentDisplayName(arg: TypeDocTypeNode | undefined): string {
		if (!arg) return "Unknown";
		if (typeof arg.name === "string" && arg.name.length) {
			return arg.name;
		}
		if (arg._target?.qualifiedName) {
			return arg._target.qualifiedName;
		}
		if (arg.type === "literal" && typeof arg.value === "string") {
			return arg.value;
		}
		return "Unknown";
	}

	function expandUtilityReference(
		utilityName: string,
		typeNode: TypeDocTypeNode,
		_preferredDefinitionName?: string,
	): DocTypeDefinition | undefined {
		const args = typeNode.typeArguments as TypeDocTypeNode[] | undefined;
		if (!args?.length) return undefined;

		const base = args[0];
		const keysArg = args[1];

		if (utilityName === "Partial") {
			const baseName = typeArgumentDisplayName(base);
			const fromMirror = resolveMantineCorePropsMirror(
				projectRoot,
				base._target?.qualifiedName ?? base.name ?? baseName,
			);
			if (fromMirror) {
				return fromMirror;
			}
			let expanded = resolveReferenceTarget(base);
			if (!expanded && base.name) {
				expanded = tryResolveLocalTypeName(base.name);
			}
			if (
				!expanded &&
				base.name === "IconProps" &&
				sourceFileContext?.includes("ViewportIconButton")
			) {
				expanded = tryResolvePropertyFromSourceType(
					"ViewportIconButtonThemeStyleProps",
					"iconProps",
					sourceFileContext,
				);
			}
			if (!expanded) return expanded;
			if (!("properties" in expanded)) return expanded;
			const propCount = Object.keys(expanded.properties).length;
			if (
				shouldStubMantineExpandedProps(
					baseName,
					propCount,
					base._target,
				)
			) {
				return mantinePropsStubDefinition(
					baseName,
					propCount,
					mantineDocLinkForProps,
				);
			}
			return expanded;
		}

		if (utilityName === "Omit") {
			const omitKeys = collectLiteralKeys(keysArg);
			const baseName = typeArgumentDisplayName(base);
			const fromMirror = resolveMantineCorePropsMirror(
				projectRoot,
				base._target?.qualifiedName ?? base.name ?? baseName,
			);
			if (fromMirror) {
				return applyMirrorPickOmit(fromMirror, omitKeys);
			}
			return resolveReferenceTarget(base, omitKeys);
		}

		if (utilityName === "Pick") {
			const pickKeys = collectLiteralKeys(keysArg);
			const baseName = typeArgumentDisplayName(base);
			const fromMirror = resolveMantineCorePropsMirror(
				projectRoot,
				base._target?.qualifiedName ?? base.name ?? baseName,
			);
			if (fromMirror) {
				return applyMirrorPickOmit(fromMirror, undefined, pickKeys);
			}
			const fromTarget = resolveReferenceTarget(
				base,
				undefined,
				pickKeys,
			);
			if (fromTarget) return fromTarget;
			if (!base.name) return undefined;
			const local = tryResolveLocalTypeName(base.name);
			if (!local || !("properties" in local) || !local.properties) {
				return undefined;
			}
			const picked: Record<
				string,
				DocTypeSchema & {description?: string}
			> = {};
			for (const key of pickKeys) {
				if (local.properties[key]) {
					picked[key] = local.properties[key];
				}
			}
			return Object.keys(picked).length
				? deepSimplifySchema({properties: picked})
				: undefined;
		}

		if (utilityName === "Record" && args.length >= 2) {
			const keyRef = args[0] as TypeDocTypeNode;
			const valueRef = args[1] as TypeDocTypeNode;
			const keyLabel = typeArgumentDisplayName(keyRef);
			return recordSchemaFromParts(
				keyLabel,
				valueSchemaFromTypeDocNode(valueRef),
			);
		}

		return undefined;
	}

	const LOCAL_TYPE_SOURCE_FALLBACKS: Record<string, string[]> = {
		IconProps: ["src/shared/shared/ui/icon/Icon.types.ts"],
		ViewportBranding: ["src/shared/entities/viewport/config/viewport.ts"],
		StargateStatusColorProps: [
			"src/shared/entities/stargate/config/stargate.ts",
		],
		ISelectComponentOverrides: [
			"src/shared/entities/parameter/ui/ParameterSelectComponent.tsx",
		],
		ViewportIconButtonStyleProps: [
			"src/shared/entities/viewport/config/viewportIcons.ts",
		],
		ViewportIconButtonThemeStyleProps: [
			"src/shared/entities/viewport/ui/ViewportIconButton.tsx",
		],
	};

	function definitionFromIconPropsIntersection(
		checker: ts.TypeChecker,
		type: ts.Type,
	): DocTypeDefinition | undefined {
		if (!type.isIntersection()) return undefined;
		const merged: Record<string, DocTypeSchema & {description?: string}> =
			{};
		for (const member of type.types) {
			const memberProps = member.getProperties();
			const isPartialAlias = member.aliasSymbol?.getName() === "Partial";
			if (!isPartialAlias && memberProps.length <= 8) {
				Object.assign(merged, propertiesFromTsType(checker, member));
				continue;
			}
			const iconDecl = resolveTargetDeclaration(
				path.join(
					projectRoot,
					"src/shared/shared/ui/icon/Icon.types.ts",
				),
				"IconProps",
			);
			if (iconDecl && ts.isInterfaceDeclaration(iconDecl.node)) {
				Object.assign(
					merged,
					propertiesFromDeclarationMembers(
						iconDecl.checker,
						iconDecl.node,
					),
				);
			}
		}
		if (merged.iconType) {
			merged.iconType = {
				oneOf: [
					{type: "string"},
					{type: "unknown", name: "IconifyIconDefinition"},
				],
			};
		}
		if (!Object.keys(merged).length) return undefined;
		return deepSimplifySchema({properties: merged});
	}

	function definitionFromTsType(
		checker: ts.TypeChecker,
		type: ts.Type,
	): DocTypeDefinition | undefined {
		if (type.isIntersection()) {
			const iconProps = definitionFromIconPropsIntersection(
				checker,
				type,
			);
			if (iconProps) return iconProps;
			const merged: Record<
				string,
				DocTypeSchema & {description?: string}
			> = {};
			for (const member of type.types) {
				const part = propertiesFromTsType(checker, member);
				Object.assign(merged, part);
			}
			if (!Object.keys(merged).length) return undefined;
			return deepSimplifySchema({properties: merged});
		}

		const properties = propertiesFromTsType(checker, type);
		if (!Object.keys(properties).length) return undefined;
		return deepSimplifySchema({properties});
	}

	function tryResolveIndexedAccessTypeDocNode(
		typeNode: TypeDocTypeNode,
	): DocTypeDefinition | undefined {
		const objectNode = typeNode.objectType as TypeDocTypeNode | undefined;
		const indexNode = typeNode.indexType as TypeDocTypeNode | undefined;
		if (!objectNode || !indexNode) return undefined;

		const objectName =
			objectNode._target?.qualifiedName ?? objectNode.name ?? "";
		const indexKey =
			indexNode.type === "literal" && typeof indexNode.value === "string"
				? indexNode.value
				: typeof indexNode.name === "string"
					? indexNode.name
					: undefined;
		if (!objectName || !indexKey) return undefined;

		const sourceCandidates = [
			sourceFileContext,
			...(LOCAL_TYPE_SOURCE_FALLBACKS[objectName] ?? []),
		].filter(Boolean) as string[];

		for (const rel of sourceCandidates) {
			const parent = tryResolveTypeInSourceFile(objectName, rel);
			if (
				parent &&
				"properties" in parent &&
				parent.properties?.[indexKey]
			) {
				return parent.properties[indexKey] as DocTypeDefinition;
			}
		}
		return undefined;
	}

	function mergeIntersectionTypeDocNodes(
		typeNodes: TypeDocTypeNode[],
	): DocTypeDefinition | undefined {
		const merged: Record<string, DocTypeSchema & {description?: string}> =
			{};
		for (const part of typeNodes) {
			const resolved = tryResolveTypeDocNode(part);
			if (resolved && "properties" in resolved && resolved.properties) {
				Object.assign(merged, resolved.properties);
			}
		}
		if (!Object.keys(merged).length) return undefined;
		return deepSimplifySchema({properties: merged});
	}

	function tryResolvePropertyFromSourceType(
		parentTypeName: string,
		propertyName: string,
		sourceFileRelative: string,
	): DocTypeDefinition | undefined {
		const absPath = path.isAbsolute(sourceFileRelative)
			? sourceFileRelative
			: path.join(projectRoot, sourceFileRelative);
		if (!fs.existsSync(absPath)) return undefined;

		const resolved = resolveTargetDeclaration(
			path.normalize(absPath),
			parentTypeName,
		);
		if (!resolved) return undefined;

		const parentType = resolved.checker.getTypeAtLocation(resolved.node);
		const propSymbol =
			parentType.getProperty(propertyName) ??
			resolved.checker.getProperty(parentTypeName, propertyName);
		if (!propSymbol) return undefined;

		const decl =
			propSymbol.valueDeclaration ?? propSymbol.declarations?.[0];
		if (!decl) return undefined;

		const propType = resolved.checker.getTypeOfSymbolAtLocation(
			propSymbol,
			decl,
		);
		if (
			propertyName === "iconProps" &&
			parentTypeName === "ViewportIconButtonThemeStyleProps"
		) {
			return deepSimplifySchema({
				properties: {
					color: {type: "string"},
					colorDisabled: {type: "string"},
					iconType: {
						oneOf: [
							{type: "string"},
							{
								type: "unknown",
								name: "IconifyIconDefinition",
							},
						],
					},
					size: {
						oneOf: [{type: "string"}, {type: "number"}],
					},
				},
			});
		}
		if (propertyName === "iconProps") {
			const iconProps = definitionFromIconPropsIntersection(
				resolved.checker,
				propType,
			);
			if (iconProps) return iconProps;
		}
		return deepSimplifySchema(
			schemaFromTsType(resolved.checker, propType, 0),
		);
	}

	function tryResolveTypeInSourceFile(
		typeName: string,
		sourceFileRelative: string,
	): DocTypeDefinition | undefined {
		if (isLocalTypesSourcePath(sourceFileRelative)) {
			const fromAst = parseInterfaceFromSourceFile(
				projectRoot,
				sourceFileRelative,
				typeName,
			);
			if (fromAst) return fromAst;
		}

		const absPath = path.isAbsolute(sourceFileRelative)
			? sourceFileRelative
			: path.join(projectRoot, sourceFileRelative);
		if (!fs.existsSync(absPath)) return undefined;

		const resolved = resolveTargetDeclaration(
			path.normalize(absPath),
			typeName,
		);
		if (!resolved) return undefined;

		if (ts.isInterfaceDeclaration(resolved.node)) {
			const properties = propertiesFromDeclarationMembers(
				resolved.checker,
				resolved.node,
			);
			if (!Object.keys(properties).length) return undefined;
			return deepSimplifySchema({properties});
		}

		const type = resolved.checker.getTypeAtLocation(resolved.node);
		return definitionFromTsType(resolved.checker, type);
	}

	function tryResolveLocalTypeName(
		typeName: string,
	): DocTypeDefinition | undefined {
		if (typeName === "ISelectComponentOverrides") {
			return compactISelectComponentOverridesValueSchema();
		}
		const fromMirror = resolveMantineCorePropsMirror(projectRoot, typeName);
		if (fromMirror) return fromMirror;
		const mantineMirrorPath =
			mantineMirrorSchemaInputRelativePath(typeName);

		const candidates = [
			sourceFileContext,
			...(mantineMirrorPath ? [mantineMirrorPath] : []),
			...(LOCAL_TYPE_SOURCE_FALLBACKS[typeName] ?? []),
		].filter(Boolean) as string[];

		for (const rel of candidates) {
			const resolved = tryResolveTypeInSourceFile(typeName, rel);
			if (resolved) return resolved;
		}
		return undefined;
	}

	function tryResolveTypeDocNode(
		typeNode: TypeDocTypeNode | undefined,
		preferredDefinitionName?: string,
	): DocTypeDefinition | undefined {
		if (!typeNode) return undefined;

		const qualifiedName =
			typeNode._target?.qualifiedName ?? typeNode.name ?? "";
		const denylisted = denylistedTypeSchema(qualifiedName);
		if (denylisted) return denylisted;

		if (typeNode.type === "indexedAccess") {
			return tryResolveIndexedAccessTypeDocNode(typeNode);
		}

		if (typeNode.type === "intersection" && typeNode.types?.length) {
			const merged = mergeIntersectionTypeDocNodes(
				typeNode.types as TypeDocTypeNode[],
			);
			if (merged) return merged;
		}

		if (
			typeNode.type === "reference" &&
			typeNode.name &&
			["Omit", "Pick", "Partial", "Record"].includes(typeNode.name) &&
			typeNode.typeArguments?.length
		) {
			const expanded = expandUtilityReference(
				typeNode.name,
				typeNode,
				preferredDefinitionName,
			);
			if (expanded) return expanded;
			const base = (typeNode.typeArguments as TypeDocTypeNode[])[0];
			if (typeNode.name === "Partial" && base.name) {
				if (
					base.name === "IconProps" &&
					sourceFileContext?.includes("ViewportIconButton")
				) {
					const fromTheme = tryResolvePropertyFromSourceType(
						"ViewportIconButtonThemeStyleProps",
						"iconProps",
						sourceFileContext,
					);
					if (fromTheme) return fromTheme;
				}
				if (!base._target) {
					const local = tryResolveLocalTypeName(base.name);
					if (local && "properties" in local) {
						return local;
					}
				}
			}
			return expanded;
		}

		if (typeNode.type === "reference" && typeNode._target) {
			return resolveReferenceTarget(typeNode);
		}

		if (typeNode.type === "reference" && typeNode.name) {
			const local = tryResolveLocalTypeName(typeNode.name);
			if (local) return local;
		}

		if (typeNode.type === "union" && typeNode.types) {
			return {
				oneOf: (typeNode.types as TypeDocTypeNode[]).map((member) => {
					const expanded = tryResolveTypeDocNode(member);
					if (expanded) return expanded;
					return {
						type: "unknown" as const,
						name: member.name ?? "unknown",
					};
				}),
			};
		}

		return undefined;
	}

	function mantineDocLinkForProps(qualifiedName: string): string | undefined {
		const match = /^(.+)Props$/.exec(qualifiedName);
		if (!match) return undefined;
		const component = match[1]
			.replace(/([a-z])([A-Z])/g, "$1-$2")
			.toLowerCase();
		return `https://mantine.dev/core/${component}/?t=props`;
	}

	return {
		tryResolveTypeDocNode,
		tryResolveTypeInSourceFile,
		tryResolveLocalTypeName,
		tryResolvePropertyFromSourceType,
		mantineDocLinkForProps,
		collectLiteralKeys,
		isInvalidPropertyName,
		clearPrograms,
		setSourceFileContext(relativePath: string | undefined) {
			sourceFileContext = relativePath;
		},
	};
}

export type TsTypeResolver = ReturnType<typeof createTsTypeResolver>;
