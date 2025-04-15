import {sentryVitePlugin} from "@sentry/vite-plugin";
import react from "@vitejs/plugin-react";
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

// https://vitejs.dev/config/
export default defineConfig({
	plugins,
	server: {
		open: true,
		port: 3000,
	},
	optimizeDeps: {
		include: ["@tabler/icons-react", "@mantine"],
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
						"@shapediver/api.geometry-api-dto-v2",
						"@shapediver/sdk.geometry-api-sdk-v2",
						"@shapediver/sdk.platform-api-sdk-v1",
					],
					shapediverViewer: [
						"@shapediver/viewer.session",
						"@shapediver/viewer.viewport",
					],
					shapediverViewerMisc: [
						"@shapediver/viewer.utils.mime-type",
						"@shapediver/viewer.features.drawing-tools",
						"@shapediver/viewer.features.gumball",
						"@shapediver/viewer.features.interaction",
					],
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
	resolve: {
		alias: {
			"@AppBuilderShared": path.resolve(__dirname, "./src/shared"),
			"~": path.resolve(__dirname, "./src"),
		},
	},
});
