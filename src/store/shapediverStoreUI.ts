import { IExports, IParameters, IShapediverStoreUI } from "types/store/shapediverStoreUI";
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

		set(() => ({
			parameters: {
				...parameters,
				...{[sessionId]: parametersSession}
			},
			exports: {
				...exports,
				...{[sessionId]: exportsSession}
			}
		}), false, "addSession");
	},

	removeSession: (sessionId: string) => {
		const parametersPerSession = get().parameters;
		const exportsPerSession = get().exports;

		// create a new object, omitting the session which was closed
		const parameters : {[id: string]: IParameters} = {};
		Object.keys(parametersPerSession).forEach(id => {
			if (id !== sessionId)
				parameters[id] = parametersPerSession[id];
		});

		const exports : {[id: string]: IExports} = {};
		Object.keys(exportsPerSession).forEach(id => {
			if (id !== sessionId)
				exports[id] = exportsPerSession[id];
		});

		set((state) => ({
			...state,
			parameters,
			exports,
		}), false, "removeSession");
	},

	exports: {},
}
), { ...devtoolsSettings, name: "ShapeDiver | UI" }));
