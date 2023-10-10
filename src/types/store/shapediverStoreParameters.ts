import { ISessionApi } from "@shapediver/viewer";
import { ISdReactParamOrExport } from "types/shapediver/common";
import { StoreApi, UseBoundStore } from "zustand";

export type IParameterStore = UseBoundStore<StoreApi<ISdReactParamOrExport>>;

export type IParameterStores = { [parameterId: string]: IParameterStore }

export type IParameterStoresPerSession = { [sessionId: string]: IParameterStores };

export type IExportStore = UseBoundStore<StoreApi<ISdReactParamOrExport>>;

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
	 * Add parameter stores for all parameters of the session.
	 * @param session
	 * @returns
	 */
	addSession: (session: ISessionApi) => void,

	/**
	 * Remove parameter stores for all parameters of the session.
	 * @param sessionId
	 * @param parameters
	 * @returns
	 */
	removeSession: (sessionId: string) => void,

	/**
	 * Get abstracted parameters for session.
	 * @param sessionId
	 * @returns
	 */
	useParameter: (sessionId: string, paramId: string) => IParameterStore;
}
