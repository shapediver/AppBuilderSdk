import { IExportApi } from "@shapediver/viewer";
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
 * TODO SS-7076 use this
 */
export type IExports = { [exportId: string]: ISdReactExport };

/**
 * An object of exports keyed by export id.
 * TODO SS-7076 use this
 */
export type IExportsPerSession = { [sessionId: string]: IExports };

/**
 * TODO to be refactored like parameters, remove dependency on viewer
 */
export type IExportsLegacy = { [sessionId: string]: { [exportId: string]: IExportApi } };

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
	 * TODO SS-7076 extend this by a further parameter "exports: IExports"
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
	 * TODO SS-7076 to be refactored, use IExportsPerSession instead of IExportsLegacy
	 */
	exports: IExportsLegacy;

	/**
	 * TODO SS-7076 to be dropped
	 * @param sessionId
	 * @param exportId
	 * @returns
	 */
	exportRequest: (sessionId: string, exportId: string) => Promise<void>;
}
