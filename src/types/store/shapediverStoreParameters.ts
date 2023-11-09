import { ISessionApi } from "@shapediver/viewer";
import { IShapeDiverExport } from "types/shapediver/export";
import { IShapeDiverParameter, IShapeDiverParameterDefinition } from "types/shapediver/parameter";
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
	/** Promise allowing to wait for pending changes */
	wait: Promise<void>;
	/** Accept the changes, this resolves wait */
	accept: () => void;
	/** Reject the changes, this rejects wait */
	reject: () => void;
	/** True if the controls which allow the user to accept or reject the changes should be disabled */
	disableControls: boolean;
	/** True if changes are currently being executed */
	executing: boolean;
}

export interface IParameterChangesPerSession { [sessionId: string]: IParameterChanges}

/**
 * Definition of a generic parameter, which is not necessarily implemented by a parameter of a ShapeDiver model. 
 * @see {@link IGenericParameterExecutor}
 * @see {@link IShapeDiverStoreParameters}
 */
export interface IGenericParameterDefinition {

	/** The static definition of the parameter. */
	definition: IShapeDiverParameterDefinition,

	/**
     * Evaluates if a given value is valid for this parameter.
     *
     * @param value the value to evaluate
     * @param throwError if true, an error is thrown if validation does not pass (default: false)
     */
    isValid?: (value: any, throwError?: boolean) => boolean;
}

/**
 * Executor function for generic parameters. 
 * @see {@link IGenericParameterDefinition}
 */
export type IGenericParameterExecutor = (values: { [key: string]: any }, sessionId: string) => Promise<unknown|void>;

/**
 * Selector for deciding whether a parameter should use accept/reject mode or immediate execution.
 */
export type IAcceptRejectModeSelector = (param: IShapeDiverParameterDefinition) => boolean;

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
	 * @param acceptRejectMode If true, changes are not executed immediately. May be specified as a boolean or a function of the parameter definition.
	 * @returns
	 */
	addSession: (session: ISessionApi, acceptRejectMode: boolean | IAcceptRejectModeSelector) => void,

	/**
	 * Add generic parameters. 
	 * @param sessionId The namespace to use.
	 * @param acceptRejectMode If true, changes are not executed immediately. May be specified as a boolean or a function of the parameter definition.
	 * @param definitions Definitions of the parameters.
	 * @param executor Executor of parameter changes.
	 * @returns 
	 */
	addGeneric: (
		sessionId: string, 
		acceptRejectMode: boolean | IAcceptRejectModeSelector, 
		definitions: IGenericParameterDefinition | IGenericParameterDefinition[], 
		executor: IGenericParameterExecutor
	) => void,

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
	getParameters: (sessionId: string) => IParameterStores;

	/**
	 * Get a single parameter store by parameter id or name.
	 * @param sessionId
	 * @param paramId
	 * @returns
	 */
	getParameter: (sessionId: string, paramId: string) => IParameterStore | undefined;

	/**
	 * Get all export stores for a given session id.
	 * @param sessionId
	 * @returns
	 */
	getExports: (sessionId: string) => IExportStores;

	/**
	 * Get a single export store by export id or name.
	 * @param sessionId
	 * @param exportId
	 * @returns
	 */
	getExport: (sessionId: string, exportId: string) => IExportStore | undefined;

	/**
	 * Get or add pending parameter changes for a given session id.
	 * @param sessionId 
	 * @param executor 
	 * @param disableControls if true, disable the controls which allow the user to accept or reject parameter changes
	 * @returns 
	 */
	getChanges: (sessionId: string, executor: IGenericParameterExecutor, disableControls: boolean) => IParameterChanges,

	/**
	 * Remove pending parameter changes for a given session id.
	 * @param sessionId 
	 * @returns 
	 */
	removeChanges: (sessionId: string) => void,
}
