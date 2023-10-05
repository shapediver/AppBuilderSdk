import { ISdReactParameter } from "types/shapediver/parameter";
import { ISdReactExport } from "types/shapediver/export";

/**
 * An object of parameters keyed by parameter id.
 */
export type IParameters = { [parameterId: string]: ISdReactParameter<any> };

/**
 * Objects of parameters grouped by session id.
 */
export type IParametersPerSession = { [sessionId: string]: IParameters };

/**
 * An object of exports keyed by export id.
 */
export type IExports = { [exportId: string]: ISdReactExport };

/**
 * An object of exports keyed by export id.
 */
export type IExportsPerSession = { [sessionId: string]: IExports };

/**
 * Interface for the store of UI-related data.
 */
export interface IShapediverStoreUI {
	/**
	 * Parameters grouped by session id.
	 * Note: this is work in progress, it doesn't make sense like this in the longer run for the UI.
	 */
	parameters: IParametersPerSession;

	/**
	 * Add a session to the UI state.
	 * @param sessionId
	 * @param parameters
	 * @returns
	 */
	addSession: (sessionId: string, parameters: IParameters, exports: IExports) => void,

	/**
	 * Remove a session from the UI state.
	 * @param sessionId
	 * @param parameters
	 * @returns
	 */
	removeSession: (sessionId: string) => void,

	/**
	 * Exports grouped by session id.
	 * Note: this is work in progress, it doesn't make sense like this in the longer run for the UI.
	 */
	exports: IExportsPerSession;
}
