#!/usr/bin/env node
/**
 * Validates generated public/doc-flat.json for known TypeDoc plugin artifacts.
 *
 * Hard failures (exit 1):
 * - Definition keys containing sanitized Mantine inline duplicates (fw_string_or_number_*)
 * - Stub strings pointing readers to external Mantine docs ("see Mantine docs")
 *
 * Soft metrics (reported; optional --max-unknown N to fail when exceeded):
 * - Count of top-level definitions with type "unknown"
 *
 * Usage:
 *   node scripts/check-doc-flat-artifacts.mjs
 *   node scripts/check-doc-flat-artifacts.mjs --max-unknown 40
 *   pnpm run check:doc-flat
 */

import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const docFlatPath = resolve(repoRoot, "public/doc-flat.json");

const STUB_PATTERN = /see Mantine docs/g;
const SANITIZED_KEY_PATTERN = /fw_string_or_number_/;

const args = process.argv.slice(2);
const maxUnknownArgIndex = args.indexOf("--max-unknown");
const maxUnknown =
	maxUnknownArgIndex >= 0 ? Number(args[maxUnknownArgIndex + 1]) : undefined;

if (maxUnknownArgIndex >= 0 && !Number.isFinite(maxUnknown)) {
	console.error("check-doc-flat-artifacts: --max-unknown requires a number");
	process.exit(1);
}

if (!existsSync(docFlatPath)) {
	console.error(
		`check-doc-flat-artifacts: missing ${docFlatPath} — run pnpm run docs first`,
	);
	process.exit(1);
}

const raw = readFileSync(docFlatPath, "utf8");
let doc;
try {
	doc = JSON.parse(raw);
} catch (error) {
	console.error(`check-doc-flat-artifacts: invalid JSON in ${docFlatPath}`);
	console.error(error);
	process.exit(1);
}

const definitions = doc.definitions ?? {};
const definitionKeys = Object.keys(definitions);

const sanitizedKeys = definitionKeys.filter((key) =>
	SANITIZED_KEY_PATTERN.test(key),
);
const stubMatches = raw.match(STUB_PATTERN) ?? [];
const unknownDefinitionKeys = definitionKeys.filter(
	(key) => definitions[key]?.type === "unknown",
);

const errors = [];

if (sanitizedKeys.length > 0) {
	errors.push(
		`${sanitizedKeys.length} definition key(s) match fw_string_or_number_*: ${sanitizedKeys.slice(0, 5).join(", ")}${sanitizedKeys.length > 5 ? "…" : ""}`,
	);
}

if (stubMatches.length > 0) {
	errors.push(
		`${stubMatches.length} occurrence(s) of "see Mantine docs" stub text`,
	);
}

if (
	maxUnknown !== undefined &&
	unknownDefinitionKeys.length > maxUnknown
) {
	errors.push(
		`${unknownDefinitionKeys.length} top-level unknown definitions exceed --max-unknown ${maxUnknown}`,
	);
}

const metrics = {
	docFlatPath: "public/doc-flat.json",
	entryCount: Array.isArray(doc.entries) ? doc.entries.length : 0,
	definitionCount: definitionKeys.length,
	sanitizedKeyCount: sanitizedKeys.length,
	seeMantineDocsCount: stubMatches.length,
	unknownDefinitionCount: unknownDefinitionKeys.length,
};

console.log("doc-flat artifact check:");
console.log(`  entries: ${metrics.entryCount}`);
console.log(`  definitions: ${metrics.definitionCount}`);
console.log(`  fw_string_or_number_* keys: ${metrics.sanitizedKeyCount}`);
console.log(`  "see Mantine docs" occurrences: ${metrics.seeMantineDocsCount}`);
console.log(`  top-level unknown definitions: ${metrics.unknownDefinitionCount}`);

if (errors.length > 0) {
	console.error("\ncheck-doc-flat-artifacts: FAILED");
	for (const message of errors) {
		console.error(`  - ${message}`);
	}
	process.exit(1);
}

console.log("\ncheck-doc-flat-artifacts: OK");
