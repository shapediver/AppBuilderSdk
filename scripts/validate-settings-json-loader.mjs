import {dirname, join} from "node:path";
import {fileURLToPath, pathToFileURL} from "node:url";

const viewerSessionMock = pathToFileURL(
	join(dirname(fileURLToPath(import.meta.url)), "viewer-mocks.ts"),
).href;

const stubs = new Set([
	"@shapediver/viewer.session",
	"@shapediver/viewer.shared.types",
]);

export async function resolve(specifier, context, nextResolve) {
	if (stubs.has(specifier)) {
		return {url: viewerSessionMock, shortCircuit: true};
	}
	return nextResolve(specifier, context);
}
