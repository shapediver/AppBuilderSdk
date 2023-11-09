import { create } from "zustand";
import { IShapeDiverParameter, IShapeDiverParameterExecutor, IShapeDiverParameterState } from "types/shapediver/parameter";
import { ISessionApi } from "@shapediver/viewer";
import { devtools } from "zustand/middleware";
import { devtoolsSettings } from "store/storeSettings";
import {
	IAcceptRejectModeSelector,
	IExportStore,
	IExportStores, IExportStoresPerSession,
	IGenericParameterDefinition,
	IGenericParameterExecutor,
	IParameterChanges,
	IParameterChangesPerSession,
	IParameterStore,
	IParameterStores,
	IParameterStoresPerSession,
	IShapeDiverStoreParameters
} from "types/store/shapediverStoreParameters";
import { IShapeDiverExport } from "types/shapediver/export";

function createParameterExecutor<T>(sessionId: string, param: IGenericParameterDefinition, immediate: boolean, getChanges: () => IParameterChanges): IShapeDiverParameterExecutor<T> {
	const paramId = param.definition.id;
	
	return {
		execute: async (uiValue: T | string, execValue: T | string, forceImmediate?: boolean) => {
			const changes = getChanges();

			// check whether there is anything to do
			if (paramId in changes.values && uiValue === execValue) {
				console.log(`Removing change of parameter ${paramId}`);
				delete changes.values[paramId];
				// check if there are any other parameter updates queued
				if (Object.keys(changes.values).length === 0) {
					changes.reject();
				}

				return execValue;
			}
			
			// execute the change
			try {
				console.debug(`Queueing change of parameter ${paramId} to ${uiValue}`);
				changes.values[paramId] = uiValue;
				if (immediate || forceImmediate)
					setTimeout(changes.accept, 0);
				await changes.wait;
				console.debug(`Executed change of parameter ${paramId} to ${uiValue}`);
				
				return uiValue;
			}
			catch // TODO provide possibility to react to exception
			{
				console.debug(`Rejecting change of parameter ${paramId} to ${uiValue}, resetting to ${execValue}`);
				
				return execValue;
			}
		},
		isValid: (uiValue: T | string, throwError?: boolean) => param.isValid ? param.isValid(uiValue, throwError) : true,
		definition: param.definition
	};
}

function createGenericParameterExecutorForSession(session: ISessionApi) : IGenericParameterExecutor { 
	
	return (values) => {

		// store previous values (we restore them in case of error)
		const previousValues = Object.keys(values).reduce((acc, paramId) => {
			acc[paramId] = session.parameters[paramId].value;
			
			return acc;
		}, {} as { [paramId: string]: unknown});
		try {
			// set values and call customize
			Object.keys(values).forEach(id => session.parameters[id].value = values[id]);

			return session.customize();
		} 
		catch (e: any)
		{
			// in case of an error, restore the previous values
			Object.keys(previousValues).forEach(id => session.parameters[id].value = previousValues[id]);
			throw e;
		}
	};
}


/**
 * Create store for a single parameter.
 */
function createParameterStore<T>(executor: IShapeDiverParameterExecutor<T>, acceptRejectMode: boolean) {
	const definition = executor.definition;

	/** The static definition of a parameter. */
	const state: IShapeDiverParameterState<T> = {
		uiValue: definition.defval,
		execValue: definition.defval,
		dirty: false
	};

	return create<IShapeDiverParameter<T>>()(devtools((set, get) => ({
		definition,
		acceptRejectMode,
		/**
		 * The dynamic properties (aka the "state") of a parameter.
		 * Reactive components can react to this state, but not update it.
		 */
		state,
		/** Actions that can be taken on the parameter. */
		actions: {
			setUiValue: function (uiValue: string | T): boolean {
				const actions = get().actions;
				if (!actions.isValid(uiValue, false)) return false;
				set((_state) => ({
					state: {
						..._state.state,
						uiValue,
						dirty: uiValue !== _state.state.execValue
					}
				}), false, "setUiValue");

				return true;
			},
			execute: async function (forceImmediate?: boolean): Promise<T | string> {
				const state = get().state;
				const result = await executor.execute(state.uiValue, state.execValue, forceImmediate);
				// TODO in case result is not the current uiValue, we could somehow visualize
				// the fact that the uiValue gets reset here
				set((_state) => ({
					state: {
						..._state.state,
						uiValue: result,
						execValue: result,
						dirty: false
					}
				}), false, "execute");
		
				return result;
			},
			isValid: function (value: any, throwError?: boolean | undefined): boolean {
				return executor.isValid(value, throwError);
			},
			resetToDefaultValue: function (): void {
				const definition = get().definition;
				set((_state) => ({
					state: {
						..._state.state,
						uiValue: definition.defval,
						dirty: definition.defval !== _state.state.execValue
					}
				}), false, "resetToDefaultValue");
			},
			resetToExecValue: function (): void {
				const state = get().state;
				set((_state) => ({
					state: {
						..._state.state,
						uiValue: state.execValue,
						dirty: false
					}
				}), false, "resetToExecValue");
			},
		}
	}
	), { ...devtoolsSettings, name: `ShapeDiver | Parameter | ${definition.id}` }));
}

/**
 * Create store for a single export.
 */
function createExportStore(session: ISessionApi, exportId: string) {
	const exportApi = session.exports[exportId];
	/** The static definition of the export. */
	const definition = exportApi;
	const sessionExport = exportApi;

	return create<IShapeDiverExport>(() => ({
		definition,
		/** Actions that can be taken on the export. */
		actions: {
			request: async (parameters?: { [key: string]: string }) => {
				return sessionExport.request(parameters);
			}
		}
	}));
}

/**
 * Store data related to abstracted parameters and exports.
 * @see {@link IShapeDiverStoreParameters}
 */
export const useShapeDiverStoreParameters = create<IShapeDiverStoreParameters>()(devtools((set, get) => ({

	parameterStores: {},
	exportStores: {},
	parameterChanges: {},

	removeChanges: (sessionId: string) => {
		const { parameterChanges } = get();

		// create a new object, omitting the session to be removed
		const changes: IParameterChangesPerSession = {};
		Object.keys(parameterChanges).forEach(id => {
			if (id !== sessionId)
				changes[id] = parameterChanges[id];
		});
		
		set(() => ({
			parameterChanges: changes,
		}), false, "removeChanges");
	},

	getChanges: (sessionId: string, executor: IGenericParameterExecutor, disableControls: boolean) : IParameterChanges => {
		const { parameterChanges, removeChanges } = get();
		if ( parameterChanges[sessionId] )
			return parameterChanges[sessionId];

		const changes: IParameterChanges = {
			values: {},
			accept: () => undefined,
			reject: () => undefined,
			wait: Promise.resolve(),
			disableControls,
			executing: false,
		};
	
		changes.wait = new Promise((resolve, reject) => {
			changes.accept = async () => {
				try {
					// get executor promise, but don't wait for it yet
					const promise = executor(changes.values, sessionId);
					// set "executing" mode
					set((_state) => ({
						parameterChanges: {
							..._state.parameterChanges,
							...{ [sessionId]: {
								..._state.parameterChanges[sessionId],
								executing: true
							} }
						}
					}), false, "executeChanges");
					// wait for execution
					await promise;
					resolve();
				} 
				catch (e: any)
				{
					reject(e);
				}
				finally 
				{
					removeChanges(sessionId);
				}
			};
			changes.reject = () => {
				removeChanges(sessionId);
				reject();
			};

			set((_state) => ({
				parameterChanges: {
					..._state.parameterChanges,
					...{ [sessionId]: changes }
				}
			}), false, "getChanges");
		});

		return changes;
	},

	addSession: (session: ISessionApi, _acceptRejectMode: boolean | IAcceptRejectModeSelector) => {
		const sessionId = session.id;
		const { parameterStores: parameters, exportStores: exports, getChanges } = get();
		const executor = createGenericParameterExecutorForSession(session);
		const acceptRejectModeSelector = typeof(_acceptRejectMode) === "boolean" ? () => _acceptRejectMode : _acceptRejectMode;

		set((_state) => ({
			parameterStores: {
				..._state.parameterStores,
				...parameters[sessionId]
					? {} // Keep existing parameter stores
					: {	[sessionId]: Object.keys(session.parameters).reduce((acc, paramId) => {
						const param = session.parameters[paramId];
						const acceptRejectMode = acceptRejectModeSelector(param);
						acc[paramId] = createParameterStore(createParameterExecutor(sessionId, 
							{ definition: param, isValid: (value, throwError) => param.isValid(value, throwError) }, 
							!acceptRejectMode, 
							() => getChanges(sessionId, executor, !acceptRejectMode)
						), acceptRejectMode);

						return acc;
					}, {} as IParameterStores) } // Create new parameter stores
			},
			exportStores: {
				..._state.exportStores,
				...exports[sessionId]
					? {} // Keep existing export stores
					: { [sessionId]: Object.keys(session.exports).reduce((acc, exportId) => {
						acc[exportId] = createExportStore(session, exportId);

						return acc;
					}, {} as IExportStores) } // Create new export stores
			}
		}), false, "addSession");
	},

	addGeneric: (sessionId: string, _acceptRejectMode: boolean | IAcceptRejectModeSelector, definitions: IGenericParameterDefinition | IGenericParameterDefinition[], executor: IGenericParameterExecutor) => {
		const { parameterStores: parameters, getChanges } = get();
		const acceptRejectModeSelector = typeof(_acceptRejectMode) === "boolean" ? () => _acceptRejectMode : _acceptRejectMode;

		set((_state) => ({
			parameterStores: {
				..._state.parameterStores,
				...parameters[sessionId]
					? {} // Keep existing parameter stores
					: {	[sessionId]: (Array.isArray(definitions) ? definitions : [definitions]).reduce((acc, def) => {
						const paramId = def.definition.id;
						const acceptRejectMode = acceptRejectModeSelector(def.definition);
						acc[paramId] = createParameterStore(createParameterExecutor(sessionId, def, !acceptRejectMode, 
							() => getChanges(sessionId, executor, !acceptRejectMode)
						), acceptRejectMode);

						return acc;
					}, {} as IParameterStores) } // Create new parameter stores
			}
		}), false, "addGeneric");
	},

	removeSession: (sessionId: string) => {
		const {parameterStores: parametersPerSession, exportStores: exportsPerSession } = get();

		// create a new object, omitting the session to be removed
		const parameters: IParameterStoresPerSession = {};
		Object.keys(parametersPerSession).forEach(id => {
			if (id !== sessionId)
				parameters[id] = parametersPerSession[id];
		});

		// create a new object, omitting the session to be removed
		const exports: IExportStoresPerSession = {};
		Object.keys(exportsPerSession).forEach(id => {
			if (id !== sessionId)
				exports[id] = exportsPerSession[id];
		});

		set(() => ({
			parameterStores: parameters,
			exportStores: exports,
		}), false, "removeSession");
	},
	
	getParameters: (sessionId: string) => {
		return get().parameterStores[sessionId] || {};
	},

	getParameter: (sessionId: string, paramId: string) => {
		return Object.values(get().getParameters(sessionId)).find(p => {
			const def = p.getState().definition;

			return def.id === paramId || def.name === paramId || def.displayname === paramId;
		}) as IParameterStore;
	},

	getExports: (sessionId: string) => {
		return get().exportStores[sessionId] || {};
	},

	getExport: (sessionId: string, exportId: string) => {
		return Object.values(get().getExports(sessionId)).find(p => {
			const def = p.getState().definition;

			return def.id === exportId || def.name === exportId || def.displayname === exportId;
		}) as IExportStore;
	},

}
), { ...devtoolsSettings, name: "ShapeDiver | Parameters" }));
