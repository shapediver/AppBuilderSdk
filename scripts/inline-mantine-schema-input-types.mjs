import fs from "node:fs";
import path from "node:path";
import {fileURLToPath} from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const mantinePropsDir = path.join(root, "src/shared/shared/mantine-props");

const CANONICAL_TYPE_FILES = [
	"spacing.schema-input.ts",
	"primitives.schema-input.ts",
];

/**
 * Extract `export type Name = …;` blocks (supports multiline unions / objects).
 */
export function extractExportedTypes(source) {
	const types = new Map();
	const marker = "export type ";
	let index = 0;

	while (index < source.length) {
		const start = source.indexOf(marker, index);
		if (start === -1) break;

		const nameStart = start + marker.length;
		const eq = source.indexOf("=", nameStart);
		if (eq === -1) break;

		const name = source.slice(nameStart, eq).trim();
		let i = eq + 1;
		let depth = 0;
		let foundSemicolon = false;

		for (; i < source.length; i++) {
			const ch = source[i];
			if (ch === "(" || ch === "[" || ch === "{") depth++;
			if (ch === ")" || ch === "]" || ch === "}") depth--;
			if (ch === ";" && depth === 0) {
				foundSemicolon = true;
				i++;
				break;
			}
		}

		if (!foundSemicolon) break;

		const body = source.slice(start, i).trimEnd();
		types.set(name, body.endsWith(";") ? body : `${body};`);
		index = i;
	}

	return types;
}

function loadCanonicalTypes(dir = mantinePropsDir) {
	const merged = new Map();
	for (const fileName of CANONICAL_TYPE_FILES) {
		const source = fs.readFileSync(path.join(dir, fileName), "utf8");
		for (const [name, decl] of extractExportedTypes(source)) {
			merged.set(name, {decl, from: fileName});
		}
	}
	return merged;
}

function parseTypeImports(source) {
	const imports = [];
	const re =
		/^import type \{([^}]+)\} from ["'](\.\/[^"']+)["'];\r?\n/gm;
	let match;
	while ((match = re.exec(source)) !== null) {
		const names = match[1]
			.split(",")
			.map((s) => s.trim())
			.filter(Boolean);
		imports.push({names, from: match[2]});
	}
	return imports;
}

function stripTypeImports(source) {
	return source.replace(
		/^import type \{[^}]+\} from ["']\.\/[^"']+["'];\r?\n/gm,
		"",
	);
}

/**
 * Expand `import type` from canonical schema-input files so ts-to-zod sees
 * concrete unions (cross-file imports become z.any() otherwise).
 */
export function inlineMantineSchemaInputTypes(
	inputPath,
	dir = mantinePropsDir,
) {
	const absoluteInput = path.isAbsolute(inputPath)
		? inputPath
		: path.join(
				inputPath.includes("mantine-props") ? root : dir,
				inputPath,
			);
	const source = fs.readFileSync(absoluteInput, "utf8");
	const baseName = path.basename(absoluteInput);

	if (CANONICAL_TYPE_FILES.includes(baseName)) {
		return source;
	}

	const canonical = loadCanonicalTypes(dir);
	const imports = parseTypeImports(source);
	const needed = new Set();
	for (const {names} of imports) {
		for (const name of names) needed.add(name);
	}

	const ordered = orderTypesWithDependencies(needed, canonical);

	const preludeLines = [
		"// @generated prelude — types inlined for ts-to-zod (see inline-mantine-schema-input-types.mjs)",
	];
	for (const name of ordered) {
		const entry = canonical.get(name);
		if (!entry) {
			throw new Error(
				`${baseName}: unknown imported type "${name}" — add it to spacing.schema-input.ts or primitives.schema-input.ts`,
			);
		}
		preludeLines.push(`// from ${entry.from}`, entry.decl, "");
	}

	const componentSource = stripTypeImports(source).trimStart();
	return `${preludeLines.join("\n")}\n${componentSource}`;
}

/** Include transitive type refs (e.g. MantineStylesApi → MantineStylesApiValue). */
function orderTypesWithDependencies(seed, canonical) {
	const included = new Set();
	const ordered = [];

	function visit(name) {
		if (included.has(name)) return;
		const entry = canonical.get(name);
		if (!entry) return;

		for (const other of canonical.keys()) {
			if (other === name || included.has(other)) continue;
			if (new RegExp(`\\b${other}\\b`).test(entry.decl)) {
				visit(other);
			}
		}

		included.add(name);
		ordered.push(name);
	}

	for (const name of seed) {
		visit(name);
	}

	return ordered;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
	const input = process.argv[2];
	if (!input) {
		console.error("Usage: node inline-mantine-schema-input-types.mjs <schema-input.ts>");
		process.exit(1);
	}
	process.stdout.write(inlineMantineSchemaInputTypes(input));
}
