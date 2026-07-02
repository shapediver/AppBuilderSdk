import fs from "fs";
import path from "path";
import {fileURLToPath} from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const viewerRoot = path.resolve(__dirname, "../Viewer");

function collectViewerAliases(rootDir: string): Record<string, string> {
	const aliases: Record<string, string> = {};

	function walk(dir: string) {
		for (const entry of fs.readdirSync(dir, {withFileTypes: true})) {
			if (entry.name === "node_modules" || entry.name === ".git") continue;

			const fullPath = path.join(dir, entry.name);
			if (entry.isDirectory()) {
				walk(fullPath);
				continue;
			}

			if (entry.name !== "package.json") continue;

			const pkg = JSON.parse(fs.readFileSync(fullPath, "utf8")) as {
				name?: string;
			};
			if (!pkg.name?.startsWith("@shapediver/viewer")) continue;

			const packageDir = path.dirname(fullPath);
			const srcIndex = path.join(packageDir, "src", "index.ts");
			if (fs.existsSync(srcIndex)) aliases[pkg.name] = srcIndex;
		}
	}

	walk(rootDir);
	return aliases;
}

/**
 * Example configuration for linking all local @shapediver/viewer* workspace
 * packages to a sibling Viewer source checkout.
 *
 * Usage:
 *   1. Copy this file to viewer.local.ts (which is gitignored)
 *   2. Adjust viewerRoot above if your Viewer checkout is in a different location
 *   3. Run `npm start`
 */
export default collectViewerAliases(viewerRoot) satisfies Record<string, string>;
