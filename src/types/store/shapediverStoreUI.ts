import { IExportApi } from "@shapediver/viewer";
import { ISdReactParameter } from "../shapediver/parameter";

/**
 * An object of parameters keyed by parameter id.
 */
export type IParameters = { [parameterId: string]: ISdReactParameter<any> };

/**
 * Objects of parameters grouped by session id.
 */
export type IParametersPerSession = { [sessionId: string]: IParameters };

/**
 * TODO to be refactored like parameters, remove dependency on viewer
 */
export type IExports = { [sessionId: string]: { [exportId: string]: IExportApi } };

/**
 * Interface for the store of UI-related data.
 */
export interface IShapediverStoreUI {
	/**
	 * Parameters grouped by session id.
	 * TODO this is work in progress, it doesn't make sense like this in the longer run for the UI.
	 */
	parameters: IParametersPerSession;

	/**
	 * Add a session to the UI state.
	 * @param sessionId 
	 * @param parameters 
	 * @returns 
	 */
	addSession: (sessionId: string, parameters: IParameters) => void,

	/**
	 * Remove a session from the UI state.
	 * @param sessionId 
	 * @param parameters 
	 * @returns 
	 */
	removeSession: (sessionId: string) => void,

	/**
	 * TODO to be refactored
	 */
	exports: IExports;

	/**
	 * TODO to be refactored
	 * @param sessionId 
	 * @param exportId 
	 * @returns 
	 */
	exportRequest: (sessionId: string, exportId: string) => Promise<void>;
}
