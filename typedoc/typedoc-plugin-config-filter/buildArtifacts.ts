import {
	mantineCorePropsDocKeyForMirrorName,
	resolveMantineCorePropsMirrorForDocKey,
} from "./mantineMirrorParser";
import type {DefinitionsContext, DocTypeSchema} from "./typeDefinitions";
import {
	createDefinitionsContext,
	entryPropertiesFromDefinition,
	postProcessDefinitions,
	postProcessFlatEntries,
	wrapDocFlatEntries,
	type DocFlatDocument,
} from "./typeDefinitions";

export {
	createDefinitionsContext,
	postProcessDefinitions,
	postProcessFlatEntries,
	wrapDocFlatEntries,
};
export type {DefinitionsContext, DocFlatDocument, DocTypeSchema};

/**
 * @typedef {Object} DocProperty
 * @property {string} name
 * @property {string} description
 * @property {DocTypeSchema} type
 * @property {string} [default]
 * @property {string} [minimum]
 * @property {string} [maximum]
 * @property {string} [example]
 */

/**
 * @typedef {Object} DocFlatEntry
 * @property {string} configPath
 * @property {string} name
 * @property {string} summary
 * @property {string} source
 * @property {DocProperty[]} [properties]
 * @property {string} [docLink] External reference URL when props are not inlined (e.g. Mantine docs).
 * @property {string} [category] From `@category` — FSD grouping for filtering entries (e.g. `widget`, `entity`).
 */

/**
 * Last occurrence wins; duplicate configPath triggers onDuplicate before overwrite.
 * @param {DocFlatEntry[]} entries
 * @param {(configPath: string) => void} onDuplicate
 * @returns {DocFlatEntry[]}
 */
export function dedupeFlatEntriesByConfigPath(entries, onDuplicate) {
	/** @type {Map<string, DocFlatEntry>} */
	const map = new Map();
	for (const entry of entries) {
		if (map.has(entry.configPath)) {
			onDuplicate(entry.configPath);
		}
		map.set(entry.configPath, entry);
	}
	return Array.from(map.entries(), ([, value]) => value);
}

/**
 * @param {Record<string, unknown>} obj
 * @param {string} dotPath
 * @param {unknown} value
 */
function setAtPath(obj, dotPath, value) {
	const keys = dotPath.split(".");
	const isUnsafeKey = (key) =>
		key === "__proto__" || key === "prototype" || key === "constructor";
	let current = obj;
	for (let i = 0; i < keys.length - 1; i++) {
		const key = keys[i];
		if (isUnsafeKey(key)) {
			return;
		}
		const next = current[key];
		if (!next || typeof next !== "object") {
			current[key] = {};
		}
		current = /** @type {Record<string, unknown>} */ current[key];
	}
	const lastKey = keys[keys.length - 1];
	if (isUnsafeKey(lastKey)) {
		return;
	}
	current[lastKey] = value;
}

/**
 * @param {DocFlatEntry[]} entries
 * @returns {Record<string, unknown>}
 */
export function buildNestedDocRoot(entries) {
	/** @type {Record<string, unknown>} */
	const root = {};
	for (const entry of entries) {
		/** @type {Record<string, unknown>} */
		const leaf = {
			properties: entry.properties ?? [],
		};
		if (entry.docLink) {
			leaf.docLink = entry.docLink;
		}
		if (entry.category) {
			leaf.category = entry.category;
		}
		setAtPath(root, entry.configPath, leaf);
	}
	return root;
}

/**
 * Map a TypeDoc property/member reflection to a doc-flat property object.
 * @param {any} child
 * @param {(arr: any[] | undefined) => string} getText
 * @param {(value: string) => string} processTagValue
 * @param {DefinitionsContext} definitionsContext
 * @returns {DocProperty}
 */
function mapReflectionChild(
	child,
	getText,
	processTagValue,
	definitionsContext,
) {
	const prop = {
		name: child.name,
		description: getText(child.comment?.summary),
		type:
			child.name === "themeOverride"
				? definitionsContext.resolveType({
						type: "reference",
						name: "MantineThemeOverride",
					})
				: definitionsContext.resolveType(child.type, child.name),
	};

	const childTags = child.comment?.blockTags;
	if (childTags) {
		for (const tag of childTags) {
			const tagName = tag.tag;
			if (
				tagName === "@default" ||
				tagName === "@minimum" ||
				tagName === "@maximum" ||
				tagName === "@example"
			) {
				const key = tagName.substring(1);
				prop[key] = processTagValue(getText(tag.content));
			}
		}
	}

	return prop;
}

/**
 * @param {any} type
 * @returns {string | undefined}
 */
function typeReferenceName(type) {
	if (!type || type.type !== "reference") return undefined;
	return type.name ?? type.reflection?.name;
}

/**
 * When a `@docAttached` type is an empty `extends Mantine*Props` (or alias to one),
 * return the canonical mirror doc key (e.g. `PaperProps`).
 *
 * @param {any} type
 * @param {number} [depth]
 * @returns {string | undefined}
 */
export function detectMirroredMantinePropsDocKey(type, depth = 0) {
	if (!type || depth > 12) return undefined;

	const kind = type.type;
	if (kind === "reference") {
		const refName = typeReferenceName(type);
		if (!refName) return undefined;
		const fromMirror = mantineCorePropsDocKeyForMirrorName(refName);
		if (fromMirror) return fromMirror;
		return undefined;
	}

	if (kind === "intersection") {
		const members = type.types ?? [];
		const mirrorKeys = members
			.map((member) =>
				detectMirroredMantinePropsDocKey(member, depth + 1),
			)
			.filter(Boolean);
		const hasInlineMembers = members.some(
			(member) =>
				member.type === "reflection" &&
				member.declaration?.children?.length,
		);
		if (mirrorKeys.length === 1 && !hasInlineMembers) {
			return mirrorKeys[0];
		}
		return undefined;
	}

	if (kind === "optional") {
		return detectMirroredMantinePropsDocKey(type.elementType, depth + 1);
	}

	return undefined;
}

/**
 * @param {string} docKey
 * @param {DefinitionsContext} definitionsContext
 * @returns {DocProperty[]}
 */
function collectPropertiesFromMirrorDocKey(docKey, definitionsContext) {
	let mirror = definitionsContext.definitions[docKey];
	if (
		(!mirror || !("properties" in mirror) || !mirror.properties) &&
		definitionsContext.projectRoot
	) {
		mirror = resolveMantineCorePropsMirrorForDocKey(
			definitionsContext.projectRoot,
			docKey,
		);
	}
	if (!mirror || !("properties" in mirror) || !mirror.properties) {
		return [];
	}
	return entryPropertiesFromDefinition(mirror);
}

/**
 * Collect theme doc properties from a TypeDoc DeclarationReflection.
 * Uses `reflection.children` when present; otherwise walks `reflection.type`
 * (intersections, inline object reflections, resolved references) so that
 * `export type X = SomeInterface & { ... }` still yields properties.
 *
 * @param {any} reflection - TypeDoc DeclarationReflection
 * @param {(arr: any[] | undefined) => string} getText
 * @param {(value: string) => string} processTagValue
 * @param {DefinitionsContext} definitionsContext
 * @returns {DocProperty[]}
 */
export function collectDocFlatProperties(
	reflection,
	getText,
	processTagValue,
	definitionsContext,
) {
	const mapChild = (child) =>
		mapReflectionChild(child, getText, processTagValue, definitionsContext);

	if (reflection.children?.length) {
		return reflection.children.map(mapChild);
	}

	if (!reflection.type) {
		return [];
	}

	const mirrorDocKey = detectMirroredMantinePropsDocKey(reflection.type);
	if (mirrorDocKey) {
		const mirrorProps = collectPropertiesFromMirrorDocKey(
			mirrorDocKey,
			definitionsContext,
		);
		if (mirrorProps.length) {
			return mirrorProps;
		}
	}

	/** @type {Map<string, DocProperty>} */
	const merged = new Map();

	function mergeChildren(children) {
		if (!children?.length) return;
		for (const child of children) {
			merged.set(child.name, mapChild(child));
		}
	}

	/** @type {Set<unknown>} */
	const visitedTypes = new Set();

	/**
	 * @param {any} type
	 * @param {number} depth
	 */
	function walk(type, depth) {
		if (!type || depth > 24) return;
		if (visitedTypes.has(type)) return;
		visitedTypes.add(type);

		const kind = type.type;
		if (kind === "intersection") {
			for (const sub of type.types || []) {
				walk(sub, depth + 1);
			}
			return;
		}
		if (kind === "optional") {
			walk(type.elementType, depth + 1);
			return;
		}
		if (kind === "reflection") {
			mergeChildren(type.declaration?.children);
			return;
		}
		if (kind === "reference") {
			const refRefl = type.reflection;
			if (refRefl?.children?.length) {
				mergeChildren(refRefl.children);
				return;
			}
			const refName = type.name ?? type.reflection?.name ?? "";
			const needsTsFallback =
				/^Mantine[A-Z]\w*Props$/.test(refName) ||
				refName === "Pick" ||
				refName === "Omit" ||
				refName === "Partial";
			if (!needsTsFallback) {
				return;
			}
			const resolved = definitionsContext.resolveType(type);
			if (resolved && "properties" in resolved && resolved.properties) {
				for (const [propName, propSchema] of Object.entries(
					resolved.properties,
				)) {
					const {
						description,
						default: defaultValue,
						...typeSchema
					} = propSchema;
					const prop = {
						name: propName,
						description: description ?? "",
						type: typeSchema,
					};
					if (defaultValue !== undefined) {
						prop.default = defaultValue;
					}
					merged.set(propName, prop);
				}
			}
			return;
		}
	}

	walk(reflection.type, 0);
	return Array.from(merged.values());
}
