import { create } from "zustand";
import { ISdReactParameter, ISdReactParameterState } from "types/shapediver/parameter";
import { ISessionApi } from "@shapediver/viewer";
import { devtools } from "zustand/middleware";
import { devtoolsSettings } from "./storeSettings";
import { IParameterStores, IParameterStoresPerSession, IShapeDiverStoreParameters } from "types/store/shapediverStoreParameters";

/**
 * Create store for a single parameter.
 */
export function createParameterStore<T>(session: ISessionApi, paramId: string) { 
	const param = session.parameters[paramId];
	const definition = param;
	const state: ISdReactParameterState<T> = {
		uiValue: definition.value,
		execValue: definition.value,
		locked: false
	};
	return create<ISdReactParameter<T>>((set, get) => ({
		definition,
		state,
		actions: {
			setUiValue: function (uiValue: string | T): boolean {
				const actions = get().actions;
				if (!actions.isValid(uiValue, false)) return false;
				set((_state) => ({
					state: {
						..._state.state,
						uiValue
					}
				}));
				return true;
			},
			execute: async function (): Promise<boolean> {
				const state = get().state;
				param.value = state.uiValue;
				await session.customize();
				set((_state) => ({
					state: {
						..._state.state,
						execValue: state.uiValue
					}
				}));
				return true;
			},
			isValid: function (value: any, throwError?: boolean | undefined): boolean {
				return param.isValid(value, throwError);
			},
			resetToDefaultValue: function (): void {
				const definition = get().definition;
				param.value = definition.defval;
				set((_state) => ({
					state: {
						..._state.state,
						uiValue: definition.defval
					}
				}));
			},
			resetToExecValue: function (): void {
				const state = get().state;
				param.value = state.execValue;
				set((_state) => ({
					state: {
						..._state.state,
						uiValue: state.execValue
					}
				}));
			},
			stringify: function (): string {
				return param.stringify();
			}
		}
	}));
}

/**
 * Store of parameter stores.
 */
export const useShapediverStoreParameters = create<IShapeDiverStoreParameters>()(devtools((set, get) => ({

	parameterStores: {},

	addSession: (session: ISessionApi) => {
		const sessionId = session.id;
		const parameters = get().parameterStores;
		if (parameters[sessionId]) 
			return;
		const parameterStores: IParameterStores = {}; 
		Object.keys(session.parameters).forEach(paramId => parameterStores[paramId] = createParameterStore(session, paramId));
		set((_state) => ({
			parameterStores: {
				..._state.parameterStores,
				...{ [sessionId]: parameterStores }
			}
		}), false, "addSession");
	},

	removeSession: (sessionId: string) => {
		const parametersPerSession = get().parameterStores;

		// create a new object, omitting the session to be removed
		const parameters: IParameterStoresPerSession = {};
		Object.keys(parametersPerSession).forEach(id => {
			if (id !== sessionId)
				parameters[id] = parametersPerSession[id];
		});

		set(() => ({
			parameterStores: parameters,
		}), false, "removeSession");
	},

	useParameter: (sessionId: string, paramId: string) => {
		const store = get().parameterStores[sessionId][paramId];
		return store;
	}

}
), { ...devtoolsSettings, name: "ShapeDiver | Parameters" }));
