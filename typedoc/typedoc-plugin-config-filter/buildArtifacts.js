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
