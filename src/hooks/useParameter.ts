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
export function useParameter<T>(sessionId: string, parameterId: string) {
	
	const parametersStore = useShapeDiverStoreParameters();
	const parameter = parametersStore.getParameter(sessionId, parameterId)!(state => state as IShapeDiverParameter<T>);

	return parameter;
}
