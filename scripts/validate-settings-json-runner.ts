/**
 * Fast settings JSON validation (no Jest). Used by validate-settings-json.mjs.
 */
import {readFileSync} from "node:fs";
import {register} from "node:module";
import process from "node:process";

/** Minimal surface from appbuildertypecheck.ts (dynamic import — loader must register first). */
interface AppBuilderTypecheckModule {
	validateAppBuilderSettingsJson: (
		value: unknown,
	) => {success: true; data: unknown} | {success: false; error: unknown};
	formatAppBuilderZodError: (error: unknown) => string;
}

register(import.meta.resolve("./validate-settings-json-loader.mjs"));

const file = process.env.VALIDATE_SETTINGS_FILE;
if (!file) {
	console.error(
		"validate-settings-json-runner: VALIDATE_SETTINGS_FILE not set",
	);
	process.exit(1);
}

const {formatAppBuilderZodError, validateAppBuilderSettingsJson} =
	(await import(
		import.meta
			.resolve("../src/shared/features/appbuilder/config/appbuildertypecheck.ts")
	)) as AppBuilderTypecheckModule;

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
