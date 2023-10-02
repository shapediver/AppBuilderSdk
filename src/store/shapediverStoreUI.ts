import { IShapediverStoreUI } from "types/store/shapediverStoreUI";
import { EXPORT_TYPE } from "@shapediver/viewer";
import { fetchFileWithToken } from "utils/file";
import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { devtoolsSettings } from "./storeSettings";

/**
 * Store of UI-related data.
 */
export const useShapediverStoreUI = create<IShapediverStoreUI>()(devtools((set, get) => ({
	
	parameters: {},
	
	parametersSessionSet: (sessionId, parametersSession) => {
		const parameters = get().parameters;
		parameters[sessionId] = parametersSession;

		set((state) => ({
			...state,
			parameters,
		}), false, "parametersSessionSet");
	},

	parametersSessionRemove: (sessionId: string) => {
		const parameters = get().parameters;
		delete parameters[sessionId];

		set((state) => ({
			...state,
			parameters,
		}), false, "parametersSessionRemove");
	},

	parametersSessionGet: (sessionId) => {
		return get().parameters[sessionId];
	},

	exports: {},

	/**
	 * TODO to be refactored
	 */
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
), { ...devtoolsSettings, name: "ShapeDiver | UI" }));
