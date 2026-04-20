import path from "path";
import {fileURLToPath} from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Example configuration for linking @shapediver/viewer.* packages to a local
 * Viewer source checkout, enabling live debugging across both repos.
 *
 * Usage:
 *   1. Copy this file to viewer.local.ts (which is gitignored)
 *   2. Adjust the paths below if your Viewer checkout is in a different location
 *   3. Run `npm start` — Vite will resolve viewer packages from local source
 *
 * Changes to Viewer source will hot-reload in the dev server automatically.
 * To deactivate, delete viewer.local.ts.
 */
export default {
	"@shapediver/viewer.features.attribute-visualization": path.resolve(
		__dirname,
		"../Viewer/features/attribute-visualization/src/index.ts",
	),
	"@shapediver/viewer.features.drawing-tools": path.resolve(
		__dirname,
		"../Viewer/features/drawing-tools/src/index.ts",
	),
	"@shapediver/viewer.features.interaction": path.resolve(
		__dirname,
		"../Viewer/features/interaction/src/index.ts",
	),
	"@shapediver/viewer.features.transformation-tools": path.resolve(
		__dirname,
		"../Viewer/features/transformation-tools/src/index.ts",
	),
	"@shapediver/viewer.session": path.resolve(
		__dirname,
		"../Viewer/api/session/src/index.ts",
	),
	"@shapediver/viewer.viewport": path.resolve(
		__dirname,
		"../Viewer/api/viewport/src/index.ts",
	),
	"@shapediver/viewer.shared.global-access-objects": path.resolve(
		__dirname,
		"../Viewer/shared/global-access-objects/src/index.ts",
	),
	"@shapediver/viewer.shared.types": path.resolve(
		__dirname,
		"../Viewer/shared/types/src/index.ts",
	),
} satisfies Record<string, string>;
