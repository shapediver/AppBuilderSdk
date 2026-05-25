import {sentryVitePlugin} from "@sentry/vite-plugin";
import react from "@vitejs/plugin-react";
import fs from "fs";
import path, {resolve} from "path";
import {defineConfig} from "vite";
import {analyzer} from "vite-bundle-analyzer";
import svgrPlugin from "vite-plugin-svgr";
import {CONFIG} from "./sentryconfig";

const isDev = process.env.NODE_ENV === "development";
const plugins = [react(), svgrPlugin()];
if (CONFIG.SENTRY_ORG && CONFIG.SENTRY_PROJECT) {
	plugins.push(
		sentryVitePlugin({
			org: CONFIG.SENTRY_ORG,
			project: CONFIG.SENTRY_PROJECT,
			authToken: process.env.SENTRY_AUTH_TOKEN,
		}),
	);
}

if (isDev) {
	plugins.push(analyzer());
}

// Check if local modelstorage file exists
const localModelStoragePath = path.resolve(
	__dirname,
	"./modelstorage.local.ts",
);
const modelStoragePath =
	isDev && fs.existsSync(localModelStoragePath)
		? localModelStoragePath
		: path.resolve(__dirname, "./modelstorage.ts");

// Check if local viewer override file exists (viewer.local.ts — gitignored).
// When present, aliases and optimizeDeps are loaded from that file so that
// @shapediver/viewer.* imports resolve directly from the local Viewer source tree.
const useLocalViewer =
	isDev && fs.existsSync(path.resolve(__dirname, "./viewer.local.ts"));

// https://vitejs.dev/config/
export default defineConfig(async () => {
	// Use an absolute file:// URL so dynamic import resolves correctly even when
	// Vite moves the compiled config to a temp directory during builds.
	const {pathToFileURL} = await import("url");
	const viewerLocalUrl = pathToFileURL(
		path.resolve(__dirname, "viewer.local.ts"),
	).href;
	const viewerAlias: Record<string, string> = useLocalViewer
		? (await import(viewerLocalUrl)).default
		: {};

	// When local viewer source is active, watch its source directories and
	// restart the dev server when files change.
	if (useLocalViewer && Object.keys(viewerAlias).length > 0) {
		// viewerAlias values are already absolute paths from path.resolve() in viewer.local.ts
		const viewerSrcDirs = [
			...new Set(Object.values(viewerAlias).map((p) => path.dirname(p))),
		];
		plugins.push({
			name: "viewer-source-restart",
			configureServer(server) {
				viewerSrcDirs.forEach((dir) => server.watcher.add(dir));
				// chokidar emits absolute normalized paths; compare directly
				server.watcher.on("change", (file) => {
					if (
						viewerSrcDirs.some(
							(dir) =>
								file === dir || file.startsWith(dir + path.sep),
						)
					) {
						server.restart();
					}
				});
			},
		} as import("vite").Plugin);
	}

	return {
		plugins,
		server: {
			open: true,
			port: 3000,
			fs: {
				// Allow serving files from the local Viewer monorepo when viewer.local.ts exists
				allow: useLocalViewer ? [".."] : ["."],
			},
		},
		build: {
			rolldownOptions: {
				input: {
					appbuilder: resolve(__dirname, "index.html"),
					example: resolve(__dirname, "example.html"),
					library: resolve(__dirname, "library.html"),
				},
				output: {
					codeSplitting: {
						groups: [
							{
								name: "react",
								test: /node_modules[\\/](react|react-dom|react-router-dom)([\\/]|$)/,
								priority: 30,
							},
							{
								name: "mantine",
								test: /node_modules[\\/]@mantine[\\/](core|hooks|notifications)([\\/]|$)/,
								priority: 29,
							},
							{
								name: "mantineCharts",
								test: /node_modules[\\/]@mantine[\\/]charts([\\/]|$)/,
								priority: 28,
							},
							{
								name: "shapediver",
								test: /node_modules[\\/]@shapediver[\\/]sdk\.(geometry-api-sdk-v2|platform-api-sdk-v1)([\\/]|$)/,
								priority: 27,
							},
							{
								name: "shapediverViewer",
								test: /node_modules[\\/]@shapediver[\\/]viewer\.(session|viewport)([\\/]|$)/,
								priority: 26,
							},
							{
								name: "shapediverViewerMisc",
								test: /node_modules[\\/]@shapediver[\\/]viewer\.(utils\.mime-type|features\.(attribute-visualization|drawing-tools|interaction|transformation-tools))([\\/]|$)/,
								priority: 25,
							},
							{
								name: "stargate",
								test: /node_modules[\\/]@shapediver[\\/]sdk\.stargate-sdk-v1([\\/]|$)/,
								priority: 24,
							},
							{
								name: "utils",
								test: /node_modules[\\/](immer|zustand|zod|uuid|gl-matrix)([\\/]|$)/,
								priority: 23,
							},
							{
								name: "markdown",
								test: /node_modules[\\/](react-markdown|remark-directive|remark-gfm|unist-util-visit)([\\/]|$)/,
								priority: 22,
							},
							{
								name: "agent",
								test: /node_modules[\\/](openai|langfuse)([\\/]|$)/,
								priority: 21,
							},
						],
					},
				},
			},
			sourcemap: true,
		},
		// When using local viewer source, force the optimizer to pre-bundle the aliased
		// packages in full bundler mode. This correctly handles `export type` stripping
		// across files, avoiding "does not provide an export named X" runtime errors
		// that occur when Vite transforms TypeScript files individually.
		optimizeDeps: useLocalViewer
			? {
					include: [
						"@shapediver/viewer.features.attribute-visualization",
						"@shapediver/viewer.features.drawing-tools",
						"@shapediver/viewer.features.interaction",
						"@shapediver/viewer.features.transformation-tools",
						"@shapediver/viewer.session",
						"@shapediver/viewer.viewport",
						"@shapediver/viewer.shared.global-access-objects",
						"@shapediver/viewer.shared.types",
					],
				}
			: {},
		resolve: {
			tsconfigPaths: true,
			alias: {
				"@AppBuilderShared": path.resolve(__dirname, "./src/shared"),
				"@AppBuilderLib": path.resolve(__dirname, "./src/shared"),
				"~": path.resolve(__dirname, "./src"),
				"@modelstorage": modelStoragePath,
				...viewerAlias,
			},
		},
	};
});
