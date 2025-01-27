import { sentryVitePlugin } from "@sentry/vite-plugin";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import viteTsconfigPaths from "vite-tsconfig-paths";
import svgrPlugin from "vite-plugin-svgr";
import { resolve } from "path";
import { CONFIG } from "./sentryconfig";
import path from "path";

const plugins = [react(), viteTsconfigPaths(), svgrPlugin()];
if (CONFIG.SENTRY_ORG && CONFIG.SENTRY_PROJECT) {
	plugins.push(sentryVitePlugin({
		org: CONFIG.SENTRY_ORG,
		project: CONFIG.SENTRY_PROJECT,
		authToken: process.env.SENTRY_AUTH_TOKEN,
	}));
}

// https://vitejs.dev/config/
export default defineConfig({
	plugins,
	server: {
		open: true,
		port: 3000,
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
					mantineCharts: [
						"@mantine/charts",
					],
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
						"@shapediver/viewer.features.interaction"
					],
					utils: ["immer", "zustand", "zod", "uuid", "gl-matrix"],
					markdown: [
						"react-markdown",
						"remark-directive",
						"remark-gfm",
						"unist-util-visit",
					],
					agent: ["openai", "langfuse"],
					icons: ["@tabler/icons-react"],
				}
			}
		},
		sourcemap: true
	},
	resolve: {
		alias: {
			"@AppBuilderShared": path.resolve(__dirname, "./src/shared"),
			"~": path.resolve(__dirname, "./src"),
		},
	},
});
