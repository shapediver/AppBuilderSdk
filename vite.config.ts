import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import viteTsconfigPaths from "vite-tsconfig-paths";
import svgrPlugin from "vite-plugin-svgr";
import { resolve } from "path";

// https://vitejs.dev/config/
export default defineConfig({
	plugins: [react(), viteTsconfigPaths(), svgrPlugin()],
	server: {
		open: true,
		port: 3000,
	},
	build: {
		rollupOptions: {
			input: {
				appbuilder: resolve(__dirname, "index.html"),
				example: resolve(__dirname, "example.html"),
			},
		},
	},
});
