import { IExportApi } from "@shapediver/viewer";
import { IParameterApi } from "@shapediver/viewer/src/interfaces/session/IParameterApi";



/**
 * TODO: 
 * 
 * 1) change this to the following type:
 * export type IParameters = { [sessionId: string]: { [parameterId: string]: ISdReactParameter<any> } };
 * 
 * 2) change all parameter components to **only** take an SdReactParameter as input
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
