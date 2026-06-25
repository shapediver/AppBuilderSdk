/**
 * Fast settings JSON validation (no Jest). Used by validate-settings-json.mjs.
 */
import {readFileSync} from "node:fs";
import {register} from "node:module";
import {dirname, join} from "node:path";
import process from "node:process";
import {fileURLToPath, pathToFileURL} from "node:url";

/** Minimal surface from appbuildertypecheck.ts (dynamic import — loader must register first). */
interface AppBuilderTypecheckModule {
	validateAppBuilderSettingsJson: (
		value: unknown,
	) => {success: true; data: unknown} | {success: false; error: unknown};
	formatAppBuilderZodError: (error: unknown) => string;
}

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..");

register("./validate-settings-json-loader.mjs", import.meta.url);

const file = process.env.VALIDATE_SETTINGS_FILE;
if (!file) {
	console.error(
		"validate-settings-json-runner: VALIDATE_SETTINGS_FILE not set",
	);
	process.exit(1);
}

const typecheckUrl = pathToFileURL(
	join(
		repoRoot,
		"src/shared/features/appbuilder/config/appbuildertypecheck.ts",
	),
).href;

const {formatAppBuilderZodError, validateAppBuilderSettingsJson} =
	(await import(typecheckUrl)) as AppBuilderTypecheckModule;

let json: unknown;
try {
	json = JSON.parse(readFileSync(file, "utf8"));
} catch (error) {
	console.error(
		`Invalid JSON in ${file}: ${error instanceof Error ? error.message : String(error)}`,
	);
	process.exit(1);
}

const result = validateAppBuilderSettingsJson(json);
if (!result.success) {
	console.error(
		`Settings JSON invalid (${file}):\n${formatAppBuilderZodError(result.error)}`,
	);
	process.exit(1);
}

console.log(`Settings JSON valid: ${file}`);
