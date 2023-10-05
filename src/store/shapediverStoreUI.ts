import { IParameters, IShapediverStoreUI } from "types/store/shapediverStoreUI";
import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { devtoolsSettings } from "./storeSettings";

/**
 * Store of UI-related data.
 */
export const useShapediverStoreUI = create<IShapediverStoreUI>()(devtools((set, get) => ({

	parameters: {},

	addSession: (sessionId, parametersSession, exportsSession) => {
		const {parameters, exports } = get();
		parameters[sessionId] = parametersSession;
		exports[sessionId] = exportsSession;

		set(() => ({
			parameters,
			exports
		}), false, "addSession");
	},

	removeSession: (sessionId: string) => {
		const parametersPerSession = get().parameters;

		// create a new object, omitting the session which was closed
		const parameters : {[id: string]: IParameters} = {};
		Object.keys(parametersPerSession).forEach(id => {
			if (id !== sessionId)
				parameters[id] = parametersPerSession[id];
		});

		set((state) => ({
			...state,
			parameters,
		}), false, "removeSession");
	},

	exports: {},
}
), { ...devtoolsSettings, name: "ShapeDiver | UI" }));
