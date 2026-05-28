import {execSync} from "node:child_process";
import path from "node:path";
import {fileURLToPath, pathToFileURL} from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const configPath = path.join(
	root,
	"src/shared/shared/mantine-props/ts-to-zod.config.mjs",
);
const config = (await import(pathToFileURL(configPath).href)).default;

if (!Array.isArray(config) || config.length === 0) {
	console.error(`No tasks in ${configPath}`);
	process.exit(1);
}

for (const task of config) {
	const {input, output, name = path.basename(input)} = task;
	console.log(`\nts-to-zod (${name}): ${input} → ${output}`);
	execSync(`pnpm exec ts-to-zod "${input}" "${output}"`, {
		cwd: root,
		stdio: "inherit",
	});
}
