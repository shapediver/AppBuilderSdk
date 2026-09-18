import path from "path";
import {fileURLToPath} from "url";
import {defineConfig} from "vite";

const fixturesDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(fixturesDir, "../../..");

export default defineConfig({
	root: fixturesDir,
	server: {
		host: "127.0.0.1",
		port: 3000,
		strictPort: true,
		fs: {
			allow: [repoRoot],
		},
	},
	resolve: {
		alias: {
			"@AppBuilderLib": path.resolve(repoRoot, "src/shared"),
			"@AppBuilderShared": path.resolve(repoRoot, "src/shared"),
		},
	},
});
