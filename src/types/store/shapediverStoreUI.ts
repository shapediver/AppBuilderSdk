import { IExportApi } from "@shapediver/viewer";
import { ISdReactParameter } from "../shapediver/shapediverUi";

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
	 * Add a group of parameters, grouped by session.
	 * @param sessionId 
	 * @param parameters 
	 * @returns 
	 */
	parametersSessionSet: (sessionId: string, parameters: IParameters) => void,

	/**
	 * Remove a group of parameters, grouped by session.
	 * @param sessionId 
	 * @param parameters 
	 * @returns 
	 */
	parametersSessionRemove: (sessionId: string) => void,

	/**
	 * Get a group of parameters by session.
	 * @param sessionId 
	 * @returns 
	 */
	parametersSessionGet: (sessionId: string) => IParameters,

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
