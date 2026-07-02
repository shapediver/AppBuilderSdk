import fs from "node:fs";
import path from "node:path";
import {fileURLToPath} from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const mantinePropsDir = path.join(root, "src/shared/shared/mantine-props");

/**
 * Schemas defined once in a canonical `*.zod.ts` and imported elsewhere.
 * Key: export name. Value: canonical file basename.
 */
const SHARED_SCHEMAS = {
	mantineSpacingSchema: "spacing.zod.ts",
	mantineSizeTokenSchema: "spacing.zod.ts",
	mantineCssLengthSchema: "primitives.zod.ts",
	mantineCssStyleRecordSchema: "primitives.zod.ts",
	mantineFlexWrapSchema: "primitives.zod.ts",
	mantineStylesApiValueSchema: "primitives.zod.ts",
	mantineStylesApiSchema: "primitives.zod.ts",
	mantineResponsiveCssSizeSchema: "primitives.zod.ts",
	appBuilderThemeOtherPropsSchema: "appBuilderThemeOther.zod.ts",
};

/**
 * Remove `export const <name>… = …;` including multiline RHS (e.g. z.union/z.lazy).
 */
function removeSchemaExport(source, schemaName) {
	const marker = `export const ${schemaName}`;
	const start = source.indexOf(marker);
	if (start === -1) return source;

	let depth = 0;
	let foundAssign = false;
	let i = start + marker.length;

	for (; i < source.length; i++) {
		const ch = source[i];
		if (ch === "(" || ch === "[" || ch === "{") depth++;
		if (ch === ")" || ch === "]" || ch === "}") depth--;
		if (ch === "=") foundAssign = true;
		if (foundAssign && ch === ";" && depth === 0) {
			i++;
			if (source[i] === "\r") i++;
			if (source[i] === "\n") i++;
			break;
		}
	}

	return source.slice(0, start) + source.slice(i);
}

function schemaIsExported(source, schemaName) {
	return new RegExp(`^export const ${schemaName}(?::|\\s*=)`, "m").test(
		source,
	);
}

/**
 * After ts-to-zod, replace duplicated shared schema exports with imports
 * from the canonical module.
 */
export function dedupeMantinePropsZodFiles(dir = mantinePropsDir) {
	const zodFiles = fs
		.readdirSync(dir)
		.filter((name) => name.endsWith(".zod.ts"))
		.sort();

	for (const fileName of zodFiles) {
		const canonicalSchemas = Object.entries(SHARED_SCHEMAS).filter(
			([, canonical]) => canonical !== fileName,
		);
		if (canonicalSchemas.length === 0) continue;

		const filePath = path.join(dir, fileName);
		let source = fs.readFileSync(filePath, "utf8");
		const importsNeeded = new Map();

		for (const [schemaName] of canonicalSchemas) {
			if (!schemaIsExported(source, schemaName)) continue;

			source = removeSchemaExport(source, schemaName);
			if (new RegExp(`\\b${schemaName}\\b`).test(source)) {
				const canonicalFile = SHARED_SCHEMAS[schemaName];
				const importFrom = `./${canonicalFile.replace(/\.ts$/, "")}`;
				const names = importsNeeded.get(importFrom) ?? new Set();
				names.add(schemaName);
				importsNeeded.set(importFrom, names);
			}
		}

		if (importsNeeded.size === 0) continue;

		const bodyWithoutImports = source.replace(/^import .+;\r?\n/gm, "");
		for (const [importFrom, names] of importsNeeded) {
			const sorted = [...names]
				.filter((name) =>
					new RegExp(`\\b${name}\\b`).test(bodyWithoutImports),
				)
				.sort();
			if (sorted.length === 0) continue;
			const importLine = `import { ${sorted.join(", ")} } from "${importFrom}";`;
			const existingImport = source.match(
				new RegExp(
					`^import \\{([^}]+)\\} from "${importFrom.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}";`,
					"m",
				),
			);
			if (existingImport) {
				const current = existingImport[1]
					.split(",")
					.map((s) => s.trim())
					.filter(Boolean);
				const merged = [...new Set([...current, ...sorted])].sort();
				const mergedLine = `import { ${merged.join(", ")} } from "${importFrom}";`;
				source = source.replace(existingImport[0], mergedLine);
			} else {
				const zodImportMatch = source.match(
					/^import \{ z \} from "zod";\r?\n/m,
				);
				if (zodImportMatch) {
					const insertAt =
						zodImportMatch.index + zodImportMatch[0].length;
					source =
						source.slice(0, insertAt) +
						importLine +
						"\n" +
						source.slice(insertAt);
				} else {
					source = importLine + "\n" + source;
				}
			}
		}

		source = source.replace(/\n{3,}/g, "\n\n");
		fs.writeFileSync(filePath, source);
	}

	for (const fileName of zodFiles) {
		const filePath = path.join(dir, fileName);
		const source = fs.readFileSync(filePath, "utf8");
		const cleaned = cleanSpuriousZodImports(source, fileName).replace(
			/\n{3,}/g,
			"\n\n",
		);
		if (cleaned !== source) {
			fs.writeFileSync(filePath, cleaned);
		}
	}
}

/** ts-to-zod may emit type-only imports from inline cache or schema-input. */
function cleanSpuriousZodImports(source, fileName) {
	source = source.replace(
		/^import \{ type \w+ \} from "[^"]*mantine-props-zod-inline[^"]*";\r?\n/gm,
		"",
	);

	if (fileName !== "primitives.zod.ts") {
		source = source.replace(
			/^import \{ type \w+ \} from "\.\/[^"]+\.schema-input";\r?\n/gm,
			"",
		);
	}

	return source;
}

export function assertSingleSharedSchemaExports(dir = mantinePropsDir) {
	for (const [schemaName, canonicalFile] of Object.entries(SHARED_SCHEMAS)) {
		const exporters = [];
		for (const fileName of fs
			.readdirSync(dir)
			.filter((name) => name.endsWith(".zod.ts"))) {
			const content = fs.readFileSync(path.join(dir, fileName), "utf8");
			if (schemaIsExported(content, schemaName)) {
				exporters.push(fileName);
			}
		}
		if (exporters.length !== 1 || exporters[0] !== canonicalFile) {
			throw new Error(
				`${schemaName} must be exported only from ${canonicalFile}; found in: ${exporters.join(", ") || "none"}`,
			);
		}
	}
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
	dedupeMantinePropsZodFiles();
	assertSingleSharedSchemaExports();
	console.log("mantine-props *.zod.ts: shared schemas deduplicated.");
}
