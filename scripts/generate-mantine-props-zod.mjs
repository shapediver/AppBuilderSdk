import {execSync} from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import {fileURLToPath, pathToFileURL} from "node:url";
import {
	assertSingleSharedSchemaExports,
	dedupeMantinePropsZodFiles,
} from "./dedupe-mantine-props-zod.mjs";
import {inlineMantineSchemaInputTypes} from "./inline-mantine-schema-input-types.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const configPath = path.join(
	root,
	"src/shared/shared/mantine-props/ts-to-zod.config.mjs",
);
const config = (await import(pathToFileURL(configPath).href)).default;

const CANONICAL_SCHEMA_INPUT = new Set([
	"spacing.schema-input.ts",
	"primitives.schema-input.ts",
]);

if (!Array.isArray(config) || config.length === 0) {
	console.error(`No tasks in ${configPath}`);
	process.exit(1);
}

const inlineCacheDir = path.join(
	root,
	"node_modules/.cache/mantine-props-zod-inline",
);
fs.mkdirSync(inlineCacheDir, {recursive: true});

for (const task of config) {
	const {input, output, name = path.basename(input)} = task;
	const inputAbs = path.join(root, input);
	const baseName = path.basename(input);

	let tsToZodInput = input;
	let tmpFile = null;

	if (!CANONICAL_SCHEMA_INPUT.has(baseName)) {
		const inlined = inlineMantineSchemaInputTypes(inputAbs);
		tmpFile = path.join(
			inlineCacheDir,
			baseName.replace(/\.schema-input\.ts$/, ".inline.ts"),
		);
		fs.writeFileSync(tmpFile, inlined, "utf8");
		tsToZodInput = path
			.relative(root, tmpFile)
			.split(path.sep)
			.join("/");
	}

	console.log(`\nts-to-zod (${name}): ${input} → ${output}`);
	execSync(`pnpm exec ts-to-zod "${tsToZodInput}" "${output}"`, {
		cwd: root,
		stdio: "inherit",
	});
}

console.log("\nDeduping shared mantine-props Zod schemas…");
dedupeMantinePropsZodFiles();
assertSingleSharedSchemaExports();
