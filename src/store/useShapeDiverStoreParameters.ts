import { create } from "zustand";
import { IShapeDiverParameter, IShapeDiverParameterExecutor, IShapeDiverParameterState } from "types/shapediver/parameter";
import { IParameterApi, ISessionApi } from "@shapediver/viewer";
import { devtools } from "zustand/middleware";
import { devtoolsSettings } from "store/storeSettings";
import {
	IExportStores, IExportStoresPerSession,
	IParameterStores,
	IParameterStoresPerSession,
	IShapeDiverStoreParameters
} from "types/store/shapediverStoreParameters";
import { IShapeDiverExport } from "types/shapediver/export";

function createDefaultParameterExecutor<T>(session: ISessionApi, paramId: string): IShapeDiverParameterExecutor<T> {
	const param = session.parameters[paramId] as IParameterApi<T>;
	
	return {
		execute: async (uiValue: T | string, execValue: T | string) => {
			try {
				param.value = uiValue;
				await session.customize();
				
				return true;
			}
			catch // TODO provide possibility to react to exception
			{
				param.value = execValue;
				
				return false;
			}
		},
		isValid: (uiValue: T | string, throwError?: boolean) => param.isValid(uiValue, throwError),
		definition: param
	};
}

/**
 * Create store for a single parameter.
 */
function createParameterStore<T>(executor: IShapeDiverParameterExecutor<T>) {
	const definition = executor.definition;

	/** The static definition of a parameter. */
	const state: IShapeDiverParameterState<T> = {
		uiValue: definition.defval,
		execValue: definition.defval,
		dirty: false
	};

	return create<IShapeDiverParameter<T>>((set, get) => ({
		definition,
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
				}));

				return true;
			},
			execute: async function (): Promise<boolean> {
				const state = get().state;
				const result = await executor.execute(state.uiValue, state.execValue);
				if (result)
					set((_state) => ({
						state: {
							..._state.state,
							execValue: state.uiValue,
							dirty: false
						}
					}));
				else
					set((_state) => ({
						state: {
							..._state.state,
							uiValue: state.execValue,
							dirty: false
						}
					}));

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
				}));
			},
			resetToExecValue: function (): void {
				const state = get().state;
				set((_state) => ({
					state: {
						..._state.state,
						uiValue: state.execValue,
						dirty: false
					}
				}));
			},
		}
	}));
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

	addSession: (session: ISessionApi) => {
		const sessionId = session.id;
		const { parameterStores: parameters, exportStores: exports} = get();

		set((_state) => ({
			parameterStores:  {
				..._state.parameterStores,
				...parameters[sessionId]
					? {} // Keep existing parameter stores
					: {
						..._state.parameterStores,
						[sessionId]: Object.keys(session.parameters).reduce((acc, paramId) => {
							acc[paramId] = createParameterStore(createDefaultParameterExecutor(session, paramId));

							return acc;
						}, {} as IParameterStores)
					} // Create new parameter stores
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

	useParameters: (sessionId: string) => {
		return get().parameterStores[sessionId] || {};
	},

	useParameter: (sessionId: string, paramId: string) => {
		return get().useParameters(sessionId)[paramId] || {};
	},

	useExports: (sessionId: string) => {
		return get().exportStores[sessionId] || {};
	},

	useExport: (sessionId: string, exportId: string) => {
		return get().useExports(sessionId)[exportId] || {};
	}
}
), { ...devtoolsSettings, name: "ShapeDiver | Parameters" }));
