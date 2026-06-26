import {execSync} from "node:child_process";
import {existsSync} from "node:fs";
import {resolve} from "node:path";

const repoRoot = resolve(__dirname, "../..");
const docFlatPath = resolve(repoRoot, "public/doc-flat.json");
const checkScript = resolve(repoRoot, "scripts/check-doc-flat-artifacts.mjs");

describe("doc-flat.json artifact check", () => {
	const docFlatExists = existsSync(docFlatPath);

	(docFlatExists ? it : it.skip)(
		"has no fw_string_or_number_* keys or see Mantine docs stubs",
		() => {
			execSync(`node "${checkScript}"`, {
				cwd: repoRoot,
				encoding: "utf8",
				stdio: "pipe",
			});
		},
	);
});
