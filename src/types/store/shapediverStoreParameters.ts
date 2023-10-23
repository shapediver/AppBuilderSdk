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
 * Pending parameter changes (waiting to be executed).
 */
export interface IParameterChanges {
	/** The parameter values to change */
	values: { [parameterId: string]: any };
	/** Promise to wait for */
	wait: Promise<void>;
	/** Accept the changes, this resolves wait */
	accept: () => void;
	/** Reject the changes, this rejects wait */
	reject: () => void;
}

export interface IParameterChangesPerSession { [sessionId: string]: IParameterChanges}

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
	 * Pending parameter changes.
	 */
	parameterChanges: IParameterChangesPerSession;

	/**
	 * Add parameter and export stores for all parameters and exports of the session.
	 * @param session
	 * @param immediate If true, execute parameter changes immediately.
	 * @returns
	 */
	addSession: (session: ISessionApi, immediate: boolean) => void,

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

	/**
	 * Get or add pending parameter changes for a given session id.
	 * @param session 
	 * @returns 
	 */
	getChanges: (session: ISessionApi) => IParameterChanges,

	/**
	 * Remove pending parameter changes for a given session id.
	 * @param sessionId 
	 * @returns 
	 */
	removeChanges: (sessionId: string) => void,
}
