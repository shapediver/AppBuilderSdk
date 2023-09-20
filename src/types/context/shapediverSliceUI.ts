import { IExportApi } from "@shapediver/viewer";
import { IParameterApi } from "@shapediver/viewer/src/interfaces/session/IParameterApi";

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
