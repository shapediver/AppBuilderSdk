import { ISdReactParamOrExport } from "types/shapediver/common";

/**
 * An object of parameters keyed by parameter id.
 * TODO SS-7087 refactor this to be an array of parameter ids
 * IParameters = Array<string>
 */
export type IParameters = { [parameterId: string]: ISdReactParamOrExport };

/**
 * Objects of parameters grouped by session id.
 */
export type IParametersPerSession = { [sessionId: string]: IParameters };

/**
 * An object of exports keyed by export id.
 * TODO SS-7087 refactor this to be an array of export ids
 * IExports = Array<string>
 */
export type IExports = { [exportId: string]: ISdReactParamOrExport };

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
