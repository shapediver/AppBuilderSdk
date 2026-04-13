import {sentryVitePlugin} from "@sentry/vite-plugin";
import react from "@vitejs/plugin-react";
import fs from "fs";
import path, {resolve} from "path";
import {defineConfig} from "vite";
import {analyzer} from "vite-bundle-analyzer";
import svgrPlugin from "vite-plugin-svgr";
import viteTsconfigPaths from "vite-tsconfig-paths";
import {CONFIG} from "./sentryconfig";

const isDev = process.env.NODE_ENV === "development";
const plugins = [react(), viteTsconfigPaths(), svgrPlugin()];
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
	// The path is intentionally built at runtime to prevent bundlers from
	// statically resolving (and erroring on) this import during production builds.
	const viewerLocalPath = [".", "viewer.local.ts"].join("/");
	const viewerAlias: Record<string, string> = useLocalViewer
		? (await import(viewerLocalPath)).default
		: {};

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
			rollupOptions: {
				input: {
					appbuilder: resolve(__dirname, "index.html"),
					example: resolve(__dirname, "example.html"),
					library: resolve(__dirname, "library.html"),
				},
				output: {
					manualChunks: {
						react: ["react", "react-dom", "react-router-dom"],
						mantine: [
							"@mantine/core",
							"@mantine/hooks",
							"@mantine/notifications",
						],
						mantineCharts: ["@mantine/charts"],
						shapediver: [
							"@shapediver/sdk.geometry-api-sdk-v2",
							"@shapediver/sdk.platform-api-sdk-v1",
						],
						shapediverViewer: [
							"@shapediver/viewer.session",
							"@shapediver/viewer.viewport",
						],
						shapediverViewerMisc: [
							"@shapediver/viewer.utils.mime-type",
							"@shapediver/viewer.features.attribute-visualization",
							"@shapediver/viewer.features.drawing-tools",
							"@shapediver/viewer.features.interaction",
							"@shapediver/viewer.features.transformation-tools",
						],
						stargate: ["@shapediver/sdk.stargate-sdk-v1"],
						utils: ["immer", "zustand", "zod", "uuid", "gl-matrix"],
						markdown: [
							"react-markdown",
							"remark-directive",
							"remark-gfm",
							"unist-util-visit",
						],
						agent: ["openai", "langfuse"],
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
