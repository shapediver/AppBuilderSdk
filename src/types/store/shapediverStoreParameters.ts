import { ISessionApi } from "@shapediver/viewer";
import { IShapeDiverExport } from "types/shapediver/export";
import { IShapeDiverParameter } from "types/shapediver/parameter";
import { StoreApi, UseBoundStore } from "zustand";

export type IParameterStore = UseBoundStore<StoreApi<IShapeDiverParameter<any>>>;

export type IParameterStores = { [parameterId: string]: IParameterStore }

export type IParameterStoresPerSession = { [sessionId: string]: IParameterStores };

export type IExportStore = UseBoundStore<StoreApi<IShapeDiverExport>>;

export type IExportStores = { [parameterId: string]: IExportStore }

export type IExportStoresPerSession = { [sessionId: string]: IExportStores };

/**
 * Interface for the store of parameters and exports. 
 * The parameters and exports managed by this store are abstractions of the 
 * parameters and exports defined by a ShapeDiver 3D Viewer session. 
 * It is easy to plug all parameters and exports defined by one or multiple sessions 
 * into this store. 
 * The abstraction provided by this store also allows to define parameters which
 * are not directly linked to a session. 
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
	 * Get all parameter stores for a given session id.
	 * @param sessionId
	 * @returns
	 */
	useParameters: (sessionId: string) => IParameterStores;

	/**
	 * Get a single parameter store.
	 * @param sessionId
	 * @returns
	 */
	useParameter: (sessionId: string, paramId: string) => IParameterStore;

	/**
	 * Get all export stores for a given session id.
	 * @param sessionId
	 * @returns
	 */
	useExports: (sessionId: string) => IExportStores;

	/**
	 * Get a single export store.
	 * @param sessionId
	 * @returns
	 */
	useExport: (sessionId: string, exportId: string) => IExportStore;
}
