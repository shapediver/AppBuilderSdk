import { IExportApi } from "@shapediver/viewer";
import { IParameterApi } from "@shapediver/viewer/src/interfaces/session/IParameterApi";



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
export type IParameters = { [sessionId: string]: { [parameterId: string]: IParameterApi<any> } };

export type IExports = { [sessionId: string]: { [exportId: string]: IExportApi } };

export interface ShapediverSliceUIState {
	parameters: IParameters;
	parameterPropertyChange: <T extends keyof IParameterApi<any>>(
		sessionId: string,
		parameterId: string,
		property: T,
		value: IParameterApi<any>[T]
	) => void;
	exports: IExports;
	exportRequest: (sessionId: string, exportId: string) => Promise<void>;
}
