import { useShapeDiverStoreParameters } from "store/useShapeDiverStoreParameters";
import { IShapeDiverParameter } from "types/shapediver/parameter";

/**
 * Hook providing a shortcut to abstracted parameters managed by {@link useShapeDiverStoreParameters}. 
 * 
 * @see {@link IShapeDiverParameter<T>}
 * 
 * @param sessionId 
 * @param parameterId Id, name, or displayname of the parameter
 * @returns 
 */
export function useParameterStateless<T>(sessionId: string, parameterId: string) {
	
	const parametersStore = useShapeDiverStoreParameters();
	const paramStore = parametersStore.getParameter(sessionId, parameterId);

	return paramStore ? paramStore.getState() as IShapeDiverParameter<T> : undefined;
}
