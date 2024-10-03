import { sentryVitePlugin } from "@sentry/vite-plugin";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import viteTsconfigPaths from "vite-tsconfig-paths";
import svgrPlugin from "vite-plugin-svgr";
import { resolve } from "path";
import { CONFIG } from "./sentryconfig";

const plugins = [react(), viteTsconfigPaths(), svgrPlugin()];
if (CONFIG.SENTRY_ORG && CONFIG.SENTRY_PROJECT) {
	plugins.push(sentryVitePlugin({
		org: CONFIG.SENTRY_ORG,
		project: CONFIG.SENTRY_PROJECT
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
		minify: "terser",
		terserOptions: {
			compress: {
				// Aggressive compression options
				passes: 3,                 // Number of passes to compress the code
				drop_debugger: true,       // Remove debugger statements
				hoist_funs: true,          // Hoist function declarations
				hoist_vars: true,          // Hoist variable declarations
				reduce_funcs: true,        // Inline functions when beneficial
				reduce_vars: true,         // Inline variables when beneficial
				sequences: true,           // Combine consecutive statements using the comma operator
				toplevel: true,            // Optimize top-level variable and function scopes
				unsafe: true,              // Enable optimizations that are unsafe for certain code patterns
				unsafe_comps: true,        // Optimizations for comparison operators
				unsafe_math: true,         // Optimizations for math functions
				unsafe_arrows: true,       // Convert functions to arrow functions
				unsafe_proto: true,        // Optimize object prototypes
				unsafe_undefined: true,    // Substitute `undefined` with void 0
			},
			mangle: {
				toplevel: true,             // Mangle top-level function and variable names
				safari10: true,             // For Safari 10 compatibility
				properties: {
					regex: /./,               // Mangle all property names (aggressive)
					reserved: [],             // No reserved properties; mangle everything
				},
			},
			output: {
				comments: false,           // Remove comments
				beautify: false            // Do not beautify the output
			},
			safari10: true,              // Support for Safari 10
			module: true,                // Optimize for ES6 modules
			keep_classnames: false,      // Drop class names
			keep_fnames: false           // Drop function names
		},
		rollupOptions: {
			input: {
				appbuilder: resolve(__dirname, "index.html"),
				example: resolve(__dirname, "example.html"),
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
						"@shapediver/viewer",
					],
					shapediverViewerMisc: [
						"@shapediver/viewer.utils.mime-type",
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
					icons: ["@tabler/icons-react"],
				}
			}
		},
		sourcemap: true
	},
});
