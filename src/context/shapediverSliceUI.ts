import { ShapediverSliceUIState } from "types/context/shapediverSliceUI";
import { EXPORT_TYPE } from "@shapediver/viewer";
import { fetchFileWithToken } from "utils/file";
import { StateCreator } from "zustand/esm";
import { ShapediverSliceViewerState } from "../types/context/shapediverSliceViewer";
import { IExports, IParameters } from "../types/context/shapediverStoreCommon";


type IState = ShapediverSliceUIState & Partial<ShapediverSliceViewerState>;
/**
 * State store for all created viewports and sessions.
 */
export const createShapediverSliceUI: StateCreator<IState, [], []> = (set, get): IState => ({
	parameters: {},
	parameterPropertyChange: (sessionId, parameterId, property, value) => {
		set((state) => {
			const session = (state.activeSessions || {})[sessionId];
			const parameter = state.parameters[sessionId][parameterId];
			const newState = {...state};

			if (session && parameter) {
				parameter[property] = value;
				newState.parameters[sessionId][parameterId][property] = value;
				session.customize();
			}

			return newState;
		});
	},
	exports: {},
	exportRequest: async (sessionId, exportId) => {
		const state = get();
		const session = (state.activeSessions || {})[sessionId];
		const exp = state.exports[sessionId][exportId];

		if (!session || !exp) return;

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
});

export const shapediverSliceUIMiddleware = (state: Partial<ShapediverSliceViewerState & ShapediverSliceUIState>) => {
	const parameters: IParameters = {};
	const exports: IExports = {};

	for (const sessionId in state.activeSessions) {
		if (Object.hasOwnProperty.call(state.activeSessions, sessionId)) {
			// Parse parameters of sessions
			parameters[sessionId] = state.activeSessions[sessionId]?.parameters || {};
			// Parse exports of sessions
			exports[sessionId] = state.activeSessions[sessionId]?.exports || {};
		}
	}

	return {
		parameters,
		exports,
	};
};
