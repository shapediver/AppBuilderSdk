import { ISessionApi } from "@shapediver/viewer";
import { ISdReactExport } from "types/shapediver/export";
import { ISdReactParameter } from "types/shapediver/parameter";
import { StoreApi, UseBoundStore } from "zustand";

export type IParameterStore = UseBoundStore<StoreApi<ISdReactParameter<any>>>;

export type IParameterStores = { [parameterId: string]: IParameterStore }

export type IParameterStoresPerSession = { [sessionId: string]: IParameterStores };

export type IExportStore = UseBoundStore<StoreApi<ISdReactExport>>;

export type IExportStores = { [parameterId: string]: IExportStore }

export type IExportStoresPerSession = { [sessionId: string]: IExportStores };

/**
 * Interface for the store of parameter stores.
 */
export interface IShapeDiverStoreParameters {
	/**
	 * Parameter stores.
	 */
	parameterStores: IParameterStoresPerSession;

	/**
	 * Export stores.
	 */
	exportStores: IExportStoresPerSession;

	/**
	 * Add parameter and export stores for all parameters and exports of the session.
	 * @param session
	 * @returns
	 */
	addSession: (session: ISessionApi) => void,

	/**
	 * Remove parameter and exports stores for all parameters and exports of the session.
	 * @param sessionId
	 * @param parameters
	 * @returns
	 */
	removeSession: (sessionId: string) => void,

	/**
	 * Get all parameters of session.
	 * @param sessionId
	 * @returns
	 */
	useParameters: (sessionId: string) => IParameterStores;

	/**
	 * Get single parameter.
	 * @param sessionId
	 * @returns
	 */
	useParameter: (sessionId: string, paramId: string) => IParameterStore;

	/**
	 * Get all exports of session.
	 * @param sessionId
	 * @returns
	 */
	useExports: (sessionId: string) => IExportStores;

	/**
	 * Get single export.
	 * @param sessionId
	 * @returns
	 */
	useExport: (sessionId: string, exportId: string) => IExportStore;
}
