import {
	canonicalMantinePropsDocKeyForPropertyKeys,
	MANTINE_SCHEMA_INPUT_TYPE_NAMES,
	mantineCorePropsDocKeyForMirrorName,
	parseSchemaInputTypeDefinition,
	resolveDocRefForTypeName,
	resolveMantineCorePropsMirrorForDocKey,
	seedMantineSchemaInputTypeDefinitions,
} from "./mantineMirrorParser.ts";
import {
	buildRecordDefinitionName,
	compactRecordStringISelectComponentOverrides,
	isBreakpointSizeObjectSchema,
	MANTINE_RESPONSIVE_CSS_SIZE_REF,
	matchesMantineResponsiveCssSize,
	typeArgumentLabelForDefinition,
} from "./recordTypeSchema.ts";
import {
	createTsTypeResolver,
	deepSimplifySchema,
	isDomEventHandlerTypeName,
	isMantineCorePackageTarget,
	mergeMirrorDefinitionOverlay,
	normalizeUnknownTypeName,
	shouldStubMantineExpandedProps,
	simplifySchema,
	type TsTypeResolver,
} from "./tsTypeResolver.ts";

const MIRROR_SCHEMA_SIMPLIFY_OPTIONS = {preserveMirrorFidelity: true} as const;

/** OpenAPI-style JSON Schema fragment used in doc-flat property `type` fields. */
export type DocTypeSchema =
	| {type: "string"; const?: string; enum?: string[]}
	| {type: "number"; const?: number; enum?: number[]}
	| {type: "boolean"; const?: boolean}
	| {type: "null"}
	| {type: "unknown"; name: string}
	| {$ref: string}
	| {oneOf: DocTypeSchema[]}
	| {
			properties: Record<
				string,
				DocTypeSchema & {description?: string; default?: string}
			>;
	  }
	| {items: DocTypeSchema};

export type DocTypeDefinition = DocTypeSchema & {
	/** Mantine (or other external) props documentation URL when resolved from .d.ts */
	docLink?: string;
};

export const DEFINITIONS_REF_PREFIX = "#/definitions/";

export const ICON_THEME_DEFAULT_PROPS_CONFIG_PATH =
	"themeOverrides.components.Icon.defaultProps";

/** Serializable Icon theme surface — matches mantine-props `MantineIconProps` mirror (5 fields). */
export const COMPACT_ICON_PROPS: DocTypeDefinition = {
	properties: {
		iconType: {type: "string"},
		color: {type: "string"},
		colorDisabled: {type: "string"},
		size: {$ref: `${DEFINITIONS_REF_PREFIX}MantineSpacing`},
		stroke: {type: "string"},
	},
};

type DocEntryProperty = {
	name: string;
	description: string;
	type: DocTypeSchema;
	default?: string;
	minimum?: string;
	maximum?: string;
	example?: string;
};

/** Build flat entry `properties` from a mirror-backed `definitions` object. */
export function entryPropertiesFromDefinition(
	definition: DocTypeDefinition,
): DocEntryProperty[] {
	if (!("properties" in definition) || !definition.properties) return [];
	return Object.entries(definition.properties).map(([name, schema]) => {
		const {
			description,
			default: defaultValue,
			...typeSchema
		} = schema;
		const prop: DocEntryProperty = {
			name,
			description: description ?? "",
			type: typeSchema,
		};
		if (defaultValue !== undefined) {
			prop.default = defaultValue;
		}
		return prop;
	});
}

function alignEntryPropertiesToMirrorDefinition(
	entry: DocFlatEntry,
	definitions: Record<string, DocTypeDefinition>,
	projectRoot?: string,
): boolean {
	const props = entry.properties as DocEntryProperty[] | undefined;
	if (!props?.length || !projectRoot) return false;

	const fingerprintProps = Object.fromEntries(
		props.map((prop) => [prop.name, prop.type]),
	);
	const docKey = canonicalMantinePropsDocKeyForPropertyKeys(
		projectRoot,
		fingerprintProps,
	);
	if (!docKey) return false;

	const mirror = definitions[docKey];
	if (!mirror || !("properties" in mirror) || !mirror.properties) {
		return false;
	}

	entry.properties = entryPropertiesFromDefinition(mirror);
	return true;
}

/** Normalize flat entries that inlined a mirrored Mantine props surface. */
export function postProcessFlatEntries(
	entries: DocFlatEntry[],
	definitions: Record<string, DocTypeDefinition>,
	projectRoot?: string,
): void {
	for (const entry of entries) {
		if (entry.configPath === ICON_THEME_DEFAULT_PROPS_CONFIG_PATH) {
			const mirror = definitions.IconProps;
			if (mirror && "properties" in mirror && mirror.properties) {
				entry.properties = entryPropertiesFromDefinition(mirror);
				continue;
			}
			entry.properties = entryPropertiesFromDefinition(COMPACT_ICON_PROPS);
			continue;
		}

		alignEntryPropertiesToMirrorDefinition(
			entry,
			definitions,
			projectRoot,
		);
	}
}

/** Stable definition keys for recurring inline object property fingerprints. */
const PROPERTY_KEY_FINGERPRINTS: Record<string, string> = {
	"backgroundColor,busyModeDisplay,busyModeSpinner,logo,spinnerPositioning":
		"ViewportBranding",
	"dimmed,focused,primary": "StargateStatusColorProps",
};

function stableDefinitionNameForPropertyKeys(
	properties: Record<string, unknown>,
): string | undefined {
	const fingerprint = Object.keys(properties).sort().join(",");
	return PROPERTY_KEY_FINGERPRINTS[fingerprint];
}

const BREAKPOINT_SIZE_KEYS = new Set([
	"base",
	"xs",
	"sm",
	"md",
	"lg",
	"xl",
]);

function isMantineResponsiveCssSizeUnionNode(typeNode: {
	types?: {type?: string; name?: string; declaration?: {children?: {name?: string}[]}}[];
}): boolean {
	const members = typeNode.types ?? [];
	const hasString = members.some(
		(member) => member.type === "intrinsic" && member.name === "string",
	);
	const hasNumber = members.some(
		(member) => member.type === "intrinsic" && member.name === "number",
	);
	const objectMember = members.find((member) => member.type === "reflection");
	const breakpointKeys =
		objectMember?.declaration?.children
			?.map((child) => child.name)
			.filter(
				(name): name is string =>
					typeof name === "string" && BREAKPOINT_SIZE_KEYS.has(name),
			) ?? [];
	return hasString && hasNumber && breakpointKeys.length >= 3;
}

function rewriteDefinitionRefs(
	definitions: Record<string, DocTypeDefinition>,
	fromKey: string,
	toKey: string,
): void {
	if (fromKey === toKey) return;
	const fromRef = `${DEFINITIONS_REF_PREFIX}${fromKey}`;
	const toRef = `${DEFINITIONS_REF_PREFIX}${toKey}`;
	const visit = (value: unknown): void => {
		if (!value || typeof value !== "object") return;
		if (Array.isArray(value)) {
			value.forEach(visit);
			return;
		}
		const obj = value as Record<string, unknown>;
		if (obj.$ref === fromRef) {
			obj.$ref = toRef;
		}
		for (const child of Object.values(obj)) {
			visit(child);
		}
	};
	for (const def of Object.values(definitions)) {
		visit(def);
	}
	delete definitions[fromKey];
}

export type DefinitionsContext = {
	definitions: Record<string, DocTypeDefinition>;
	resolveType: (type: unknown, propertyName?: string) => DocTypeSchema;
	setEntrySourceFile: (sourceFile: string | undefined) => void;
	projectRoot?: string;
	disposePrograms?: () => void;
};

type ReflectionIndex = Map<string, unknown[]>;

function sanitizeDefinitionName(name: string): string {
	const trimmed = name.trim();
	if (!trimmed) return "UnknownType";
	const withoutGenerics = trimmed.replace(
		/<([^>]+)>/g,
		(_match, inner: string) =>
			`_${sanitizeDefinitionName(inner).replace(/^_|_$/g, "")}`,
	);
	return withoutGenerics
		.replace(/\s*\|\s*/g, "_or_")
		.replace(/\s+/g, "_")
		.replace(/[^A-Za-z0-9_$[\].-]/g, "_")
		.replace(/_+/g, "_")
		.replace(/^_|_$/g, "");
}

const INTRINSIC_TYPE_NAMES = new Set(["string", "number", "boolean", "null"]);

function buildUtilityDefinitionName(
	utilityName: string,
	typeArguments: unknown[] | undefined,
): string | undefined {
	if (!typeArguments?.length) return undefined;
	if (utilityName === "Record" && typeArguments.length >= 2) {
		return sanitizeDefinitionName(
			buildRecordDefinitionName(
				typeArguments[0] as Parameters<
					typeof typeArgumentLabelForDefinition
				>[0],
				typeArguments[1] as Parameters<
					typeof typeArgumentLabelForDefinition
				>[0],
			),
		);
	}
	const first = typeArguments[0] as {
		name?: string;
		_target?: {qualifiedName?: string};
	};
	const baseName =
		first._target?.qualifiedName ??
		first.name ??
		"Unknown";
	return sanitizeDefinitionName(`${utilityName}_${baseName}`);
}

type IntersectionPartNode = {
	type?: string;
	name?: string;
	typeArguments?: unknown[];
	_target?: {qualifiedName?: string};
};

/** Label one intersection member (e.g. `Partial<OverlayStyleProps>` → `Partial_OverlayStyleProps`). */
function intersectionPartDefinitionLabel(part: IntersectionPartNode): string {
	if (
		part.type === "reference" &&
		part.name &&
		["Partial", "Omit", "Pick", "Record"].includes(part.name) &&
		part.typeArguments?.length
	) {
		return (
			buildUtilityDefinitionName(part.name, part.typeArguments) ??
			sanitizeDefinitionName(part.name)
		);
	}
	if (part._target?.qualifiedName) {
		return part._target.qualifiedName;
	}
	if (typeof part.name === "string" && part.name.length) {
		return part.name;
	}
	return "Unknown";
}

function buildIntersectionDefinitionName(
	parts: IntersectionPartNode[] | undefined,
): string {
	if (!parts?.length) return "Intersection";
	return sanitizeDefinitionName(
		parts.map(intersectionPartDefinitionLabel).join("_and_"),
	);
}

function refForDefinitionName(name: string): {$ref: string} {
	return {$ref: `${DEFINITIONS_REF_PREFIX}${sanitizeDefinitionName(name)}`};
}

function findReflectionByName(
	index: ReflectionIndex,
	name: string | undefined,
): unknown | undefined {
	if (!name) return undefined;
	const matches = index.get(name);
	if (!matches?.length) return undefined;
	return matches[matches.length - 1];
}

function buildReflectionIndex(project: {
	reflections?: Record<string, unknown>;
}): ReflectionIndex {
	const index: ReflectionIndex = new Map();
	if (!project?.reflections) return index;
	for (const reflection of Object.values(project.reflections)) {
		const r = reflection as {name?: string};
		if (!r?.name) continue;
		const list = index.get(r.name) ?? [];
		list.push(reflection);
		index.set(r.name, list);
	}
	return index;
}

function typeDisplayName(
	type: {name?: string; reflection?: {name?: string}; toString?: () => string},
	fallback: string,
): string {
	if (typeof type.name === "string" && type.name.length) {
		return type.name;
	}
	if (typeof type.reflection?.name === "string" && type.reflection.name.length) {
		return type.reflection.name;
	}
	if (typeof type.toString === "function") {
		const label = type.toString();
		if (label && label !== "[object Object]") {
			return label;
		}
	}
	return fallback;
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

function isSanitizedInlinePropsKey(key: string): boolean {
	if (key.endsWith("Props") || key.endsWith("StyleProps")) return false;
	if (/^[A-Z][A-Za-z0-9]*$/.test(key)) return false;
	return (
		key.includes("_string_or_number") ||
		key.includes("_or_") ||
		(key.includes("_string_") && key.includes("_"))
	);
}

function isFingerprintCandidateKey(key: string): boolean {
	if (key.startsWith("Partial_")) return false;
	if (key === "InlineObject" || key === "InlineUnion") return true;
	return isSanitizedInlinePropsKey(key);
}

/**
 * Build a registry that resolves TypeDoc type nodes to JSON Schema fragments,
 * collecting named complex types under `definitions` (OpenAPI-style).
 */
export function createDefinitionsContext(
	project: {reflections?: Record<string, unknown>},
	getText: (arr: unknown[] | undefined) => string,
	processTagValue: (value: string) => string,
	projectRoot?: string,
): DefinitionsContext {
	const definitions: Record<string, DocTypeDefinition> = {};
	if (projectRoot) {
		seedMantineSchemaInputTypeDefinitions(projectRoot, definitions);
	}
	const reflectionIndex = buildReflectionIndex(project);
	const tsResolver = projectRoot
		? createTsTypeResolver(projectRoot)
		: undefined;
	let tsResolverSourceFile: string | undefined;
	/** @type {Set<unknown>} */
	const visitingTypes = new Set();

	function isResolvedDefinition(def: DocTypeDefinition): boolean {
		return (
			("properties" in def && Boolean(def.properties)) ||
			("oneOf" in def && Boolean(def.oneOf?.length)) ||
			("items" in def && Boolean(def.items))
		);
	}

	function ensureMirrorDefinitionSeeded(docKey: string): void {
		if (!projectRoot) return;
		const existing = definitions[docKey];
		if (existing && isResolvedDefinition(existing)) return;
		const fromMirror = resolveMantineCorePropsMirrorForDocKey(
			projectRoot,
			docKey,
		);
		if (fromMirror) {
			definitions[docKey] = deepSimplifySchema(
				fromMirror,
				MIRROR_SCHEMA_SIMPLIFY_OPTIONS,
			);
		}
	}

	function tryRedirectToCanonicalMantinePropsRef(
		key: string,
		built: DocTypeDefinition,
	): {$ref: string} | undefined {
		if (!projectRoot || key.startsWith("Partial_")) return undefined;

		const coreFromMirrorName = mantineCorePropsDocKeyForMirrorName(key);
		if (
			coreFromMirrorName &&
			resolveMantineCorePropsMirrorForDocKey(projectRoot, coreFromMirrorName)
		) {
			ensureMirrorDefinitionSeeded(coreFromMirrorName);
			delete definitions[key];
			return {
				$ref: `${DEFINITIONS_REF_PREFIX}${sanitizeDefinitionName(coreFromMirrorName)}`,
			};
		}

		if (
			isFingerprintCandidateKey(key) &&
			"properties" in built &&
			built.properties
		) {
			const coreFromFingerprint = canonicalMantinePropsDocKeyForPropertyKeys(
				projectRoot,
				built.properties,
			);
			if (coreFromFingerprint) {
				ensureMirrorDefinitionSeeded(coreFromFingerprint);
				delete definitions[key];
				return {
					$ref: `${DEFINITIONS_REF_PREFIX}${sanitizeDefinitionName(coreFromFingerprint)}`,
				};
			}
		}

		return undefined;
	}

	function registerDefinition(
		name: string,
		build: () => DocTypeDefinition,
	): {$ref: string} | DocTypeSchema {
		let key = sanitizeDefinitionName(name);
		if (isDomEventHandlerTypeName(key)) {
			return {type: "unknown", name: "Function"};
		}
		if (projectRoot && !key.startsWith("Partial_")) {
			const earlyRef = resolveDocRefForTypeName(projectRoot, key);
			if (earlyRef && "$ref" in earlyRef) {
				const docKey = earlyRef.$ref.slice(DEFINITIONS_REF_PREFIX.length);
				ensureMirrorDefinitionSeeded(docKey);
				return earlyRef;
			}
		}
		if (MANTINE_SCHEMA_INPUT_TYPE_NAMES.has(key) && definitions[key]) {
			return {$ref: `${DEFINITIONS_REF_PREFIX}${key}`};
		}
		if (key === "Partial_IconProps") {
			delete definitions[key];
		}
		const partialBase = /^Partial_(.+)$/.exec(key);
		if (partialBase) {
			const baseKey = partialBase[1];
			const baseExisting = definitions[baseKey];
			if (
				baseExisting &&
				baseExisting.type === "unknown" &&
				baseExisting.docLink &&
				!("properties" in baseExisting && baseExisting.properties)
			) {
				return {$ref: `${DEFINITIONS_REF_PREFIX}${baseKey}`};
			}
		}
		const existing = definitions[key];
		if (
			existing &&
			isResolvedDefinition(existing) &&
			!(
				key === "Partial_IconProps" &&
				"properties" in existing &&
				Object.keys(existing.properties ?? {}).length > 10
			)
		) {
			return {$ref: `${DEFINITIONS_REF_PREFIX}${key}`};
		}
		definitions[key] = {type: "unknown", name: key};
		let built = deepSimplifySchema(build());
		if (projectRoot) {
			const fromMirror = resolveMantineCorePropsMirrorForDocKey(
				projectRoot,
				key,
			);
			if (fromMirror && "properties" in fromMirror && fromMirror.properties) {
				built = deepSimplifySchema(
					mergeMirrorDefinitionOverlay(built, fromMirror),
					MIRROR_SCHEMA_SIMPLIFY_OPTIONS,
				);
			}
		}
		let topLevelPropCount =
			"properties" in built && built.properties
				? Object.keys(built.properties).length
				: 0;
		if (key === "Partial" && "properties" in built) {
			const altKey = "Partial_IconProps";
			definitions[altKey] = built;
			delete definitions[key];
			key = altKey;
			built = definitions[altKey];
			topLevelPropCount = Object.keys(built.properties ?? {}).length;
		}
		if (
			key === "Partial_IconProps" &&
			"properties" in built &&
			topLevelPropCount > 10
		) {
			built = COMPACT_ICON_PROPS;
			topLevelPropCount = Object.keys(COMPACT_ICON_PROPS.properties ?? {}).length;
		}
		const hasMantineMirror =
			Boolean(projectRoot) &&
			Boolean(resolveMantineCorePropsMirrorForDocKey(projectRoot!, key));
		const isLargeMantinePropsKey =
			topLevelPropCount > 0 &&
			(key.endsWith("StyleProps") || key.endsWith("Props")) &&
			(topLevelPropCount > 80 || topLevelPropCount > 50);
		if (isLargeMantinePropsKey && !hasMantineMirror) {
			const docBase = key.replace(/^Partial_/, "");
			const docLink = tsResolver?.mantineDocLinkForProps(docBase);
			built = {
				type: "unknown",
				name: `${key} (${topLevelPropCount} props — see Mantine docs)`,
				...(docLink ? {docLink} : {}),
			};
		}
		if (
			!MANTINE_SCHEMA_INPUT_TYPE_NAMES.has(key) &&
			(isPrimitiveSchema(built) ||
				(key === "string" &&
					built.type === "unknown" &&
					built.name.includes("string")))
		) {
			delete definitions[key];
			return built.type === "unknown" ? {type: "string"} : built;
		}
		if (key === "Partial_IconProps") {
			built = COMPACT_ICON_PROPS;
		}
		if (matchesMantineResponsiveCssSize(built)) {
			delete definitions[key];
			return MANTINE_RESPONSIVE_CSS_SIZE_REF;
		}
		if (isBreakpointSizeObjectSchema(built)) {
			delete definitions[key];
			return MANTINE_RESPONSIVE_CSS_SIZE_REF;
		}
		if (
			"properties" in built &&
			built.properties &&
			isFingerprintCandidateKey(key)
		) {
			const stableName = stableDefinitionNameForPropertyKeys(
				built.properties,
			);
			if (stableName && stableName !== key) {
				if (definitions[stableName]) {
					delete definitions[key];
					return {$ref: `${DEFINITIONS_REF_PREFIX}${stableName}`};
				}
				delete definitions[key];
				key = stableName;
			}
		}
		const canonicalRef = tryRedirectToCanonicalMantinePropsRef(key, built);
		if (canonicalRef) {
			return canonicalRef;
		}
		if ("$ref" in built && !("properties" in built)) {
			delete definitions[key];
			return built as {$ref: string};
		}
		if (!("$ref" in built) || isResolvedDefinition(built)) {
			definitions[key] = built;
		}
		return {$ref: `${DEFINITIONS_REF_PREFIX}${key}`};
	}

	function shouldResolveWithTs(typeNode: {
		type?: string;
		name?: string;
		_target?: {fileName?: string; packageName?: string};
		package?: string;
		typeArguments?: unknown[];
	}): boolean {
		if (typeNode.type !== "reference") return false;
		const name = typeNode.name ?? "";
		if (["Omit", "Pick", "Partial", "Record"].includes(name)) {
			return Boolean(typeNode.typeArguments?.length);
		}
		const pkg =
			typeNode._target?.packageName ??
			(typeNode as {package?: string}).package ??
			"";
		const file = typeNode._target?.fileName ?? "";
		if (name === "MantineTheme" || name === "MantineThemeOverride") {
			return false;
		}
		if (/^Mantine[A-Z]\w*Props$/.test(name)) {
			return true;
		}
		if (pkg.startsWith("@mantine/") || file.includes("@mantine/")) {
			return (
				name.endsWith("Props") ||
				name.endsWith("Props[]") ||
				(/^Mantine[A-Z]/.test(name) &&
					name !== "MantineTheme" &&
					name !== "MantineThemeOverride")
			);
		}
		if (
			pkg === "@shapediver/viewer.shared.types" ||
			file.includes("viewer.shared.types")
		) {
			return /^[A-Z]/.test(name);
		}
		return false;
	}

	function canonicalTsDefinitionName(
		typeNode: {
			name?: string;
			typeArguments?: unknown[];
			_target?: {qualifiedName?: string; packageName?: string; fileName?: string};
		},
		preferredDefinitionName?: string,
	): string {
		const utilityName = typeNode.name;
		if (
			utilityName === "Record" &&
			typeNode.typeArguments &&
			typeNode.typeArguments.length >= 2
		) {
			return (
				buildUtilityDefinitionName(utilityName, typeNode.typeArguments) ??
				"Record_unknown"
			);
		}
		if (
			(utilityName === "Partial" ||
				utilityName === "Pick" ||
				utilityName === "Omit") &&
			typeNode.typeArguments?.length
		) {
			const base = typeNode.typeArguments[0] as {
				name?: string;
				_target?: {qualifiedName?: string; packageName?: string; fileName?: string};
			};
			const baseName =
				base._target?.qualifiedName ?? base.name ?? "Unknown";
			if (base._target && isMantineCorePackageTarget(base._target)) {
				if (
					projectRoot &&
					resolveMantineCorePropsMirrorForDocKey(projectRoot, baseName)
				) {
					return sanitizeDefinitionName(baseName);
				}
				if (utilityName === "Partial") {
					return sanitizeDefinitionName(baseName);
				}
			}
			if (utilityName === "Partial") {
				return (
					buildUtilityDefinitionName(utilityName, typeNode.typeArguments) ??
					sanitizeDefinitionName(baseName)
				);
			}
		}
		if (preferredDefinitionName) {
			return sanitizeDefinitionName(preferredDefinitionName);
		}
		if (typeNode._target?.qualifiedName) {
			return sanitizeDefinitionName(typeNode._target.qualifiedName);
		}
		return "ResolvedType";
	}

	function finalizeTsExpanded(
		expanded: DocTypeDefinition,
		typeNode: {
			name?: string;
			_target?: {qualifiedName?: string; packageName?: string; fileName?: string};
			typeArguments?: unknown[];
		},
	): DocTypeDefinition {
		const target = typeNode._target;
		if ("properties" in expanded && expanded.properties) {
			const propCount = Object.keys(expanded.properties).length;
			const qualifiedName =
				target?.qualifiedName ??
				(typeNode.typeArguments?.[0] as {_target?: {qualifiedName?: string}})
					?._target?.qualifiedName ??
				"";
			const firstArg = typeNode.typeArguments?.[0] as
				| {
						_target?: {
							qualifiedName?: string;
							packageName?: string;
							fileName?: string;
						};
				  }
				| undefined;
			const stubTarget = target ?? firstArg?._target;
			const shouldStub =
				(qualifiedName &&
					shouldStubMantineExpandedProps(
						qualifiedName,
						propCount,
						stubTarget,
					)) ||
				(propCount > 80 &&
					(qualifiedName.endsWith("Props") ||
						qualifiedName.endsWith("StyleProps")));
			if (qualifiedName && shouldStub) {
				if (projectRoot) {
					const mirror = resolveMantineCorePropsMirrorForDocKey(
						projectRoot,
						qualifiedName,
					);
					if (mirror) return mirror;
				}
				const docLink = tsResolver!.mantineDocLinkForProps(qualifiedName);
				return {
					type: "unknown",
					name: `${qualifiedName} (${propCount} props — see Mantine docs)`,
					...(docLink ? {docLink} : {}),
				};
			}
		}
		const qualifiedForMirror =
			target?.qualifiedName ??
			(typeNode.typeArguments?.[0] as {_target?: {qualifiedName?: string}})
				?._target?.qualifiedName ??
			"";
		if (qualifiedForMirror && projectRoot) {
			const mirror = resolveMantineCorePropsMirrorForDocKey(
				projectRoot,
				qualifiedForMirror,
			);
			if (mirror) return mirror;
		}
		const docLink =
			qualifiedForMirror &&
			tsResolver!.mantineDocLinkForProps(qualifiedForMirror);
		if (docLink && "properties" in expanded) {
			const propCount = Object.keys(expanded.properties ?? {}).length;
			if (
				shouldStubMantineExpandedProps(
					qualifiedForMirror,
					propCount,
					stubTarget,
				) ||
				propCount > 50
			) {
				return {
					type: "unknown",
					name: `${qualifiedForMirror} (${propCount} props — see Mantine docs)`,
					docLink,
				};
			}
		}
		return expanded;
	}

	function tryTsResolve(
		typeNode: unknown,
		preferredDefinitionName?: string,
	): DocTypeSchema | undefined {
		if (!tsResolver) return undefined;
		const node = typeNode as {
			type?: string;
			name?: string;
			_target?: {qualifiedName?: string; packageName?: string; fileName?: string};
			typeArguments?: unknown[];
		};
		if (
			node.type === "intersection" &&
			node.typeArguments === undefined &&
			(node as {types?: unknown[]}).types?.length
		) {
			const expanded = tsResolver.tryResolveTypeDocNode(
				typeNode as Parameters<TsTypeResolver["tryResolveTypeDocNode"]>[0],
				preferredDefinitionName,
			);
			if (expanded && "properties" in expanded && expanded.properties) {
				const defName =
					preferredDefinitionName ??
					buildIntersectionDefinitionName(
						(node as {types?: IntersectionPartNode[]}).types,
					);
				return registerDefinition(defName, () => expanded);
			}
		}
		if (!shouldResolveWithTs(node)) {
			return undefined;
		}
		const expanded = tsResolver.tryResolveTypeDocNode(
			typeNode as Parameters<TsTypeResolver["tryResolveTypeDocNode"]>[0],
			preferredDefinitionName,
		);
		if (!expanded) return undefined;
		if ("$ref" in expanded && !("properties" in expanded)) {
			return expanded;
		}
		const defName = canonicalTsDefinitionName(node, preferredDefinitionName);
		return registerDefinition(defName, () =>
			finalizeTsExpanded(expanded, node),
		);
	}

	function resolveReflectionDeclaration(
		reflection: {
			name?: string;
			type?: unknown;
			children?: unknown[];
		},
	): DocTypeSchema {
		if (reflection.children?.length) {
			return registerDefinition(reflection.name ?? "AnonymousType", () => ({
				properties: mapDeclarationChildren(reflection.children),
			}));
		}
		if (reflection.type) {
			const tsResolved = tryTsResolve(
				reflection.type,
				reflection.name,
			);
			if (tsResolved) return tsResolved;

			const resolved = resolveType(reflection.type);
			if (!isPrimitiveSchema(resolved) && !("$ref" in resolved)) {
				return resolved;
			}
			if ("$ref" in resolved) {
				return resolved;
			}
		}
		return {type: "unknown", name: reflection.name ?? "unknown"};
	}

	function mapDeclarationChildren(
		children: unknown[] | undefined,
	): Record<string, DocTypeSchema & {description?: string; default?: string}> {
		const props: Record<
			string,
			DocTypeSchema & {description?: string; default?: string}
		> = {};
		if (!children?.length) return props;
		for (const child of children) {
			const c = child as {
				name: string;
				type?: unknown;
				comment?: {
					summary?: {text: string}[];
					blockTags?: {tag: string; content: {text: string}[]}[];
				};
			};
			let resolvedChildType = resolveType(c.type);
			if (c.name === "themeOverride") {
				resolvedChildType = registerDefinition(
					"MantineThemeOverride",
					() => ({
						type: "unknown",
						name: "MantineThemeOverride",
						docLink:
							"https://mantine.dev/theming/theme-object/",
					}),
				);
			}
			const entry: DocTypeSchema & {
				description?: string;
				default?: string;
			} = {
				...resolvedChildType,
				description: getText(c.comment?.summary as {text: string}[]),
			};
			const childTags = c.comment?.blockTags;
			if (childTags) {
				for (const tag of childTags) {
					if (tag.tag === "@default") {
						entry.default = processTagValue(
							getText(tag.content as {text: string}[]),
						);
					}
				}
			}
			props[c.name] = entry;
		}
		return props;
	}

	function resolveType(type: unknown): DocTypeSchema {
		if (!type) return {type: "unknown", name: "unknown"};
		if (visitingTypes.has(type)) {
			return {type: "unknown", name: "circular"};
		}
		visitingTypes.add(type);

		const t = type as {
			type?: string;
			name?: string;
			value?: unknown;
			types?: unknown[];
			elementType?: unknown;
			declaration?: {children?: unknown[]};
			reflection?: {
				name?: string;
				children?: unknown[];
				type?: unknown;
			};
			typeArguments?: unknown[];
			toString?: () => string;
		};

		let result: DocTypeSchema;

		switch (t.type) {
			case "intrinsic": {
				const name = t.name ?? "unknown";
				if (
					name === "string" ||
					name === "number" ||
					name === "boolean" ||
					name === "null"
				) {
					result = {type: name};
				} else {
					result = {type: "unknown", name};
				}
				break;
			}
			case "literal": {
				const value = t.value;
				if (typeof value === "number") {
					result = {type: "number", const: value};
				} else if (typeof value === "boolean") {
					result = {type: "boolean", const: value};
				} else if (typeof value === "string") {
					result = {type: "string", const: value};
				} else {
					result = {type: "string"};
				}
				break;
			}
			case "union": {
				if (isMantineResponsiveCssSizeUnionNode(t)) {
					result = MANTINE_RESPONSIVE_CSS_SIZE_REF;
					break;
				}
				const simplified = simplifySchema({
					oneOf: (t.types ?? []).map((member) => resolveType(member)),
				});
				if (matchesMantineResponsiveCssSize(simplified)) {
					result = MANTINE_RESPONSIVE_CSS_SIZE_REF;
					break;
				}
				const unionName = typeDisplayName(t, t.reflection?.name ?? "Union");
				result = registerDefinition(unionName, () => simplified);
				break;
			}
			case "intersection": {
				const parts = t.types ?? [];
				const tsResolved = tryTsResolve({
					type: "intersection",
					types: parts,
				});
				if (tsResolved) {
					result = tsResolved;
					break;
				}
				const merged: Record<
					string,
					DocTypeSchema & {description?: string; default?: string}
				> = {};
				for (const part of parts) {
					const schema = resolveType(part);
					if ("properties" in schema && schema.properties) {
						Object.assign(merged, schema.properties);
					}
				}
				if (Object.keys(merged).length) {
					if (
						Object.keys(merged).length > 40 &&
						merged.focusRing &&
						merged.colors &&
						merged.fontFamily
					) {
						const themeMirror = projectRoot
							? resolveMantineCorePropsMirrorForDocKey(
									projectRoot,
									"MantineThemeOverride",
								)
							: undefined;
						result = registerDefinition("MantineThemeOverride", () =>
							themeMirror ?? {
								type: "unknown",
								name: "MantineThemeOverride",
								docLink:
									"https://mantine.dev/theming/theme-object/",
							},
						);
					} else {
						result = {properties: merged};
					}
				} else {
					const label = buildIntersectionDefinitionName(
						parts as IntersectionPartNode[],
					);
					result = registerDefinition(label, () => ({
						type: "unknown",
						name: label,
					}));
				}
				break;
			}
			case "optional":
				result = resolveType(t.elementType);
				break;
			case "array":
				result = {items: resolveType(t.elementType)};
				break;
			case "reflection": {
				const children = t.declaration?.children;
				if (children?.length) {
					const objectName = typeDisplayName(
						t,
						t.reflection?.name ?? "InlineObject",
					);
					result = registerDefinition(objectName, () => ({
						properties: mapDeclarationChildren(children),
					}));
				} else {
					result = {type: "unknown", name: "object"};
				}
				break;
			}
			case "reference": {
				const refName = typeDisplayName(t, "Reference");

				if (INTRINSIC_TYPE_NAMES.has(refName)) {
					result = {
						type: refName as "string" | "number" | "boolean",
					};
					break;
				}
				if (refName === "string & {}") {
					result = {type: "string"};
					break;
				}
				if (MANTINE_SCHEMA_INPUT_TYPE_NAMES.has(refName)) {
					result = definitions[refName]
						? {$ref: `${DEFINITIONS_REF_PREFIX}${refName}`}
						: registerDefinition(refName, () =>
								parseSchemaInputTypeDefinition(
									projectRoot!,
									refName,
								) ?? {type: "unknown", name: refName},
							);
					break;
				}
				if (refName === "MantineTheme" || refName === "MantineThemeOverride") {
					const themeMirror =
						refName === "MantineThemeOverride" && projectRoot
							? resolveMantineCorePropsMirrorForDocKey(
									projectRoot,
									refName,
								)
							: undefined;
					result = registerDefinition(refName, () =>
						themeMirror
							? themeMirror
							: {
									type: "unknown",
									name: refName,
									docLink:
										"https://mantine.dev/theming/theme-object/",
								},
					);
					break;
				}

				if (projectRoot) {
					const canonicalRef = resolveDocRefForTypeName(
						projectRoot,
						refName,
					);
					if (canonicalRef) {
						const docKey = canonicalRef.$ref.slice(
							DEFINITIONS_REF_PREFIX.length,
						);
						ensureMirrorDefinitionSeeded(docKey);
						result = canonicalRef;
						break;
					}
				}

				const utilityDefName = ["Omit", "Pick", "Partial", "Record"].includes(
					refName,
				)
					? buildUtilityDefinitionName(refName, t.typeArguments)
					: undefined;

				if (tsResolver && shouldResolveWithTs(t)) {
					const tsResolved = tryTsResolve(
						t,
						utilityDefName ?? t.reflection?.name ?? t.name,
					);
					if (tsResolved) {
						result = tsResolved;
						break;
					}
				}

				if (tsResolver && t.name && !t.reflection) {
					const local =
						tsResolver.tryResolveLocalTypeName?.(t.name) ??
						tsResolver.tryResolveTypeInSourceFile(
							t.name,
							tsResolverSourceFile ?? "",
						);
					if (local) {
						const localDefName =
							(refName === "Partial" ||
								refName.startsWith("Partial<")) &&
							t.typeArguments?.length
								? buildUtilityDefinitionName(
										"Partial",
										t.typeArguments,
									) ?? "Partial_IconProps"
								: t.name;
						result = registerDefinition(localDefName, () => local);
						break;
					}
				}

				const refl =
					t.reflection ??
					findReflectionByName(reflectionIndex, t.name);
				if (refl) {
					result = registerDefinition(
						utilityDefName ?? refName,
						() => {
						const resolved = resolveReflectionDeclaration(
							refl as {
								name?: string;
								type?: unknown;
								children?: unknown[];
							},
						);
						if (isPrimitiveSchema(resolved)) {
							return {type: "unknown", name: refName};
						}
						return resolved;
					},
					);
				} else {
					const label = t.typeArguments?.length
						? `${refName}<${t.typeArguments
								.map((arg) =>
									typeDisplayName(
										arg as {
											name?: string;
											toString?: () => string;
										},
										"?",
									),
								)
								.join(", ")}>`
						: refName;
					result = registerDefinition(
						utilityDefName ?? label,
						() => ({
							type: "unknown",
							name: normalizeUnknownTypeName(label),
						}),
					);
				}
				break;
			}
			default: {
				const label = typeDisplayName(t, t.type ?? "unknown");
				result = registerDefinition(label, () => ({
					type: "unknown",
					name: normalizeUnknownTypeName(label),
				}));
			}
		}

		visitingTypes.delete(type);
		return result;
	}

	/**
	 * Use a named definition + $ref when the schema is non-primitive and benefits
	 * from reuse (references, unions, objects with properties).
	 */
	function resolvePropertyType(
		type: unknown,
		propertyName?: string,
	): DocTypeSchema {
		const schema = resolveType(type);
		if (isPrimitiveSchema(schema)) {
			return schema;
		}
		if ("$ref" in schema) {
			return schema;
		}
		if ("oneOf" in schema) {
			return registerDefinition("InlineUnion", () => schema);
		}
		if ("properties" in schema) {
			return registerDefinition("InlineObject", () => schema);
		}
		if ("items" in schema) {
			const itemSchema = schema.items;
			if (isPrimitiveSchema(itemSchema) || "$ref" in itemSchema) {
				return schema;
			}
			return registerDefinition("InlineArray", () => schema);
		}
		const t = type as {name?: string; typeArguments?: unknown[]};
		const name = typeDisplayName(t, "UnknownType");
		if (
			(name === "Partial" || name.startsWith("Partial<")) &&
			t.typeArguments?.length
		) {
			const partialKey =
				buildUtilityDefinitionName("Partial", t.typeArguments) ??
				"Partial_IconProps";
			if (
				propertyName === "iconProps" &&
				partialKey === "Partial_IconProps" &&
				tsResolverSourceFile?.includes("ViewportIconButton")
			) {
				const iconProps =
					tsResolver?.tryResolvePropertyFromSourceType?.(
						"ViewportIconButtonThemeStyleProps",
						"iconProps",
						tsResolverSourceFile,
					);
				if (iconProps) {
					return registerDefinition(
						"ViewportIconButton_iconProps",
						() => iconProps,
					);
				}
			}
			return registerDefinition(partialKey, () => schema);
		}
		return registerDefinition(name, () => schema);
	}

	return {
		definitions,
		resolveType: resolvePropertyType,
		projectRoot,
		tsMantineDocLinkForProps: tsResolver?.mantineDocLinkForProps.bind(
			tsResolver,
		),
		setEntrySourceFile(sourceFile: string | undefined) {
			tsResolverSourceFile = sourceFile;
			tsResolver?.setSourceFileContext(sourceFile);
		},
		disposePrograms: tsResolver?.clearPrograms.bind(tsResolver),
	};
}

export type DocFlatEntry = {
	configPath: string;
	category?: string;
	[name: string]: unknown;
};

export type DocFlatDocument = {
	definitions: Record<string, DocTypeDefinition>;
	entries: unknown[];
	/** `configPath` lists grouped by `@category` for quick filtering. */
	entriesByCategory: Record<string, string[]>;
};

export function buildEntriesByCategory(
	entries: DocFlatEntry[],
): Record<string, string[]> {
	const grouped: Record<string, string[]> = {};
	for (const entry of entries) {
		if (!entry.category) continue;
		const list = grouped[entry.category] ?? [];
		list.push(entry.configPath);
		grouped[entry.category] = list;
	}
	for (const category of Object.keys(grouped)) {
		grouped[category]!.sort();
	}
	return grouped;
}

export function wrapDocFlatEntries(
	entries: unknown[],
	definitions: Record<string, DocTypeDefinition>,
): DocFlatDocument {
	const typedEntries = entries as DocFlatEntry[];
	return {
		definitions,
		entries,
		entriesByCategory: buildEntriesByCategory(typedEntries),
	};
}

export {
	buildIntersectionDefinitionName,
	refForDefinitionName,
	sanitizeDefinitionName,
};

const COMPACT_VIEWPORT_OVERLAY_WRAPPER_PROPS: DocTypeDefinition = {
	properties: {
		children: {type: "unknown", name: "ReactNode"},
		position: {
			type: "unknown",
			name: "ResponsiveValueType<OverlayPositionType>",
		},
		offset: {type: "string"},
		offsetX: {type: "string"},
		offsetY: {type: "string"},
		className: {type: "string"},
	},
};

const MANTINE_PROPS_STUB_LINE_THRESHOLD = 500;
const DOMAIN_RECORD_STUB_LINE_THRESHOLD = 80;

/** Final pass: fix definitions polluted by late registration order or Iconify expansion. */
export function postProcessDefinitions(
	definitions: Record<string, DocTypeDefinition>,
	mantineDocLinkForProps?: (name: string) => string | undefined,
): void {
	if (definitions.Partial_IconProps) {
		definitions.Partial_IconProps = COMPACT_ICON_PROPS;
	}

	if (definitions.ViewportOverlayWrapperProps_and_Partial_OverlayStyleProps) {
		definitions.ViewportOverlayWrapperProps_and_Partial_OverlayStyleProps =
			COMPACT_VIEWPORT_OVERLAY_WRAPPER_PROPS;
	}

	if (definitions.Record_string_ISelectComponentOverrides) {
		definitions.Record_string_ISelectComponentOverrides =
			compactRecordStringISelectComponentOverrides();
	}

	for (const key of Object.keys(definitions)) {
		if (isDomEventHandlerTypeName(key)) {
			delete definitions[key];
		}
	}

	for (const key of Object.keys(definitions)) {
		const pickOmitMatch = /^(Pick|Omit)_(.+)$/.exec(key);
		if (!pickOmitMatch) continue;
		const baseName = pickOmitMatch[2];
		if (!baseName.endsWith("Props")) continue;
		const def = definitions[key];
		const propCount =
			def && "properties" in def && def.properties
				? Object.keys(def.properties).length
				: 0;
		if (propCount === 0 || definitions[baseName]) {
			delete definitions[key];
		}
	}

	for (const key of Object.keys(definitions)) {
		if (key === "MantineResponsiveCssSize") continue;
		const def = definitions[key];
		if (!def) continue;
		if (matchesMantineResponsiveCssSize(def) || isBreakpointSizeObjectSchema(def)) {
			rewriteDefinitionRefs(definitions, key, "MantineResponsiveCssSize");
			continue;
		}
		if (
			"properties" in def &&
			def.properties &&
			isFingerprintCandidateKey(key)
		) {
			const stableName = stableDefinitionNameForPropertyKeys(def.properties);
			if (stableName && stableName !== key) {
				if (!definitions[stableName]) {
					definitions[stableName] = def;
				}
				rewriteDefinitionRefs(definitions, key, stableName);
			}
		}
	}

	for (const [key, def] of Object.entries(definitions)) {
		const lineCount = JSON.stringify(def, null, 2).split("\n").length;
		if (
			key.startsWith("Record_string_") &&
			lineCount >= DOMAIN_RECORD_STUB_LINE_THRESHOLD
		) {
			if (key === "Record_string_ISelectComponentOverrides") {
				definitions[key] = compactRecordStringISelectComponentOverrides();
			}
			continue;
		}

		if (lineCount < MANTINE_PROPS_STUB_LINE_THRESHOLD) continue;

		const baseName = key.replace(/^Partial_/, "");
		if (!baseName.endsWith("Props") && !baseName.endsWith("StyleProps")) {
			continue;
		}

		const propCount =
			"properties" in def && def.properties
				? Object.keys(def.properties).length
				: 0;
		const docLink =
			key === "SelectTextWeightedStyleProps"
				? "https://mantine.dev/core/text/?t=props"
				: mantineDocLinkForProps?.(baseName);
		definitions[key] = {
			type: "unknown",
			name: `${key} (${propCount} props — see Mantine docs)`,
			...(docLink ? {docLink} : {}),
		};
	}
}
