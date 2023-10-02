import { IExportApi } from "@shapediver/viewer";
import { ISdReactParameter } from "../shapediver/shapediverUi";

/**
 * TODO:
 *
 * 1) Change the type of IParameters to the following type:
 * export type IParameters = { [sessionId: string]: { [parameterId: string]: ISdReactParameter<any> } };
 *
 * 2) Change all parameter components to **only** take an ISdReactParameter as input.
 *    The parameter components must **not** access the store directly.
 *
 * 3) Change ParameterUiComponent to take an object of type { [parameterId: string]: IParameterApi<any> }
 *    instead of a session id. ParameterUiComponent must **not** access the store directly.
 *
 */
export type IParametersSession = { [parameterId: string]: ISdReactParameter<any> } | undefined;
export type IParameters = { [sessionId: string]: IParametersSession };
export type IExports = { [sessionId: string]: { [exportId: string]: IExportApi } };

export interface ShapediverStoreUIState {
	parameters: IParameters;
	parametersSessionSet: (sessionId: string, parameters: IParametersSession) => void,
	parametersSessionGet: (sessionId: string) => IParametersSession,
	exports: IExports;
	exportRequest: (sessionId: string, exportId: string) => Promise<void>;
}
