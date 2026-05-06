/**
 * @typedef {Object} DocProperty
 * @property {string} name
 * @property {string} description
 * @property {string} type
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
	let current = obj;
	for (let i = 0; i < keys.length - 1; i++) {
		const key = keys[i];
		const next = current[key];
		if (!next || typeof next !== "object") {
			current[key] = {};
		}
		current = /** @type {Record<string, unknown>} */ (current[key]);
	}
	current[keys[keys.length - 1]] = value;
}

/**
 * @param {DocFlatEntry[]} entries
 * @returns {Record<string, unknown>}
 */
export function buildNestedDocRoot(entries) {
	/** @type {Record<string, unknown>} */
	const root = {};
	for (const entry of entries) {
		setAtPath(root, entry.configPath, {
			properties: entry.properties ?? [],
		});
	}
	return root;
}

/**
 * Map a TypeDoc property/member reflection to a doc-flat property object.
 * @param {any} child
 * @param {(arr: any[] | undefined) => string} getText
 * @param {(value: string) => string} processTagValue
 * @returns {DocProperty}
 */
function mapReflectionChild(child, getText, processTagValue) {
	const prop = {
		name: child.name,
		description: getText(child.comment?.summary),
		type: child.type?.toString?.() || "unknown",
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
 * Collect theme doc properties from a TypeDoc DeclarationReflection.
 * Uses `reflection.children` when present; otherwise walks `reflection.type`
 * (intersections, inline object reflections, resolved references) so that
 * `export type X = SomeInterface & { ... }` still yields properties.
 *
 * @param {any} reflection - TypeDoc DeclarationReflection
 * @param {(arr: any[] | undefined) => string} getText
 * @param {(value: string) => string} processTagValue
 * @returns {DocProperty[]}
 */
export function collectDocFlatProperties(reflection, getText, processTagValue) {
	const mapChild = (child) =>
		mapReflectionChild(child, getText, processTagValue);

	if (reflection.children?.length) {
		return reflection.children.map(mapChild);
	}

	if (!reflection.type) {
		return [];
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
		if (kind === "reflection") {
			mergeChildren(type.declaration?.children);
			return;
		}
		if (kind === "reference") {
			const refRefl = type.reflection;
			if (refRefl?.children?.length) {
				mergeChildren(refRefl.children);
			}
			return;
		}
	}

	walk(reflection.type, 0);
	return Array.from(merged.values());
}
