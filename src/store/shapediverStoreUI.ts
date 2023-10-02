import { ShapediverStoreUIState } from "types/store/shapediverStoreUI";
import { EXPORT_TYPE } from "@shapediver/viewer";
import { fetchFileWithToken } from "utils/file";
import { create } from "zustand";

/**
 * State store for all created viewports and sessions.
 */
export const useShapediverStoreUI = create<ShapediverStoreUIState>((set, get) => ({
	parameters: {},
	parametersSessionSet: (sessionId, parametersSession) => {
		const parameters = get().parameters;
		parameters[sessionId] = parametersSession;

		set((state) => ({
			...state,
			parameters,
		}));
	},
	parametersSessionGet: (sessionId) => {
		return get().parameters[sessionId];
	},
	exports: {},
	exportRequest: async (sessionId, exportId) => {
		const state = get();
		const exp = state.exports[sessionId][exportId];

		if (!exp) return;

		// request the export
		const response = await exp.request();

		// if the export is a download export, download it
		if (exp.type === EXPORT_TYPE.DOWNLOAD) {
			if (
				response.content &&
				response.content[0] &&
				response.content[0].href
			) {
				await fetchFileWithToken(response.content[0].href, `${response.filename}.${response.content[0].format}`);
			}
		}
	}
}
));
